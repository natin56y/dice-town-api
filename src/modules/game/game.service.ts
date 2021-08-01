import { Injectable } from '@nestjs/common';
import { Game } from '../../entities/game/game.entity';
import { BaseService } from '../../shared/classes/base.service';
import { Lobby } from '../../entities/lobby.entity';
import { Player } from '../../entities/game/player';
import { Property } from '../../entities/game/property';
import { GeneralStorms, GeneralStormsAction } from '../../entities/game/generalStorms';
import { BadLuck, BadLuckAction } from '../../entities/game/badLuck';
import { GameStatus } from '../../entities/game/enums/game-status.enum';
import { GameResults } from '../../entities/game/gameResults';
import { DiceValue } from '../../entities/game/dice-value.enum';

@Injectable()
export class GameService extends BaseService<Game>{

    constructor(){
        super(Game)
    }

    create(lobby: Lobby) {
        
        let game = new Game()
        game.players = lobby.users.map(user => new Player(user.id))
        game.waitingFor = lobby.users.map(user => user.id)
        game.startTime = new Date()
        game.sherifUserid = lobby.users[this.getRandomIntInclusive(0, lobby.users.length-1)].id
        game.dollar = 4
        game.income = 0
        game.nuggets = 30
        game.property = this.fillProperty()
        game.generalStorms = this.fillGeneralStorms()
        game.badLuck = this.fillBadLuck()
        game.status = GameStatus.DICE_ROLLING
        game.results = new GameResults()

        return this.save(game)
    }

    fillProperty() {
        let properties: Property[] = []

        for (let i = 0; i < 4; i++) {
            properties.push(new Property(1, "", true))
            properties.push(new Property(2, "", true))
            properties.push(new Property(3, "", true))
            properties.push(new Property(4, "", true))
        } 
        return this.shuffle(properties)
    }

    fillGeneralStorms() {
        let generalStorms: GeneralStorms[] = []

        generalStorms.push(new GeneralStorms(GeneralStormsAction.GET_1_POINTS, "Get 1 points", true))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.GET_2_POINTS, "Get 2 points", true))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.GET_3_POINTS, "Get 3 points", true))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.GET_4_POINTS, "Get 4 points", true))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.GET_5_POINTS, "Get 5 points", true))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.GET_8_POINTS, "Get 8 points", true))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.TWO_SALOON, "Get 8 points", true, GameStatus.SALOON_RESULT))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.CANCEL_CARD, "Cancel a card played by another player", true, GameStatus.SALOON_RESULT))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.ONE_MOR_PROPERTY, "Get one more property from hidden stack", true, GameStatus.PROPERTY_RESULT))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.DOUBLE_NUGGETS, "Get double nuggets", true, GameStatus.NUGGETS_RESULT))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.OLD_SHERIF_STAY, "Old sherif stays sherif", true, GameStatus.SHERIF_RESULT))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.HALF_OF_BANK, "Get half of the bank heist", true, GameStatus.BANK_RESULT))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.DO_BAD_LUCK, "Do bad luck", true, GameStatus.BAD_LUCK_RESULT))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.DOUBLE_STORE, "Pick store cards twice", true, GameStatus.GENERAL_STORMS_RESULT))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.STEAL_4_DOLLAR, "Steal 4$ from any player", false))
        
        return this.shuffle(generalStorms)
    }

    fillBadLuck() {
        let badLuck: BadLuck[] = []

        badLuck.push(new BadLuck(BadLuckAction.GET_NUGGET_FROM_ALL_PLAYERS, "Get a nugget from each players", false))
        
        return this.shuffle(badLuck)
    }

    shuffle(a: any[]) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }

    getRandomIntInclusive(min: number, max: number): number{
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getWinners(value: DiceValue, game: Game){
        let max = 0
        let playerIds: number[] = []
        for (const player of game.players) {
            let playerMax = 0
            for (const dice of player.dices) {
                if(dice.value === value)
                    playerMax++;
            }

            if(playerMax > max){
                max = playerMax
                playerIds = [player.userId]
            }else if(playerMax === max){
                playerIds.push(player.userId)
            }
        }
        return playerIds
    }

    
}
