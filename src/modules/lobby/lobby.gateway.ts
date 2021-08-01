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
import { GameEvent } from 'entities/lobby/game-event';

const { WEBSOCKETS_PORT_LOBBY } = process.env

@WebSocketGateway(parseInt(WEBSOCKETS_PORT_LOBBY), {
})
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

  @SubscribeMessage('ping')
  ping(client: Socket, msg: string){
    client.emit('pong')
  }

  @SubscribeMessage('updateReadyStatus')
  async updateReadyStatus(client: Socket, readyStatus: ReadyStatus) {
    this.server.to(readyStatus.lobbyId.toString()).emit('updatedReadyStatus', readyStatus)
    await this.lobbyService.changeReadyStatus(readyStatus)
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
      this.server.to(`${body.lobbyId}`).emit('event', new GameEvent('Round results'))
      lobby.events.push(new GameEvent('Round results'))
      
      //compute winners of categories
      game.results.dice9 = new Result(this.gameService.getWinners(DiceValue.DICE9, game), false, "dice9", false, true)
      game.results.dice10 = new Result(this.gameService.getWinners(DiceValue.DICE10, game), true, "dice10", false, true)
      game.results.diceStore = new Result(this.gameService.getWinners(DiceValue.DICE11, game), true, "diceStore")
      game.results.diceSaloon = new Result(this.gameService.getWinners(DiceValue.DICE12, game), true, "diceSaloon")
      game.results.diceSherif = new Result(this.gameService.getWinners(DiceValue.DICE13, game), true, "diceSherif", false, true)
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

    this.server.to(body.lobbyId.toString()).emit('updateGame', game)
    
    await this.gameService.save(game)
    await this.lobbyService.save(lobby)
    
  }

  @SubscribeMessage('chooseWinner')
  async chooseWinner(client: Socket, body: {lobbyId: number, gameId: number, result: Result}){
    
    let game = await this.gameService.findOneById(body.gameId)

    game.results[body.result.dice].ids = body.result.ids   
    game.results[body.result.dice].isSherifResolve = true   


    this.server.to(body.lobbyId.toString()).emit('updateResults', game.results)
    
    game = await this.gameService.save(game)

  }
  
  @SubscribeMessage('redeemResult')
  async redeemResult(client: Socket, body: {lobbyId: number, gameId: number, result: Result}){
    
    let game = await this.gameService.findOneById(body.gameId)

    game.results[body.result.dice].isRedeemed = true

    switch(body.result.dice){
      case "dice9":
        const wonNuggets: number = this.lobbyService.countPlayerDice(game, 9, body.result.ids[0])
        game.players[game.players.findIndex(p => p.userId === body.result.ids[0])].nuggets += wonNuggets
        game.nuggets -= wonNuggets
        game.results.dice10.isHidden = false
        game.status = GameStatus.BANK_RESULT
        break;
      case "dice10":
        game.players[game.players.findIndex(p => p.userId === body.result.ids[0])].dollar += game.dollar
        game.dollar = game.income
        game.income = 0
        game.results.diceStore.isHidden = false
        game.status = GameStatus.GENERAL_STORMS_RESULT

        break;
      case "diceStore":

        game.results.diceSaloon.isHidden = false
        game.status = GameStatus.SALOON_RESULT

        break;
      case "diceSaloon":

        game.results.diceSherif.isHidden = false
        game.status = GameStatus.SHERIF_RESULT

        break;
      case "diceSherif":

        game.status = GameStatus.PROPERTY_RESULT

        break;
      case "diceAce":

        break;
    }

    this.server.to(body.lobbyId.toString()).emit('updateResults', game.results)
    
    game = await this.gameService.save(game)

  }

  computeCosts(dices: Dice[]): number{
    if(!dices.length)
      return 1
    return dices.length - 1
  }
}

