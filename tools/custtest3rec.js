/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI  :-)
---------------------------------------------------------------------------------- */
const BigNumber = require("bignumber.js");
const jstools = require("./jstools");
const myjschannel = require("./myjschannel");
const MyChannel = myjschannel.MyChannel;



class Customer extends MyChannel {
    static async Init(account) {
        let INIT = myjschannel.INITIATOR_MIN_BALANCE;
        let serverdata = await Customer.register("client", account.publicKey,
                                                        INIT, (Date.now().toString()));
        let address = serverdata["address"];
        return new Customer(account.publicKey, account.secretKey, address, INIT, serverdata["options"]);
    }
}

(async function () {
    let peer;
    let account = await jstools.get_account(
        jstools.getArgv(2,
            jstools.getEnv("CUSTOMER",
                jstools.getEnv("ACCOUNT"))
            ), "1234");
    console.log(JSON.stringify(account))

    process.on('SIGINT', function() {
        console.log("Caught interrupt signal");
        quit(0).then(()=>{}).catch(console.error);
    });

    peer = await Customer.Init(account);
    if (peer==null)
        return;
    
    async function quit(code) {
        try {
            console.log("pre leave.")
            let result = await peer.channel.leave();
            console.log(result);
            console.log(peer.STATUS)
            await peer.wait_state("DISCONNECTED");
        } finally {
            console.log("exit...");
            process.exit(code);
        }
    }

    await peer.init();
    await peer.initChannel();
    await peer.wait_state("OPEN");

    // make some state channel state changes
    let idx = 4;
    while (idx>0) {
        await peer.update(1);
        await myjschannel.sleep(1000);
        console.log(idx,"...")
        idx-=1;
    }


    await quit(0);
})();
