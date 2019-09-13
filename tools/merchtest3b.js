/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI  :-)
---------------------------------------------------------------------------------- */
const myjschannel = require("./myjschannel");
const MyChannel = myjschannel.MyChannel;
const jstools = require('./jstools');
const BigNumber = require('bignumber.js');


class Merchant extends MyChannel {
     async getMerchantBalance() {
        let data;
        try {
            let url = "/balance/" + this.pubkey;
            data = await this.get(url);
            return JSON.parse(data)["balance"];
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    static async Init(account) {
        let node = await MyChannel.anode();
        let balance = await node.balance(account.publicKey);
        if (new BigNumber(balance).isLessThan(new BigNumber(myjschannel.INITIATOR_MIN_BALANCE))) {
            console.log("WARNING: not enough balance: "+balance.toString(10) + " - required: "+myjschannel.INITIATOR_MIN_BALANCE)
        }

        let sdata = await MyChannel.register("merchant",
                            account.publicKey, myjschannel.INITIATOR_MIN_BALANCE,
                            "dave's beer");
        return new Merchant(account.publicKey, account.secretKey, sdata["address"],
                                myjschannel.INITIATOR_MIN_BALANCE, sdata["options"]);
    }
}


async function show_hub_balance(peer) {
    let last_balance = null;
    while(1) {
        let balance = await peer.getMerchantBalance();
        if (balance!==last_balance) {
            console.log("Balance:", balance);
            last_balance = balance;
        }
        await myjschannel.sleep(1000);
    }
}

(async function () {
    let account = await jstools.get_account(
        jstools.getArgv(2,
            jstools.getEnv("MERCHANT",
                jstools.getEnv("ACCOUNT"))
            ), "1234");

    let peer;
    try {
        peer = await Merchant.Init(account);
    } catch(err) {
        console.log("cant connect!");
        console.log(err);
        return;
    }


    await peer.init();
    await peer.initChannel();
    await peer.wait_state("OPEN");

    process.once('SIGINT', function() {
        console.log("Caught interrupt signal");
        peer.sendMessage("leave");
        //peer.wait_state("DISCONNECTED");
    });
    show_hub_balance(peer).then(()=>{}).catch(console.error);

    await peer.wait_state("DISCONNECTED");
    process.exit(0);
})();
