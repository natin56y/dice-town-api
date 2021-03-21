import { Lobby } from "../lobby.entity";
import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BadLuck } from "./badLuck";
import { GameStatus } from "./enums/game-status.enum";
import { GameResults } from "./gameResults";
import { GeneralStorms } from "./generalStorms";
import { Player } from "./player";
import { Property } from "./property";

@Entity({name: 'game'})
export class Game extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    startTime: Date

    @Column({ type: "json"})
    waitingFor: number[]

    @Column({ nullable: true})
    sherifUserid: number

    @Column({ type: 'json'})
    players: Player[]

    @Column()
    nuggets: number

    @Column()
    dollar: number
    
    @Column({ nullable: true})
    income: number

    @Column({ type: 'json'})
    property: Property[]

    @Column({ type: 'json'})
    generalStorms: GeneralStorms[]

    @Column({ type: 'json'})
    badLuck: BadLuck[]
    
    @Column()
    status: GameStatus
    
    @Column({ type: 'json'})
    results: GameResults

    @OneToOne(() => Lobby, { onDelete: 'CASCADE' })
    @JoinColumn()
    lobby: Lobby
}