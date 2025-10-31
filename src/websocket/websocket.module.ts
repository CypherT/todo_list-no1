import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  providers: [WebsocketGateway],
  exports: [WebsocketGateway], // Export để dùng ở module khác nếu cần
})
export class WebsocketModule {}
