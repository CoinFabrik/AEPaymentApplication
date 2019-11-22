import BigNumber from "bignumber.js";
import {get_node, lc_wallet, to_cc_sk, Users} from "./aehelpers";
import {load} from "./create_accounts";



async function transfer_one_to_one(from_ac: lc_wallet, dst_address, amount, idx="") {
    let node = await get_node(to_cc_sk(from_ac));
    return transfer_from_node(node, dst_address, amount, idx);
}

async function transfer_from_node(node: any, dst_address, amount, idx="") {
    let retry = 5;
    let cerr;
    while(retry) {
        try {
            console.log(`(${idx}) transferring: ${amount.toString(10)} to: ${dst_address}`);
            return node.spend(amount, dst_address);
        } catch (err) {
            cerr = err;
        }
        retry--;
    }
    throw cerr;
}

export async function bulk_one2many(source: lc_wallet, dst_addresses:string[], amount: BigNumber) {
    let node = await get_node(to_cc_sk(source));
    return node2many(node, dst_addresses, amount);
}

export async function node2many(node: any, dst_addresses:string[], amount: BigNumber) {
    for (let address of dst_addresses) {
        await transfer_from_node(node, address, amount);
    }
}


if(module.parent==undefined) {
    (async function () {
        let min_fee = new BigNumber(2 * 16840000000000);
        let accounts=await load();
        // distribute
        let node = await get_node(to_cc_sk(Users[0]));
        let full = new BigNumber(await node.balance(Users[0].public_key));
        console.log("total to distribute ->", full.toString(10));
        let each = full.dividedBy(3*accounts.length).minus(min_fee);
        console.log("will transfer each -> ", each.toString(10))
        await bulk_one2many(node, accounts.map( (lc: lc_wallet)=> lc.public_key), each);
    })();
}
