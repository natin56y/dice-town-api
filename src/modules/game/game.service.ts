import { Injectable } from '@nestjs/common';
import { Game } from '../../entities/game/game.entity';
import { BaseService } from '../../shared/classes/base.service';
import * as crypto from "crypto"
import { UsersService } from '../users/users.service';
import { Message } from '../../entities/chat/message.entity';
import { ReadyStatus } from '../../entities/lobby/ready-status';
import { Lobby } from 'entities/lobby.entity';
import { Player } from 'entities/game/player';
import { Property } from 'entities/game/property';
import { GeneralStorms, GeneralStormsAction } from 'entities/game/generalStorms';
import { BadLuck, BadLuckAction } from 'entities/game/badLuck';
import { GameStatus } from 'entities/game/enums/game-status.enum';

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
        game.sherifUserid = null
        game.dollar = 4
        game.nuggets = 30
        game.property = this.fillProperty()
        game.generalStorms = this.fillGeneralStorms()
        game.badLuck = this.fillBadLuck()
        game.status = GameStatus.DICE_ROLLING

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

        generalStorms.push(new GeneralStorms(GeneralStormsAction.GET_3_POINTS, "Get 3 points", true))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.GET_5_POINTS, "Get 5 points", true))
        generalStorms.push(new GeneralStorms(GeneralStormsAction.GET_8_POINTS, "Get 8 points", true))
        
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
}
