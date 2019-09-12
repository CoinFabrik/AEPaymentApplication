const fs = require('fs');
//const { Account } = require('./../src/tools');
const jstools = require('./jstools');
const accounts = JSON.parse(fs.readFileSync('./accounts_idx.json', 'utf-8'));
const myjschannel = require("./myjschannel");
const MyChannel = myjschannel.MyChannel;


class Customer extends MyChannel {
    static async Init(account) {
        let INIT = myjschannel.INITIATOR_MIN_BALANCE;
        let serverdata = await Customer.register("client", account.publicKey, INIT, (Date.now().toString()));
        let address = serverdata["address"];
        return new Customer(account.publicKey, account.secretKey, address, INIT, serverdata["options"]);
    }
}


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
        return new Merchant(account.publicKey, account.secretKey, sdata["address"],
            myjschannel.INITIATOR_MIN_BALANCE, sdata["options"]);
    }
}

async function sleep(ms) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(resolve, ms)
        } catch (err) {
            reject(err)
        }
    });
}


async function run_customer(account, idx, newMerch) {
	let newCust = await Customer.Init(account);
	await newCust.init();
	await newCust.initChannel();
	await newCust.wait_open();

	try {
		for (let j = 0; j < 250; j++) {
			await myjschannel.buy(newCust,
				myjschannel.Message.PaymentRequest(newMerch.pubkey, "merchant.name", newCust.pubkey,
					j.toString(),[{what: "beer", amount: "1"}]),
				msg => console.log(idx.toString() + " "+ msg));
		}
	} finally {
		await newCust.leave()
	}
}

async function main() {
	let newMerch = await Merchant.Init(accounts[0]);
	await newMerch.init();
	await newMerch.initChannel();
    try {
		await newMerch.wait_open();
		await run_customer(accounts[1], 1, newMerch);
    } catch (err) {
		await newMerch.leave();
        console.log(err)
    }
}

main().then(()=>console.log('finish')).catch(console.error)
