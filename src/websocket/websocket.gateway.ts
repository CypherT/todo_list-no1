import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
// Import types cho Todo nếu cần (từ todos module)
// import { Todo } from '../todos/entities/todo.entity';

/**
 * WebSocket Gateway xử lý real-time events cho chat và todo broadcasts.
 * Tích hợp Redis để track clients.
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Event names constants
  private readonly EVENTS = {
    MESSAGE: 'message',
    TODO_CREATED: 'todo:created',
    TODO_UPDATED: 'todo:updated',
    TODO_DELETED: 'todo:deleted',
    CLIENTS_COUNT: 'clients:count',
    CONNECTION: 'connection',
  } as const;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Xử lý khi client kết nối.
   */
  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    const clientData = {
      id: client.id,
      connectedAt: new Date().toISOString(),
    };

    // Lưu thông tin client vào Redis (hSet là hash set)
    try {
      await this.redisService.hSet(
        'ws:clients',
        client.id,
        JSON.stringify(clientData),
      );
    } catch (error) {
      console.warn(`Lỗi lưu client ${client.id} vào Redis:`, error);
    }

    // Gửi thông báo cho client
    client.emit(this.EVENTS.CONNECTION, {
      message: 'Connected to WebSocket server',
      clientId: client.id,
    });

    // Broadcast số lượng client
    await this.broadcastClientsCount();
  }

  /**
   * Xử lý khi client ngắt kết nối.
   */
  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Xóa thông tin client khỏi Redis (hDel là hash delete)
    try {
      await this.redisService.hDel('ws:clients', client.id);
    } catch (error) {
      console.warn(`Lỗi xóa client ${client.id} từ Redis:`, error);
    }

    // Broadcast số lượng client còn lại
    await this.broadcastClientsCount();
  }

  /**
   * Broadcast số lượng clients hiện tại.
   */
  private async broadcastClientsCount() {
    try {
      const clients = await this.redisService.hGetAll('ws:clients');
      this.server.emit(this.EVENTS.CLIENTS_COUNT, {
        count: Object.keys(clients).length,
      });
    } catch (error) {
      console.warn('Lỗi lấy clients count từ Redis:', error);
    }
  }

  /**
   * Xử lý message từ client (chat).
   */
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Message from ${client.id}:`, data);

    // Validate message không rỗng
    if (!data.message?.trim()) {
      client.emit('error', { message: 'Message không được rỗng' });
      return;
    }

    // Gửi lại message cho tất cả clients
    this.server.emit(this.EVENTS.MESSAGE, {
      clientId: client.id,
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Xử lý event todo created từ client (nếu cần).
   */
  @SubscribeMessage('todo:created')
  handleTodoCreated(@MessageBody() data: any) {
    // Thay any bằng Todo nếu import
    console.log('Todo created event received:', data);
    // Broadcast khi có todo mới được tạo
    this.server.emit(this.EVENTS.TODO_CREATED, data);
  }

  /**
   * Xử lý event todo updated từ client.
   */
  @SubscribeMessage('todo:updated')
  handleTodoUpdated(@MessageBody() data: any) {
    // Thay any bằng Todo
    console.log('Todo updated event received:', data);
    // Broadcast khi có todo được cập nhật
    this.server.emit(this.EVENTS.TODO_UPDATED, data);
  }

  /**
   * Xử lý event todo deleted từ client.
   */
  @SubscribeMessage('todo:deleted')
  handleTodoDeleted(@MessageBody() data: any) {
    // Thay any bằng { id: number }
    console.log('Todo deleted event received:', data);
    // Broadcast khi có todo bị xóa
    this.server.emit(this.EVENTS.TODO_DELETED, data);
  }

  // Methods để emit event từ service khác (ví dụ: TodosService)
  emitTodoCreated(todo: any) {
    // Thay any bằng Todo
    console.log('Broadcasting todo created:', todo);
    this.server.emit(this.EVENTS.TODO_CREATED, todo);
  }

  emitTodoUpdated(todo: any) {
    // Thay any bằng Todo
    console.log('Broadcasting todo updated:', todo);
    this.server.emit(this.EVENTS.TODO_UPDATED, todo);
  }

  emitTodoDeleted(todoId: number) {
    console.log('Broadcasting todo deleted:', { id: todoId });
    this.server.emit(this.EVENTS.TODO_DELETED, { id: todoId });
  }
}
