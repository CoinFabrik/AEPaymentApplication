/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI  :-)
---------------------------------------------------------------------------------- */
const myjschannel = require("./myjschannel");
const MyChannel = myjschannel.MyChannel;
const jstools = require('./jstools');


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
        let sdata = await MyChannel.register("merchant",
                        account.publicKey, myjschannel.INITIATOR_MIN_BALANCE,
            "dave's beer");
        return new Merchant(account.publicKey, account.secretKey, sdata["address"], myjschannel.INITIATOR_MIN_BALANCE);
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
        console.log("cant connect!")
        return;
    }

    await peer.init();
    await peer.initChannel();
    await peer.wait_state("OPEN");

    show_hub_balance(peer).then(()=>{}).catch(console.error);


    // try {
    //     let customer;
    //     console.log("requesting buy from:", customer)
    //     await myjschannel.sleep(2000);
    //     await peer.buyRequest(customer, [{"what":"beer", "quantity": 2}],  5*(10**5));
    //     //await myjschannel.sleep(10000);
    //     //await peer.update(10);
    // } catch (err) {
    //     console.log(err)
    // }

    // await peer.update(10);
})();
