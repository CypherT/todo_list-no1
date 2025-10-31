import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Server, WebSocket } from 'ws'; // Import types chuẩn từ 'ws' (cài @types/ws nếu chưa)

interface ClientInfo {
  ws: WebSocket;
  userId?: number;
  deviceName?: string;
  id: string;
}

@WebSocketGateway({ cors: true })
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server; // Type Server từ 'ws' – no error type

  private clients = new Map<string, ClientInfo>();
  private readonly logger = new Logger(WebsocketGateway.name);

  handleConnection(@ConnectedSocket() client: WebSocket) {
    const clientId = uuidv4();
    const clientInfo: ClientInfo = {
      ws: client, // Assign an toàn với WebSocket type
      id: clientId,
      userId: undefined,
      deviceName: undefined,
    };
    this.clients.set(clientId, clientInfo);
    this.logger.log(`✅ Client connected: ${clientId}`);
    this.sendToClient(client, 'connection', {
      message: 'Connected to WebSocket server',
      clientId,
    });
  }

  handleDisconnect(@ConnectedSocket() client: WebSocket) {
    let clientId: string | undefined;
    this.clients.forEach((info, id) => {
      if (info.ws === client) {
        clientId = id;
      }
    });
    if (clientId) {
      this.clients.delete(clientId);
      this.logger.log(`🔌 Client disconnected: ${clientId}`);
    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: unknown) {
    // No unused client
    this.logger.log(`📨 Received: ${JSON.stringify(data)}`);
    // Guard chặt: Check server tồn tại + clients là Set
    if (
      !this.server ||
      !this.server.clients ||
      this.server.clients.size === 0
    ) {
      return; // Early return nếu không ready
    }
    this.server.clients.forEach((c: WebSocket) => {
      // forEach an toàn trên Set<WebSocket>
      if (c.readyState === WebSocket.OPEN) {
        // readyState trên WebSocket type
        this.sendToClient(c, 'broadcast', data);
      }
    });
  }

  private sendToClient(client: WebSocket, type: string, data: unknown): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, data })); // send() an toàn trên WebSocket
    }
  }
}
