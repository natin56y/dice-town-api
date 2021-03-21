import { Card } from "./card";

export class BadLuck extends Card {
    action: BadLuckAction
    constructor(action: BadLuckAction, text: string, canKeep: boolean){
        super(text, canKeep)
        this.action = action
    }
}

export enum BadLuckAction {
    GET_NUGGET_FROM_ALL_PLAYERS
}