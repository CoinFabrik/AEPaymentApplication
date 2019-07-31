/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI
---------------------------------------------------------------------------------- */
import {MyChannel, r_addr} from "./myjschannel";

const jstools = require('./jstools');

const http = require('http');
const {
    Channel,
    Crypto,
    Universal
} = require('@aeternity/aepp-sdk');

const fs = require('fs');
const bs58 = require('bs58');

const port = 3001;
let URL = 'localhost:' + port;
URL = process.env["NODE"] ? process.env["NODE"] : URL;
console.log("Node> ", URL);
const API_URL = "http://" + URL;
const WS_URL = "ws://" + URL;  // http is ok too
const INTERNAL_API_URL = API_URL;
let STATUS = "";
const compilerURL = 'https://compiler.aepps.com';
const NETWORK_ID = 'ae_devnet';



class Merchant extends MyChannel {
    static async Init(other = r_addr) {
        let credentials = await jstools.get_account(process.argv[2], "1234");
        await MyChannel.register("merchant", credentials.publicKey).then(console.log).catch(console.error);
        return new Merchant(credentials.publicKey, credentials.secretKey, true, other);
    }

    async buyRequest(customer, items, price) {
        return await this.sendMessage({
            "amount": price,
            "something": items,
            "toId": customer
        })
    }

    async sendMessage(message) {
        message["from"] = "merchant";
        message["to"] = "hub";
        message["type"] = "buy-request";
        return await super.sendMessage(message);
    }
}


(async function () {
    //await temp();
    //let peer = await Merchant.Initiator("ak_dfLvALARoMJs4kvKDkvjdf6Crvs9pAqJYEv3WsxMHM9hNw4DK");
    let peer = await Merchant.Init("ak_dfLvALARoMJs4kvKDkvjdf6Crvs9pAqJYEv3WsxMHM9hNw4DK");
    if (peer == null)
        return;

    await peer.init();
    await peer.initChannel();

    await wait_state("OPEN");
//        hb(peer).then(console.log).catch(console.error);

    console.log("AFTER OPEN!!!!")

    try {
        let result = await get2("/clients");
        let customers = JSON.parse(result)
        let customer = customers[0];
        console.log("requesting buy from:", customer)
        await peer.buyRequest(customer, [{"what":"beer", "quantity": 2}],  5*(10**5));
        await sleep(15000);
    } catch (err) {
        console.log(err)
    }
    //await peer.update(10);
})();
