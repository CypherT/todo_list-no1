import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';

interface ClientInfo {
  ws: WebSocket;
  userId: number;
  email: string;
  id: string;
}

interface TodoEvent {
  action: 'created' | 'updated' | 'deleted';
  todo?: any;
  todoId?: number;
  userId: number;
}

interface JwtPayload {
  sub: number; // Phải là 'number' để khớp với ClientInfo.userId
  email: string;
  iat: number;
  exp: number;
}

@WebSocketGateway({ cors: true })
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private clients = new Map<string, ClientInfo>();
  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(@ConnectedSocket() client: WebSocket, ...args: any[]) {
    try {
      // Extract token from query params
      const request = args[0] as IncomingMessage;
      const { query } = parse(request.url || '', true);
      const token = query.token as string;

      if (!token) {
        this.logger.warn('❌ Connection rejected: No token provided');
        client.send(
          JSON.stringify({
            type: 'error',
            data: { message: 'Token required in query params' },
          }),
        );
        client.close();
        return;
      }

      // Verify JWT token
      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync(token, {
          secret: String(process.env.JWT_SECRET) || 'secretKey',
        });
      } catch {
        this.logger.warn('❌ Connection rejected: Invalid token');
        client.send(
          JSON.stringify({
            type: 'error',
            data: { message: 'Invalid or expired token' },
          }),
        );
        client.close();
        return;
      }

      // Store client info with userId
      const clientId = `${payload.sub}-${Date.now()}`;
      const clientInfo: ClientInfo = {
        ws: client,
        id: clientId,
        userId: payload.sub,
        email: payload.email,
      };

      this.clients.set(clientId, clientInfo);
      this.logger.log(
        `✅ Client connected: ${clientId} (User: ${payload.email})`,
      );

      // Send welcome message
      this.sendToClient(client, 'connected', {
        message: 'Connected to WebSocket server',
        clientId,
        userId: payload.sub,
      });
    } catch (error) {
      this.logger.error('❌ Connection error:', error);
      client.close();
    }
  }

  handleDisconnect(@ConnectedSocket() client: WebSocket) {
    let clientId: string | undefined;
    this.clients.forEach((info, id) => {
      if (info.ws === client) {
        clientId = id;
      }
    });

    if (clientId) {
      const clientInfo = this.clients.get(clientId);
      this.clients.delete(clientId);
      this.logger.log(
        `🔌 Client disconnected: ${clientId} (User: ${clientInfo?.email})`,
      );
    }
  }

  // Broadcast todo event to all devices of a specific user
  broadcastToUser(userId: number, event: TodoEvent) {
    let sentCount = 0;
    this.clients.forEach((clientInfo) => {
      if (clientInfo.userId === userId && clientInfo.ws.readyState === 1) {
        this.sendToClient(clientInfo.ws, 'todo_sync', event);
        sentCount++;
      }
    });

    this.logger.log(
      `📤 Broadcast to user ${userId}: ${event.action} (${sentCount} devices)`,
    );
  }

  // Handle manual ping from client
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: WebSocket) {
    this.sendToClient(client, 'pong', { timestamp: Date.now() });
  }

  private sendToClient(client: WebSocket, type: string, data: unknown): void {
    if (client.readyState === 1) {
      // WebSocket.OPEN
      client.send(JSON.stringify({ type, data }));
    }
  }

  // Get connected devices count for a user
  getUserDeviceCount(userId: number): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.userId === userId) count++;
    });
    return count;
  }
}
