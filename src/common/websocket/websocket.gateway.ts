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
  sub: number;
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

  async handleConnection(
    @ConnectedSocket() client: WebSocket,
    ...args: any[]
  ) {
    try {
      const request = args[0] as IncomingMessage;
      const { query } = parse(request.url || '', true);
      const token = query.token as string;

      if (!token) {
        this.logger.warn('❌ Connection rejected: No token provided');
        this.sendToClient(
          client,
          'error',
          {
            message: 'Token required in query params',
          },
          'e',
        );
        client.close();
        return;
      }

      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync(token, {
          secret: String(process.env.JWT_SECRET) || 'secretKey',
        });
      } catch {
        this.logger.warn('❌ Connection rejected: Invalid token');
        this.sendToClient(
          client,
          'error',
          {
            message: 'Invalid or expired token',
          },
          'e',
        );
        client.close();
        return;
      }

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

      this.sendToClient(
        client,
        'connected',
        {
          message: 'Connected to WebSocket server',
          clientId,
          userId: payload.sub,
        },
        null,
      );
    } catch (error) {
      this.logger.error('❌ Connection error:', error);
      client.close();
    }
  }

  handleDisconnect(
    @ConnectedSocket() client: WebSocket,
  ) {
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

  broadcastToUser(userId: number, event: TodoEvent) {
    let sentCount = 0;
    this.clients.forEach((clientInfo) => {
      if (clientInfo.userId === userId && clientInfo.ws.readyState === 1) {
        this.sendToClient(clientInfo.ws, 'todo_sync', event, 't');
        sentCount++;
      }
    });

    this.logger.log(
      `📤 Broadcast to user ${userId}: ${event.action} (${sentCount} devices)`,
    );
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: WebSocket,
  ) {
    this.sendToClient(client, 'pong', { timestamp: Date.now() }, 't');
  }

  private sendToClient(
    client: WebSocket,
    event: string,
    data: unknown,
    type: 't' | 'd' | 'e' | null = 't',
  ): void {
    if (client.readyState === 1) {
      const message: { t?: string; d?: unknown; e?: unknown } = {};
      if (type === 't') {
        message.t = event;
        message.d = data;
      } else if (type === 'd') {
        message.d = data;
      } else if (type === 'e') {
        message.e = data;
      } else {
        message.t = event;
        message.d = data;
      }
      client.send(JSON.stringify(message));
    }
  }

  getUserDeviceCount(userId: number): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.userId === userId) count++;
    });
    return count;
  }
}
