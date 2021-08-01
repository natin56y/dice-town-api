import { Injectable } from '@nestjs/common';
import { Lobby } from '../../entities/lobby.entity';
import { BaseService } from '../../shared/classes/base.service';
import * as crypto from "crypto"
import { UsersService } from '../users/users.service';
import { Message } from '../../entities/chat/message.entity';
import { ReadyStatus } from '../../entities/lobby/ready-status';
import { GameService } from '../game/game.service';
import { DiceValue } from '../../entities/game/dice-value.enum';
import { Game } from '../../entities/game/game.entity';
import { GameEvent } from 'entities/lobby/game-event';

@Injectable()
export class LobbyService extends BaseService<Lobby>{
    constructor(private usersService: UsersService,
                private gameService: GameService){
        super(Lobby)
    }

    async create(ownerId: number) {
        
        let lobby = new Lobby()
        lobby.code = await (await this.genUnusedCode()).toUpperCase()
        lobby.is_private = true
        lobby.isGameStarted = false
        lobby.name = "Dice Town Test Game"
        lobby.ownerId = ownerId
        lobby.game = null
        const user = await this.usersService.findOne({id: ownerId})
        lobby.users = [user]
        lobby.messages = []
        lobby.readyStatus = []
        lobby.events = [new GameEvent("Lobby created")]

        const lobbyDB = await this.save(lobby)
        return await this.createReadyStatus(new ReadyStatus(lobbyDB.id, ownerId, false))
    }

    async addUserToLobby(userId: number, code: string){
        let lobby = await this.findLobbyComplete('lobby.code = :code ',{code})
        let user = await this.usersService.findOne({id: userId})
        lobby.users.push(user)
        await this.save(lobby)
        return await this.createReadyStatus(new ReadyStatus(lobby.id, +userId, false))
    }
    
    async addMessageToLobby(message: Message, lobbyId: number){
        let lobby = await this.findOneLobbyPopulate({id: lobbyId})
        lobby.messages.push(message)
        return await this.save(lobby)
    }

    async removeUserFromLobby(userId: number, code: string){
        let lobby = await this.findLobbyComplete('lobby.code = :code ',{code})
        let user = await this.usersService.findOne({id: userId})
        lobby.users.splice(lobby.users.indexOf(user),1)
        lobby.readyStatus.splice(lobby.readyStatus.findIndex( item => item.uid === userId))
        return await this.save(lobby)
    }

    async genUnusedCode(): Promise<string>{
        let code: string
        let isConflict = true
        while(isConflict){
            code = crypto.randomBytes(4).toString('hex')
            if(!await this.findOne({code}) && code !== "21A0E546")
                isConflict = false
        }
        return code
    }

    async findOneLobbyPopulate(where) {
        return await this.getRepository().findOne(
            {
                relations: ['users', 'messages', 'game'],
                where,
            }
          );
    }
    async findLobbyComplete(whereCondition: string, whereParam: Object): Promise<Lobby>{
        
        return await this.getRepository()
          .createQueryBuilder('lobby')
          .leftJoinAndSelect('lobby.users', 'users')
          .leftJoinAndSelect('lobby.game', 'game')
          //.innerJoin('lobby.messages', 'messages')
          .where(whereCondition, whereParam)
          .getOne();
          
    }

    async changeReadyStatus(readyStatus: ReadyStatus): Promise<Lobby> {
        let lobby = await this.findOneLobbyPopulate({id: readyStatus.lobbyId})
        if(lobby){
            lobby.readyStatus = lobby.readyStatus.map(item => {
                if(item.uid == readyStatus.uid){
                    item.isReady = readyStatus.isReady
                }
                return item
            })
            return await this.save(lobby)
        }
    }
    
    async createReadyStatus(readyStatus: ReadyStatus): Promise<Lobby> {
        let lobby = await this.findOneLobbyPopulate({id: readyStatus.lobbyId})
        lobby.readyStatus.push(new ReadyStatus(readyStatus.lobbyId, +readyStatus.uid, readyStatus.isReady))
        return await this.save(lobby)
    }

    async switchStartGame(lobbyId: number) {
        let lobby = await this.findOneLobbyPopulate({id: lobbyId})
        
        //create game if starting
        if(!lobby.isGameStarted && !lobby.game){
            lobby.game = await this.gameService.create(lobby)
            lobby.events.push(new GameEvent("Game started"))
        }

        //pausing game, re-set isReady
        if(lobby.isGameStarted && lobby.game){
            lobby.readyStatus = lobby.readyStatus.map(status => {
                status.isReady = false
                return status
            })
        }

        lobby.isGameStarted = !lobby.isGameStarted
        return await this.save(lobby)
    }

    async startResultSequence(lobbyId: number){
        const lobby = await this.findOneLobbyPopulate(lobbyId)
        let game = lobby.game
    
        //game.results.values.set(GameStatus.NUGGETS_RESULT, this.getUserIdMaxDice(DiceValue.DICE9, game))
    
        return game
        // this.server.to(lobbyId.toString()).emit('updateResults', game)
    }

    getUserIdMaxDice(diceValue: DiceValue, game: Game): number[]{
        let maxValue = Math.max(...game.players.map(player => player.dices.filter(dice => dice.value === diceValue).length))

        let winners: number[] = []
        game.players.forEach(player => {
            if(player.dices.filter(dice => dice.value === diceValue).length === maxValue){
            winners.push(player.userId)
            }
        })

        return winners;
    }

    countPlayerDice(game: Game, diceNum: number, userId: number): number{
        return game.players.find(user => user.userId === userId).dices.filter(dice => dice.value === diceNum).length
    }
}
