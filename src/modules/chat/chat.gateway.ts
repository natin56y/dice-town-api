import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { Message } from '../../entities/chat/message.entity';
import { SocketMessage } from '../../entities/chat/messageSocket';
import { LobbyService } from '../lobby/lobby.service';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';

const { WEBSOCKETS_PORT } = process.env

@WebSocketGateway(
  parseInt(WEBSOCKETS_PORT),
  {
    path: '/websockets',
    serveClient: true,
    namespace: '/chat',
    transports: [
      'websocket', 
      'polling'
    ],
    origins: [
      "http://88.121.191.251:9090/",
      "http://localhost:4200/"
    ]
  }
)
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{
  
  @WebSocketServer()
  server: Server;
  
  private logger: Logger = new Logger("ChatGateway")

  constructor(private messageService: MessageService,
              private lobbyService: LobbyService){

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

  @SubscribeMessage('chatToRoom')
  async handleMessageAll(client: Socket, socketMessage: SocketMessage) {

    const message = new Message()
    message.user = socketMessage.user
    message.room = socketMessage.room
    message.message = socketMessage.message

    let messageDB = await this.messageService.save(message)
    this.lobbyService.addMessageToLobby(messageDB, socketMessage.lobbyId)
  
    this.server.to(message.room).emit('recieveMessage', message)
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string){
    client.join(room)
    client.emit('joinedRoom', room)
  }
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string){
    client.leave(room)
    client.emit('leftRoom', room)
  }
}