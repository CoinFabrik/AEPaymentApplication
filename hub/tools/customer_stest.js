const {API_URL, INTERNAL_API_URL, NETWORK_ID} = require("./myjschannel");
const fs = require("fs");
const {
    Channel,
    Crypto,
    Universal
} = require('@aeternity/aepp-sdk');
/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI  :-)
---------------------------------------------------------------------------------- */
const BigNumber = require("bignumber.js");
const jstools = require("./jstools");
const myjschannel = require("./myjschannel");
const MyChannel = myjschannel.MyChannel;

let QUIT_FLAG = false;


class Message {
    static PaymentRequest(merchant, merchant_name, customer, amount, something) {
        return {
            type: "payment-request",
            id: jstools.genUUID(),
            merchant: merchant,
            customer: customer,
            amount: amount,
            something: something
        }
    }
}

class Customer extends MyChannel {
    static async Init(account) {
        let INIT = myjschannel.INITIATOR_MIN_BALANCE;
        let serverdata = await Customer.register("client", account.publicKey, INIT, (Date.now().toString()));
        let address = serverdata["address"];
        return new Customer(account.publicKey, account.secretKey, address, INIT);
    }

    async showBalances(msg) {
        console.log(`*** balances: ${msg} ***`);
        let cus = await this.showBalance("cus", this.pubkey);
        let opp = await this.showBalance("hub", this.opposite);
        console.log("------------------");
        return {customer: cus, hub: opp}
    }

    async showBalance(msg, addr) {
        let chain = await this.nodeuser.balance(addr);
        let total = chain;
        let channel = null;
        try {
            channel = (await this.channel.balances([addr]))[addr];
        } catch (err) {
            channel = "<no>";
        }
        if (msg===undefined) { msg = "" };
        if (channel!=="<no>") {
            total = new BigNumber(chain).plus(new BigNumber(channel)).toString(10);
        }
        console.log(`${msg}  on chain  ${chain}`);
        console.log(`${msg}  on sc     ${channel}`);
        console.log(`${msg}  total:    ${total}`);
        return {chain: new BigNumber(chain), channel: new BigNumber(channel), total: new BigNumber(total)};
    }

    async sendPayment(pr) {
        await this.sendMessage(pr);
    }
}

function pick_random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

let merchant = null;
let connected = 0;


async function main(account, idx) {
    let peer = await Customer.Init(account);
    if (peer==null)
        return;
    await peer.init();

    if (merchant==null) {
        let merchants = await peer.get_("merchant");
        console.log("merchants online:", JSON.stringify(merchants))
        if (merchants.length===0) {
            console.log("no merchants online. come back later!");
            return;
        }
        merchant = pick_random(merchants);
    }

    await peer.initChannel();
    await peer.wait_state("OPEN");
    connected += 1;

    let pr = Message.PaymentRequest(
        merchant.address, merchant.name, peer.pubkey, 1,
        [{what:"beer", amount:1}]);

    function close() {
        peer.shutdown().then( ()=> {
            peer.wait_state("DISCONNECTED");
        });
    }

    return new Promise((resolve, reject) => {
        let idx = 0;
        peer.on("message", (msg) => {
            if(msg["type"]==="payment-request-rejected") {
                console.log(idx, "payment canceled:", msg["msg"]);
            }
            if(msg["type"]==="payment-request-accepted") {
                console.log(idx, "sending payment..");
                peer.update(pr.amount).then(()=>{console.log("sent!")}).catch(console.error);
            }
            if(msg["type"]==="payment-request-completed") {
                console.log(idx, "payment completed!");
                if(-1!==process.argv.indexOf("continue")) {
                    // peer.sendPayment(pr).then(()=>{
                    //     idx= idx +1;
                    //     console.log(idx, "iteration:", idx);
                    // }).catch(console.error);
                } else {
                    close();
                }
                resolve();
            }
            if(msg["type"]==="payment-request-canceled") {
                console.log(idx, "payment request canceled is unexpected! :-o !")
            }
        });

        peer.sendPayment(pr).then(jstools.voidf).catch(err=>{
            close();
            reject(err);
        });
    });
}

async function Node() {
    return await Universal({
            networkId: NETWORK_ID,
            url: API_URL,
            internalUrl: INTERNAL_API_URL,
        });
}

async function save(an_array) {
    console.log(JSON.stringify(an_array));
    fs.writeFileSync("accounts_idx.json", JSON.stringify(an_array));
}


async function load() {
    let accounts=[];
    try {
        let buf = fs.readFileSync("accounts_idx.json");
        accounts = JSON.parse(buf.toString("ascii"));
    } catch (err) {
    }
    return accounts;
}


(async function () {
    process.once('SIGINT', function() {
        console.log("Caught interrupt signal");
        QUIT_FLAG = true;
        //quit(0).then(()=>{}).catch(console.error);
    });

    let accounts=await load();
    let max = Number.parseInt(process.argv[2]);
    let delay = Number.parseInt(process.argv[3]?process.argv[3]:"0");
    console.log("Accounts: ", max.toString());
    console.log("Loaded Accounts: ", accounts.length);

    //let node = await Node();
    for(let idx=0; idx<max; idx++ ) {
       let ac = accounts[idx];
       main(ac).then(jstools.voidf).catch(console.error);
       await myjschannel.sleep(delay);
    }
})();
