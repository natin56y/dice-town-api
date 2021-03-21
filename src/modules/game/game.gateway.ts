import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { Game } from 'entities/game/game.entity';
import { Server, Socket } from 'socket.io';

const { WEBSOCKETS_PORT } = process.env

@WebSocketGateway(
  parseInt(WEBSOCKETS_PORT),
  {
    path: '/websockets',
    serveClient: true,
    namespace: '/game'
  }
)
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{
  
  @WebSocketServer()
  server: Server;
  
  private logger: Logger = new Logger("GameGateway")

  constructor(){

  }
  
  afterInit(server: Server) {    
    this.logger.log("Initialized!")
  }

  handleDisconnect(client: Socket) {
    //this.logger.log("client disconnected!", client.id)
  }

  handleConnection(client: Socket, ...args: any[]) {
    //this.logger.log("client connected!", client.id)
  }

  @SubscribeMessage('readyUp')
  async readyUp(client: Socket, game: Game) {
    //save game
    this.server.to(game.id.toString()).emit('updateGame', game)
  }

  @SubscribeMessage('joinGame')
  handleJoinRoom(client: Socket, game: string){
    client.join(game)
    client.emit('joinedGame', game)
  }
  @SubscribeMessage('leaveGame')
  handleLeaveRoom(client: Socket, game: string){
    client.leave(game)
    client.emit('leftGame', game)
  }
}

export class UpdateGame{
  constructor(public game: string, public uid: number, public status: boolean, public step: GameStep){}
}

export enum GameStep {
  BEFORE_START,
  START,  
}