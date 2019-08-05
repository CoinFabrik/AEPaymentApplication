/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI  :-)
---------------------------------------------------------------------------------- */
const myjschannel = require("./myjschannel");
const MyChannel = myjschannel.MyChannel;
const jstools = require('./jstools');


class Merchant extends MyChannel {
    static async Init(account) {
        let sdata = await MyChannel.register("merchant",
                        account.publicKey, 1000000000000000, "dave's beer");
        console.log("Server at:", sdata["address"])
        return new Merchant(account.publicKey, account.secretKey, true, sdata["address"]);
    }

    async buyRequest(customer, items, price) {
        return await this.sendXMessage({
            "amount": price,
            "something": items,
            "toId": customer,
            "type": "buy-request",
        })
    }

    async sendXMessage(message) {
        message["from"] = "merchant";
        message["to"] = "hub";
        return this.sendMessage(message);
    }
}


(async function () {
    let account = await jstools.get_account(
        jstools.getArgv(2,
            jstools.getEnv("MERCHANT",
                jstools.getEnv("ACCOUNT"))
            ), "1234");


    let peer = await Merchant.Init(account);
    if (peer == null)
        return;
    await peer.init();
    await peer.initChannel();
    await peer.wait_state("OPEN");

    try {
        let customers = JSON.parse(await myjschannel.get("/clients"));
        console.log("XXX:", customers)
        let customer = customers[0];
        console.log("requesting buy from:", customer)
        await myjschannel.sleep(2000);
        //await peer.buyRequest(customer, [{"what":"beer", "quantity": 2}],  5*(10**5));
        //await myjschannel.sleep(10000);

        await peer.update(10);
        //await peer.update(10);
    } catch (err) {
        console.log(err)
    }

    // await peer.update(10);
    // await peer.update(10);
    // await peer.update(10);
    // await peer.update(10);
    // await peer.update(10);
    // await peer.update(10);
    // await peer.update(10);
    // await peer.update(10);
    // await peer.update(10);
    // await peer.update(10);
    // await peer.update(10);
    // await peer.update(10);
    // await peer.update(10);
})();
