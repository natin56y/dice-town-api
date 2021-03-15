import { BadLuck } from "./badLuck"
import { Dice } from "./dice"
import { GeneralStorms } from "./generalStorms"
import { Property } from "./property"

export class Player {
    userId: number
    isReady: boolean
    nuggets: number
    dollar: number
    property: Property[]
    generalStorms: GeneralStorms[]
    badLuck: BadLuck[]
    dices: Dice[]
    canThrowDices: boolean

    constructor(userId: number){
        this.userId = userId
        this.isReady = true
        this.nuggets = 0
        this.dollar = 8
        this.property = []
        this.generalStorms = []
        this.badLuck = []
        this.dices = []
        this.canThrowDices = true
    }

}