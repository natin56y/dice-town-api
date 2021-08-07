export class Card {
    id: number
    text: string
    canKeep: boolean

    constructor(id: number, text: string, canKeep: boolean){
        this.id = id
        this.text = text
        this.canKeep = canKeep
    }
}