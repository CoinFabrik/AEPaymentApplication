import {Column, Entity, Index, PrimaryGeneratedColumn} from "typeorm";
import {Actor} from "./client.entity";

type Actions = "purchase" | "deposit" | "withdraw";


@Entity()
@Index(["merchant"])
@Index(["customer"])
@Index(["tx_uuid"], {unique: true})
export class MerchantCustomerAccepted {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    merchant: string;
    @Column()
    customer: string;

    @Column()
    action: Actions;
    @Column()
    on_chain: string;

    @Column()
    tx_uuid: string;
    @Column()
    timestamp: number;
    @Column()
    amount: string;
    @Column()
    item: string;

    static Create(merchant, customer, uuid, amount: string, item: object) {
        const mca = new MerchantCustomerAccepted();
        mca.timestamp = Date.now();
        mca.action = "purchase";
        mca.merchant = merchant;
        mca.customer = customer;
        mca.amount = amount;
        mca.tx_uuid = uuid;
        mca.item = JSON.stringify(item);
        return mca;
    }

    static CreateInitialDeposit(options: object, role: Actor) {
        const mca = new MerchantCustomerAccepted();
        mca.timestamp = Date.now();
        mca.action = "deposit";
        if ((role!=="merchant") && (role!=="customer")) {
            throw new Error("cannot create something different than merchant or customer!");
        }

        if (role==="merchant") {
            mca.merchant = options["initiatorAddress"];
        } else if (role==="customer") {
            mca.customer = options["initiatorAddress"];
        }
        mca.amount = options["initiatorAmount"];
        return mca;
    }
}
