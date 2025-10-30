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

interface MessagePayload {
  message: string;
}

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

  constructor(private readonly redisService: RedisService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // Lưu thông tin client vào Redis
    await this.redisService.hSet(
      'ws:clients',
      client.id,
      JSON.stringify({
        id: client.id,
        connectedAt: new Date().toISOString(),
      }),
    );

    // Gửi thông báo cho client
    client.emit('connection', {
      message: 'Connected to WebSocket server',
      clientId: client.id,
    });

    // Broadcast số lượng client đang kết nối
    const clients = await this.redisService.hGetAll('ws:clients');
    this.server.emit('clients:count', { count: Object.keys(clients).length });
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Xóa thông tin client khỏi Redis
    await this.redisService.hDel('ws:clients', client.id);

    // Broadcast số lượng client còn lại
    const clients = await this.redisService.hGetAll('ws:clients');
    this.server.emit('clients:count', { count: Object.keys(clients).length });
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Message from ${client.id}:`, data);

    // Gửi lại message cho tất cả clients
    this.server.emit('message', {
      clientId: client.id,
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('todo:created')
  handleTodoCreated(@MessageBody() data: any) {
    // Broadcast khi có todo mới được tạo
    this.server.emit('todo:created', data);
  }

  @SubscribeMessage('todo:updated')
  handleTodoUpdated(@MessageBody() data: any) {
    // Broadcast khi có todo được cập nhật
    this.server.emit('todo:updated', data);
  }

  @SubscribeMessage('todo:deleted')
  handleTodoDeleted(@MessageBody() data: any) {
    // Broadcast khi có todo bị xóa
    this.server.emit('todo:deleted', data);
  }

  // Method để emit event từ service khác
  emitTodoCreated(todo: any) {
    this.server.emit('todo:created', todo);
  }

  emitTodoUpdated(todo: any) {
    this.server.emit('todo:updated', todo);
  }

  emitTodoDeleted(todoId: number) {
    this.server.emit('todo:deleted', { id: todoId });
  }
}
