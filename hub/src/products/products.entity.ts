import {Column, Entity, getRepository, Index, PrimaryGeneratedColumn, Repository} from "typeorm";
import {StringDecoder} from "string_decoder";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 36 })
  uuid: string;

  @Column()
  data: string;
}
