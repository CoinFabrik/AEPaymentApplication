import {Column, Entity, getRepository, Index, PrimaryGeneratedColumn, Repository} from "typeorm";


@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 36 })
  uuid: string;

  @Column()
  data: string;

  @Column({nullable: true})
  qr1: string;

  @Column({nullable: true})
  qr2: string;

}
