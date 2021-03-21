import { DiceValue } from "./dice-value.enum";

export class Dice {
    constructor(public value: DiceValue, public hidden: boolean){}
}