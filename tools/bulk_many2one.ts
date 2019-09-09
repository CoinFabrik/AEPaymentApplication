import BigNumber from "bignumber.js";
import {get_node, Users} from "./aehelpers";


async function transfer_all(from_ac, to_ac_publicKey, amount, idx) {
    let node = await get_node({publicKey: from_ac.public_key, secretKey: from_ac.private_key});
    console.log(`(${idx}) transferring: ${amount.toString(10)} to: ${to_ac_publicKey}`);
    return node.spend(amount, to_ac_publicKey);
}

async function get_balance_or_null(node: any, pubkey: string): Promise<BigNumber | null> {
    try {
        let balance = await node.balance(pubkey);
        return new BigNumber(balance);
    } catch (err) {
        return null
    }
}

export async function bulk_many2one(node: any, from_users: object, dest_address: string, min_fee?: BigNumber) {
    if (min_fee == undefined) {
        min_fee = new BigNumber(2 * 16840000000000);
    }
    for (let user of Users) {
        let balance = await get_balance_or_null(node, user.public_key);
        if ((balance == null) || balance.isLessThan(min_fee))
            continue;
        await transfer_all(user, dest_address, balance.minus(min_fee), "-");
    }
}

if(module.parent==undefined) {
    (async function () {
        // users format: {
        //         public_key: "...",
        //         private_key: "..."
        //     }
        // merge all funds:
        let node = await get_node(null);
        await bulk_many2one(node, Users.slice(1), Users[0].public_key);
    })();
}
