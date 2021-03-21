import { Module } from '@nestjs/common';
import { MessageService } from '../chat/message.service';
import { GameModule } from '../game/game.module';
import { UsersModule } from '../users/users.module';
import { LobbyController } from './lobby.controller';
import { LobbyGateway } from './lobby.gateway';
import { LobbyService } from './lobby.service';

@Module({
  imports: [
    UsersModule,
    GameModule,
  ],
  providers: [
    LobbyService,
    LobbyGateway,
    MessageService
  ],
  controllers: [LobbyController],
  exports: [
    LobbyService
  ]
})
export class LobbyModule {}
