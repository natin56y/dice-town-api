import { Card } from "./card";

export class Property extends Card {
    value: number

    constructor(value: number, text: string, canKeep: boolean) {
        super(text, canKeep)
        this.value = value

    }
}