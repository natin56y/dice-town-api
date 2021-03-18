import { Module } from '@nestjs/common';
import { ChatModule } from 'modules/chat/chat.module';
import { MessageService } from 'modules/chat/message.service';
import { GameModule } from 'modules/game/game.module';
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
