
export class GameResults {

    dice9: Result
    dice10: Result
    diceStore: Result
    diceSaloon: Result
    diceSherif: Result
    diceAce: Result

}

export class Result {
    constructor(public ids: number[], public isHidden: boolean, public dice: string, public isSherifResolve: boolean = false){}
}