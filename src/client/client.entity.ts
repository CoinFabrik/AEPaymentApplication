
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import {get_private, get_public} from "../tools";
import {promises} from "fs";


export type Actor = "merchant"|"customer"|"hub";
type MsgKind = "buy-request" | "buy-request-accepted" | "buy-request-rejected" // acceptance is a tx


interface Message {
    from: Actor;
    fromId: string;
    to: Actor;
    toId: string;
    msg: MsgKind;
    id: string;   // uuid for tx

    something: any;
    amount: string;

    merchant: string;  // to be hub defined
    customer: string;  // to be hub defined
}




@Entity()
export class CClient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  address: string;

  @Column()
  connected: boolean;

  name: string;
  private?: string;

  static async FromFile(name: string): Promise<CClient> {
    let client = new CClient();
    client.address = await get_public(name);
    client.name = name;
    client.private = await get_private(name);
    return client;
  }
}
