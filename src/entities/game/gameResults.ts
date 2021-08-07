
export class GameResults {

    dice9: Result
    dice10: Result
    diceStore: Result
    diceSaloon: Result
    diceSherif: Result
    diceAce: Result

}

export class Result {
    constructor(public ids: number[], public isHidden: boolean, public dice: number, public isSherifResolve: boolean = false, public isActionDone: boolean = false, public isRedeemed: boolean = false){}
}

