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

async function main(account) {
    console.log(JSON.stringify(account))
    let peer = await Customer.Init(account);
    if (peer==null)
        return;
    await peer.init();
    let initial = await peer.showBalances("init");

    let merchants = await peer.get_("merchant");
    console.log("merchants online:", JSON.stringify(merchants))
    if (merchants.length===0) {
        console.log("no merchants online. come back later!");
        return;
    }

    await peer.initChannel();
    await peer.wait_state("OPEN");
    let merchant = pick_random(merchants);
    let pr = Message.PaymentRequest(
        merchant.address, merchant.name, peer.pubkey, 1,
        [{what:"beer", amount:1}]);

    let idx = 0;
    peer.on("message", (msg) => {
        if(msg["type"]==="payment-request-rejected") {
            console.log("payment canceled:", msg["msg"]);
        }
        if(msg["type"]==="payment-request-accepted") {
            console.log("sending payment..");
            peer.update(pr.amount).then(()=>{console.log("sent!")}).catch(console.error);
        }
        if(msg["type"]==="payment-request-completed") {
            console.log("payment completed!")
            if(-1!==process.argv.indexOf("continue")) {
                peer.sendPayment(pr).then(()=>{
                    idx= idx +1;
                    console.log("iteration:", idx);
                }).catch(console.error);
            }
        }
        if(msg["type"]==="payment-request-canceled") {
            console.log("payment request canceled is unexpected! :-o !")
        }
    });

    await peer.sendPayment(pr);

    async function quit(code) {
        try {
            await peer.shutdown();
            await peer.wait_state("DISCONNECTED");
            await myjschannel.sleep(3*1000);
        } finally {
            console.log("exit...");
            process.exit(code);
        }
    }

    process.on('SIGINT', function() {
        process.on('SIGINT', function() {});
        console.log("Caught interrupt signal");
        quit(0).then(()=>{}).catch(console.error);
    });
}



// Write file to filesystem
export function writeFile (name, data) {
  try {
    fs.writeFileSync(name, data);
    return true
  } catch (e) {
    process.exit(1)
  }
}


// Generate `keypair` encrypt it using password and write to `ethereum` keystore file
export async function generateSecureWallet (name, { output = '', password, overwrite }) {
  if (!overwrite && !(await askForOverwrite(name, output))) process.exit(1)
  password = password || await prompt(PROMPT_TYPE.askPassword)
  const { secretKey, publicKey } = Crypto.generateKeyPair(true)

  writeFile(path.join(output, name), JSON.stringify(await dump(name, password, secretKey)))

}



(async function () {
    let accountIdx={};
    try {
        accountIdx = JSON.parse(fs.readFileSync("accounts_idx.json"));
    } catch (err) {
    }

    let max = Number.parseInt(process.argv[2]);
    console.log("Accounts: ", max.toString());

    for(var idx=0; idx<max; idx++ ) {

       try {

       } catch (err) {

       }
    }

    let account = await jstools.get_account(
        jstools.getArgv(2,
            jstools.getEnv("CUSTOMER",
                jstools.getEnv("ACCOUNT"))
            ), "1234");


    await main();
})();
