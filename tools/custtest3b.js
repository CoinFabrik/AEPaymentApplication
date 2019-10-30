/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI  :-)
---------------------------------------------------------------------------------- */
const BigNumber = require("bignumber.js");
const jstools = require("./jstools");
const myjschannel = require("./myjschannel");
const MyChannel = myjschannel.MyChannel;


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
        //INIT = "2000000000000000"
        let serverdata = await Customer.register("client", account.publicKey,
                                                        INIT, (Date.now().toString()));
        let address = serverdata["address"];
        return new Customer(account.publicKey, account.secretKey, address, INIT, serverdata["options"]);
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

function showDiff(init, final) {
    console.log( "customer: \t \t \t hub:");
    let cusdif = final.customer.total.minus(init.customer.total);
    let hubdif = final.hub.total.minus(init.hub.total);

    //check spending:
    let open_fee = new BigNumber(  "17520000000000");
    let close_fee1 = new BigNumber("10000000000000");
    let close_fee2 = new BigNumber("10000000000000");
    let result_full = cusdif.plus(open_fee).plus(close_fee1).plus(close_fee2).plus(hubdif);
    console.log( `${cusdif.toString(10)} \t \t \t ${hubdif.toString(10)}`);
    console.log( `${result_full.toString(10)} `);
}

function pick_random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

(async function () {
    let account = await jstools.get_account(
        jstools.getArgv(2,
            jstools.getEnv("CUSTOMER",
                jstools.getEnv("ACCOUNT"))
            ), "1234");
    console.log(JSON.stringify(account))
    let peer = await Customer.Init(account);
    if (peer==null)
        return;
    await peer.init();

    async function quit(code) {
        try {
            await peer.leave();
            await peer.wait_state("DISCONNECTED");
        } finally {
            console.log("exit...");
            process.exit(code);
        }
    }

    await peer.showBalances("init");
    await peer.initChannel();
    await peer.wait_state("OPEN");
    process.on('SIGINT', function() {
        console.log("Caught interrupt signal");
        quit(0).then(()=>{}).catch(console.error);
    });


    let idx = 4;
    while (idx>0) {
        await peer.update(1);
        await myjschannel.sleep(1000);
        console.log(idx,"...")
        idx-=1;
    }

    let result = await peer.channel.leave();
    console.log(result);
    console.log("");
    await peer.wait_state("DISCONNECTED");
})();
