/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI  :-)
---------------------------------------------------------------------------------- */
const jstools = require("./jstools");
const myjschannel = require("./myjschannel");
const MyChannel = myjschannel.MyChannel;


class Customer extends MyChannel {
    static async Init(account) {
        let serverdata = await MyChannel.register("client", account.publicKey)
        let address = serverdata["address"];
        console.log("server at:", address)
        return new MyChannel(account.publicKey, account.secretKey, true, address);
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
    await peer.initChannel();
    await peer.wait_state("OPEN");
    await peer.update(10);
    //await peer.shutdown();
    //await wait_state("DISCONNECTED");
    //h = await peer.height();
    //console.log("height:", h, "Balance:", await peer.balance({height: h}));
})();
