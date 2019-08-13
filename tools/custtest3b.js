/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI  :-)
---------------------------------------------------------------------------------- */
const BigNumber = require("bignumber.js");

const jstools = require("./jstools");
const myjschannel = require("./myjschannel");
const MyChannel = myjschannel.MyChannel;


class Customer extends MyChannel {
    static async Init(account) {
        let serverdata = await Customer.register("client", account.publicKey, 1000000000000000)
        let address = serverdata["address"];
        console.log("server at:", address)
        return new Customer(account.publicKey, account.secretKey, true, address);
    }

    async showBalances(msg) {
        console.log(`*** ${msg} ***`)
        let cus = await this.showBalance("cus", this.pubkey);
        let opp = await this.showBalance("hub", this.opposite);
        console.log("------------------")
        return {customer: cus, hub: opp}
    }

    async showBalance(msg, addr) {
        let chain = await this.nodeuser.balance(addr)
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
}

function showDiff(init, final) {
    console.log( "customer: \t \t \t hub:");
    let cusdif = final.customer.total.minus(init.customer.total);
    let hubdif = final.hub.total.minus(init.hub.total);
    console.log( `${cusdif.toString(10)} \t \t \t ${hubdif.toString(10)}`);
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

    let peer = await Customer.Init(account);
    if (peer==null)
        return;
    await peer.init();
    let initial = await peer.showBalances("init");
    await peer.initChannel();
    await peer.wait_state("OPEN");

    let merchants = await peer.get_("merchant")
    let merchant = pick_random(merchants);

    // await peer.showBalances("pre-update");
    // await peer.update(10);
    // await peer.showBalances("post-update");
    //await myjschannel.sleep(16000*1000);

    async function quit(code) {
        await peer.shutdown();
        await peer.wait_state("DISCONNECTED");
        await myjschannel.sleep(15*1000);
        let final = await peer.showBalances("final");
        showDiff(initial, final);
        process.exit(code);
    }

    process.on('SIGINT', function() {
        console.log("Caught interrupt signal");
        quit(0);
    });
    //h = await peer.height();
    //console.log("height:", h, "Balance:", await peer.balance({height: h}));
})();
