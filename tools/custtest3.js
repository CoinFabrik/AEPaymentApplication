/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI  :-)
---------------------------------------------------------------------------------- */
const BigNumber = require("bignumber.js");

const jstools = require("./jstools");
const myjschannel = require("./myjschannel");
const MyChannel = myjschannel.MyChannel;


class Customer extends MyChannel {
    static async Init(account) {
        let serverdata = await MyChannel.register("client", account.publicKey, 1000000000000000)
        let address = serverdata["address"];
        console.log("server at:", address)
        return new Customer(account.publicKey, account.secretKey, true, address);
    }

    async showBalances(msg) {
        console.log(`*** ${msg} ***`)
        await this.showBalance(" we ", this.pubkey);
        await this.showBalance("them", this.opposite);
        console.log("------------------")
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
    }
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
    await peer.showBalances("init");
    await peer.initChannel();
    await peer.wait_state("OPEN");

    // await peer.showBalances("pre-update");
    // await peer.update(10);
    // await peer.showBalances("post-update");

    await myjschannel.sleep(5*1000);
    await peer.shutdown();
    await peer.wait_state("DISCONNECTED");
    await myjschannel.sleep(5*1000);
    await peer.showBalances("final");
    process.exit(0);
    //h = await peer.height();
    //console.log("height:", h, "Balance:", await peer.balance({height: h}));
})();
