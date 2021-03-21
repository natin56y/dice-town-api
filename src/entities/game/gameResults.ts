import { GameStatus } from "./enums/game-status.enum";

export class GameResults {
    constructor(public values: Map<GameStatus,number[]>) {}
}