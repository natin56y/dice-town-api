import { Card } from "./card";

export class GeneralStorms extends Card {

    action: GeneralStormsAction
    constructor(action: GeneralStormsAction, text: string, canKeep: boolean){
        super(text, canKeep)
        this.action = action
    }
    
}

export enum GeneralStormsAction {
    GET_3_POINTS,
    GET_5_POINTS,
    GET_8_POINTS
}