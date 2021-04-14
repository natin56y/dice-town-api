
import { Logger } from '@nestjs/common';
import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
  } from '@nestjs/websockets';
  import { from, Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway(3003)
  export class EventsGateway {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger("EventsGateway")

  
    afterInit(server: Server) {    
      this.logger.log("Initialized!")
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log("events client disconnected!", client.id)
    }
  
    handleConnection(client: Socket, ...args: any[]) {
      this.logger.log("events client connected!", client.id)
      client.emit('connected', "hey")
    }

    @SubscribeMessage('events')
    findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
      return from([1, 2, 3]).pipe(map(item => ({ event: 'events', data: item })));
    }
  
    @SubscribeMessage('identity')
    async identity(@MessageBody() data: number): Promise<number> {
      return data;
    }
  }