const fs = require('fs');
const { Account } = require('./../src/tools');

const accounts = JSON.parse(fs.readFileSync('accounts_idx.json', 'utf-8'));
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

async function main() {
	let customers = [];
	let merchants = [];
	try {
		for(let i=0; i<9; i++) {
			customers.push(await Customer.Init(accounts[i]))
		}
		for(let i=9; i<10; i++) {
			newMerch = await Merchant.Init(accounts[i]);
			await newMerch.init();
			await newMerch.initChannel();
			await newMerch.wait_state("OPEN");
			merchants.push(newMerch)
		}

	}
	catch(err)
	{
		console.log(err)
	}
}

main().then(console.log('finish'))