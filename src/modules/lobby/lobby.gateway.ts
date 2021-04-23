import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { Dice } from '../../entities/game/dice';
import { GameStatus } from '../../entities/game/enums/game-status.enum';
import { ReadyStatus } from '../../entities/lobby/ready-status';
import { GameService } from '../game/game.service';
import { Server, Socket } from 'socket.io';
import { LobbyService } from './lobby.service';
import { DiceValue } from '../../entities/game/dice-value.enum';
import { Result } from '../../entities/game/gameResults';

const { WEBSOCKETS_PORT_LOBBY } = process.env

@WebSocketGateway(parseInt(WEBSOCKETS_PORT_LOBBY))
export class LobbyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{
  
  @WebSocketServer()
  server: Server;
  
  private logger: Logger = new Logger("LobbyGateway")

  constructor(private lobbyService: LobbyService, private gameService: GameService){
  }
  
  afterInit(server: Server) {    
    this.logger.log("Initialized!")
  }

  handleDisconnect(client: Socket) {
    this.logger.log("client disconnected! " + client.id)
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log("client connected! " + client.id)
  }

  @SubscribeMessage('updateReadyStatus')
  async updateReadyStatus(client: Socket, readyStatus: ReadyStatus) {
    const lobby = await this.lobbyService.changeReadyStatus(readyStatus)
    this.server.to(lobby.id.toString()).emit('updatedReadyStatus', lobby.readyStatus)
  }

  @SubscribeMessage('joinLobbySocket')
  joinLobby(client: Socket, body: {lobbyId: string, username: string, uid: string}){
    this.server.to(body.lobbyId).emit('userJoinedLobby', body.username)
    client.join(body.lobbyId)
    client.emit('joinedLobbySocket', body.lobbyId)
  }

  @SubscribeMessage('leaveLobbySocket')
  async leaveLobby(client: Socket, body: {lobbyId: string, username: string, uid: string}){
    client.leave(body.lobbyId)
    client.emit('leftLobbySocket', body.lobbyId)
    this.server.to(body.lobbyId).emit('userLeftLobby', body.username)

    let lobby = await this.lobbyService.findOneById(parseInt(body.lobbyId))
    if(lobby)
      this.updateReadyStatus(client, new ReadyStatus(parseInt(body.lobbyId), parseInt(body.uid), false))
  }
  
  @SubscribeMessage('switchStartGame')
  async switchStartGame(client: Socket, body: {lobbyId: string, isGame: boolean}){
    const lobby = await this.lobbyService.switchStartGame(parseInt(body.lobbyId))
    if(!body.isGame && lobby.game){
      this.server.to(body.lobbyId).emit('recieveAlert', 'Game started!')
    }
    this.server.to(body.lobbyId).emit('startGameSwitched', lobby)
  }
  
  @SubscribeMessage('setDices')
  async setDices(client: Socket, body: {dices: Dice[], lobbyId: number, userId: number}){
    const lobby = await this.lobbyService.findOneLobbyPopulate({id: body.lobbyId})
    let game = lobby.game

    // add dices to player
    game.players.forEach(player => {
      if(player.userId === body.userId){
        player.dices.push(...body.dices)
      }
    })

    // player pays his move
    let costs = this.computeCosts(body.dices)
    game.players.forEach(player => {
      if(player.userId === body.userId)
        player.dollar -= costs
    })
    game.income += costs
    
    // update waiting list
    game.waitingFor = game.waitingFor.filter(userId => userId !== body.userId)

    // if its the last dice throw of the users
    if(game.waitingFor.length === 0){
      game.players.forEach(player => {

        // set state of user in new dice throw
        if(player.dices.length < 5){
          game.waitingFor.push(player.userId)
          player.canThrowDices = true
        }else{
          player.canThrowDices = false
        }

        //un-hide dices
        player.dices.forEach(dice => dice.hidden = false)
      })
    }else{

      //set user has rolled his dice
      game.players.forEach(player => {
        if(player.userId === body.userId){
          player.canThrowDices = false
        }
      })
    }
    
    
    //go to next game status if all players have all their dices
    if(!game.players.find(player => player.dices.length < 5)){
      game.status = GameStatus.NUGGETS_RESULT
      
      //compute winners of categories
      game.results.dice9 = new Result(this.gameService.getWinners(DiceValue.DICE9, game), false, "dice9")
      game.results.dice10 = new Result(this.gameService.getWinners(DiceValue.DICE10, game), true, "dice10")
      game.results.diceStore = new Result(this.gameService.getWinners(DiceValue.DICE11, game), true, "diceStore")
      game.results.diceSaloon = new Result(this.gameService.getWinners(DiceValue.DICE12, game), true, "diceSaloon")
      game.results.diceSherif = new Result(this.gameService.getWinners(DiceValue.DICE13, game), true, "diceSherif")
      game.results.diceAce = new Result(this.gameService.getWinners(DiceValue.DICE14, game), true, "diceAce")

      game.players.forEach( player => {
        player.dices.sort((a,b) => {
          if(a.value > b.value)
            return 1
          if(a.value < b.value)
            return -1
          return 1
        })
      })
    }  

    game = await this.gameService.save(game)
    
    this.server.to(body.lobbyId.toString()).emit('updateGame', game)
  }

  @SubscribeMessage('chooseWinner')
  async chooseWinner(client: Socket, body: {lobbyId: number, gameId: number, result: Result}){
    
    let game = await this.gameService.findOneById(body.gameId)

    game.results[body.result.dice].ids = body.result.ids   
    game.results[body.result.dice].isSherifResolve = true   

    game = await this.gameService.save(game)

    this.server.to(body.lobbyId.toString()).emit('updateResults', game.results)
  }

  computeCosts(dices: Dice[]): number{
    if(!dices.length)
      return 1
    return dices.length - 1
  }
}

