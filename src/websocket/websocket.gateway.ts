import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Injectable } from '@nestjs/common';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface ClientInfo {
  id: string;
  userId?: number;
  deviceName?: string;
  connectedAt: string;
  readyState: number;
}

/**
 * WebSocket Gateway sử dụng Native WS (không Socket.IO)
 * Quản lý đồng bộ Todo giữa các thiết bị của cùng 1 user
 */
@Injectable()
@WebSocketGateway()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Map lưu client connections: clientId -> { ws, userId, deviceName }
  private clients = new Map<
    string,
    { ws: WebSocket; userId?: number; deviceName?: string }
  >();

  // Map lưu user connections: userId -> Set<clientIds>
  private userConnections = new Map<number, Set<string>>();

  private readonly EVENTS = {
    AUTH: 'auth',
    TODO_CREATED: 'todo:created',
    TODO_UPDATED: 'todo:updated',
    TODO_DELETED: 'todo:deleted',
    ERROR: 'error',
  } as const;

  /**
   * Xử lý khi client kết nối
   */
  handleConnection(client: WebSocket) {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.clients.set(clientId, { ws: client, userId: undefined });

    console.log(`✅ Client connected: ${clientId}`);

    // Gửi clientId cho client để lưu
    this.sendToClient(client, 'connection', {
      message: 'Connected to WebSocket server',
      clientId,
    });

    // Gắn clientId vào object ws để dùng sau
    (client as any).id = clientId;
  }

  /**
   * Xử lý khi client ngắt kết nối
   */
  handleDisconnect(client: WebSocket) {
    const clientId = (client as any).id;

    if (!clientId) return;

    const clientInfo = this.clients.get(clientId);

    if (!clientInfo) {
      console.log(`❌ Client disconnected (not tracked): ${clientId}`);
      return;
    }

    const userId = clientInfo.userId;

    console.log(
      `❌ Client disconnected: ${clientId}, User: ${userId || 'not authenticated'}`,
    );

    // Xóa client khỏi danh sách
    this.clients.delete(clientId);

    // Xóa client khỏi user connections
    if (userId) {
      const userDevices = this.userConnections.get(userId);
      if (userDevices) {
        userDevices.delete(clientId);
        if (userDevices.size === 0) {
          this.userConnections.delete(userId);
          console.log(`👤 User ${userId} has no more active devices`);
        } else {
          console.log(
            `👤 User ${userId} still has ${userDevices.size} active device(s)`,
          );
        }
      }
    }
  }

  /**
   * Xác thực user - client gửi userId
   * Message format: { type: 'auth', data: { userId: number, deviceName?: string } }
   */
  @SubscribeMessage('auth')
  handleAuth(
    @MessageBody() message: { type: string; data: any },
    @ConnectedSocket() client: WebSocket,
  ) {
    const clientId = (client as any).id;
    const { userId, deviceName } = message.data;

    if (!userId || userId <= 0) {
      this.sendToClient(client, this.EVENTS.ERROR, {
        message: 'Invalid userId',
      });
      return;
    }

    // Cập nhật client info
    const clientInfo = this.clients.get(clientId);
    if (clientInfo) {
      clientInfo.userId = userId;
      clientInfo.deviceName = deviceName || `Device_${Date.now()}`;
    }

    // Thêm client vào user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)?.add(clientId);

    console.log(
      `🔐 User ${userId} authenticated | Device: ${deviceName || 'Unknown'} | Total devices: ${this.userConnections.get(userId)?.size}`,
    );

    // Gửi xác nhận
    this.sendToClient(client, this.EVENTS.AUTH, {
      success: true,
      userId,
      deviceName: deviceName || `Device_${Date.now()}`,
      message: 'Authentication successful',
    });
  }

  /**
   * Xử lý todo được tạo - broadcast tới tất cả thiết bị của user
   */
  @SubscribeMessage('todo:created')
  handleTodoCreated(
    @MessageBody() message: { type: string; data: any },
    @ConnectedSocket() client: WebSocket,
  ) {
    const clientId = (client as any).id;
    const clientInfo = this.clients.get(clientId);

    if (!clientInfo?.userId) {
      this.sendToClient(client, this.EVENTS.ERROR, {
        message: 'Not authenticated',
      });
      return;
    }

    const userId = clientInfo.userId;
    const todo = message.data;

    console.log(`📝 Todo created by user ${userId}:`, todo.title);

    // Broadcast tới tất cả thiết bị của user
    this.broadcastToUserDevices(userId, this.EVENTS.TODO_CREATED, todo);
  }

  /**
   * Xử lý todo được cập nhật
   */
  @SubscribeMessage('todo:updated')
  handleTodoUpdated(
    @MessageBody() message: { type: string; data: any },
    @ConnectedSocket() client: WebSocket,
  ) {
    const clientId = (client as any).id;
    const clientInfo = this.clients.get(clientId);

    if (!clientInfo?.userId) {
      this.sendToClient(client, this.EVENTS.ERROR, {
        message: 'Not authenticated',
      });
      return;
    }

    const userId = clientInfo.userId;
    const todo = message.data;

    console.log(`✏️  Todo updated by user ${userId}:`, todo.title);

    // Broadcast tới tất cả thiết bị của user
    this.broadcastToUserDevices(userId, this.EVENTS.TODO_UPDATED, todo);
  }

  /**
   * Xử lý todo được xóa
   */
  @SubscribeMessage('todo:deleted')
  handleTodoDeleted(
    @MessageBody() message: { type: string; data: any },
    @ConnectedSocket() client: WebSocket,
  ) {
    const clientId = (client as any).id;
    const clientInfo = this.clients.get(clientId);

    if (!clientInfo?.userId) {
      this.sendToClient(client, this.EVENTS.ERROR, {
        message: 'Not authenticated',
      });
      return;
    }

    const userId = clientInfo.userId;
    const todoId = message.data.id;

    console.log(`🗑️  Todo deleted by user ${userId}: ID ${todoId}`);

    // Broadcast tới tất cả thiết bị của user
    this.broadcastToUserDevices(userId, this.EVENTS.TODO_DELETED, {
      id: todoId,
    });
  }

  /**
   * Emit từ service (TodosService gọi)
   */
  emitTodoCreated(todo: any, userId: number) {
    console.log(`📤 Emitting todo created for user ${userId}`);
    this.broadcastToUserDevices(userId, this.EVENTS.TODO_CREATED, todo);
  }

  emitTodoUpdated(todo: any, userId: number) {
    console.log(`📤 Emitting todo updated for user ${userId}`);
    this.broadcastToUserDevices(userId, this.EVENTS.TODO_UPDATED, todo);
  }

  emitTodoDeleted(todoId: number, userId: number) {
    console.log(`📤 Emitting todo deleted for user ${userId}`);
    this.broadcastToUserDevices(userId, this.EVENTS.TODO_DELETED, {
      id: todoId,
    });
  }

  /**
   * Broadcast message tới tất cả thiết bị của 1 user
   */
  private broadcastToUserDevices(userId: number, type: string, data: any) {
    const userDevices = this.userConnections.get(userId);

    if (!userDevices || userDevices.size === 0) {
      console.log(`⚠️  No active devices for user ${userId}`);
      return;
    }

    const message = JSON.stringify({ type, data });

    userDevices.forEach((clientId) => {
      const clientInfo = this.clients.get(clientId);
      if (clientInfo?.ws.readyState === WebSocket.OPEN) {
        clientInfo.ws.send(message);
      }
    });

    console.log(
      `📢 Broadcasted to ${userDevices.size} device(s) of user ${userId}`,
    );
  }

  /**
   * Gửi message tới một client cụ thể
   */
  private sendToClient(client: WebSocket, type: string, data: any) {
    if (client.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, data });
      client.send(message);
    }
  }

  /**
   * Lấy số lượng thiết bị đang active của user
   */
  getUserDevicesCount(userId: number): number {
    return this.userConnections.get(userId)?.size || 0;
  }

  /**
   * Lấy thông tin tất cả client đang kết nối
   */
  getClientsInfo(): ClientInfo[] {
    const result: ClientInfo[] = [];

    this.clients.forEach((clientInfo, clientId) => {
      result.push({
        id: clientId,
        userId: clientInfo.userId,
        deviceName: clientInfo.deviceName,
        connectedAt: new Date().toISOString(),
        readyState: clientInfo.ws.readyState,
      });
    });

    return result;
  }

  /**
   * Lấy thông tin user connections
   */
  getUserConnections(): Record<number, string[]> {
    const result: Record<number, string[]> = {};

    this.userConnections.forEach((clientIds, userId) => {
      result[userId] = Array.from(clientIds);
    });

    return result;
  }
}
