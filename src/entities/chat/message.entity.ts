import { Lobby } from "../lobby.entity"
import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm"


@Entity()
export class Message extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    id: number
    
    @Column()
    user: number

    @Column()
    message: string

    @Column()
    room: string

    @ManyToOne(type => Lobby, lobby => lobby.messages, {onDelete:'CASCADE'})
    lobby: Lobby
}