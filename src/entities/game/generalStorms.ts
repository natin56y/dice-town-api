import { Card } from "./card";
import { DiceValue } from "./dice-value.enum";
import { GameStatus } from "./enums/game-status.enum";

export class GeneralStorms extends Card {

    action: GeneralStormsAction
    category: GameStatus;

    constructor(id: number, action: GeneralStormsAction, text: string, canKeep: boolean, category: GameStatus = null){
        super(id, text, canKeep)
        this.action = action
        this.category = category
    }
    
}

export enum GeneralStormsAction {
    GET_1_POINTS,
    GET_2_POINTS,
    GET_3_POINTS,
    GET_4_POINTS,
    GET_5_POINTS,
    GET_8_POINTS,
    TWO_SALOON,
    CANCEL_CARD,
    ONE_MOR_PROPERTY,
    DOUBLE_NUGGETS,
    OLD_SHERIF_STAY,
    HALF_OF_BANK,
    DO_BAD_LUCK,
    DOUBLE_STORE,
    STEAL_4_DOLLAR
}