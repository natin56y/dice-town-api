import { Body, Request, Controller, Delete, Get, HttpException, HttpStatus, Post, Put, Query, UseGuards, Param, forwardRef, Inject } from '@nestjs/common';
import { MessageService } from '../chat/message.service';
import { GameService } from '../game/game.service';
import { Lobby } from '../../entities/lobby.entity';
import JwtAuthenticationGuard from '../authentication/passport/jwt-authentication.guard';
import RequestWithUser from '../authentication/requestWithUser.interface';
import { LobbyService } from './lobby.service';

@Controller('lobby')
@UseGuards(JwtAuthenticationGuard)
export class LobbyController {

  constructor(private readonly lobbyService: LobbyService,
              private readonly gameService: GameService,
              @Inject(forwardRef(() => MessageService))
              private readonly messageService: MessageService,
              ) {}


  @Get(':code')
  async get(@Param() params): Promise<Lobby> {
    const code = params.code
    if (!code)
      throw new HttpException('CODE parameter is missing', HttpStatus.BAD_REQUEST);

    const room = await this.lobbyService.findOneLobbyPopulate({code: code})

    if (!room)
      throw new HttpException(`The room with the code: ${code} does not exists`, HttpStatus.BAD_REQUEST);

    return room;
  }

  @Post()
  async create(@Request() req: RequestWithUser): Promise<Lobby> {
    return await this.lobbyService.create(req.user.id);
  }

  @Put(':id')
  async update(@Request() req: RequestWithUser, @Param('id') id) {
    if (!id)
      throw new HttpException(
        'ID parameter is missing',
        HttpStatus.BAD_REQUEST,
      );

    await this.lobbyService.updateFields(id, req.body);
  }
  
  @Put(':code/join/:uid')
  async addUserToLobby(@Request() req: RequestWithUser, @Param('code') code, @Param('uid') uid) {    
    if(req.user.id != uid)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    if (!code || !uid)
      throw new HttpException('CODE or UID parameter is missing', HttpStatus.BAD_REQUEST);
    return await this.lobbyService.addUserToLobby(uid, code);
  }
  
  @Put(':code/quit/:uid')
  async removeUserToLobby(@Request() req: RequestWithUser, @Param('code') code, @Param('uid') uid) {    
    if(req.user.id != uid)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    if (!code || !uid)
      throw new HttpException('CODE or UID parameter is missing', HttpStatus.BAD_REQUEST);

    return await this.lobbyService.removeUserFromLobby(uid, code);
  }

  @Delete(':code')
  public async delete(@Request() req, @Param('code') code) {
    if (!code)
      throw new HttpException(
        'ID parameter is missing',
        HttpStatus.BAD_REQUEST,
      );
      
    await this.lobbyService.getRepository().delete({code})
    return new HttpException('Deleted', HttpStatus.NO_CONTENT)
  }

  @Post(':id/test')
  public async test(@Param('id') id){
    return await this.lobbyService.startResultSequence(id)
  }
}
