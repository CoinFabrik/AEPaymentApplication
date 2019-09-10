const fs = require('fs');
const { Account } = require('./../src/tools');
const jstools = require('./jstools');
const accounts = JSON.parse(fs.readFileSync('./accounts_idx.json', 'utf-8'));
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

async function sleep(ms) {
	return new Promise((resolve, reject) => {
			try {
					setTimeout(resolve, ms)
			} catch (err) {
					reject(err)
			}
	});
}

async function main() {
	let customers = [];
	let merchants = [];
	try {
		for(let i=0; i<3; i++) {
			newMerch = await Merchant.Init(accounts[i]);
			await newMerch.init();
			await newMerch.initChannel();
			await newMerch.wait_state("OPEN");
			try {

				for(let i=3; i<4; i++) {
					newCust = await Customer.Init(accounts[i])
					await newCust.init();
					await newCust.initChannel();
					await newCust.wait_state("OPEN");
					try {
						newCust.on("message", (msg) => {
							if(msg["type"]==="payment-request-rejected") {
								ended = true;
								console.log("payment canceled:", JSON.stringify(msg));   //msg["msg"]);
							}
							if(msg["type"]==="payment-request-accepted") {
									console.log("sending payment..");
									newCust.update(pr.amount)
											.then(()=>{console.log("payment sent!")})
											.catch(console.error);
							}
							if(msg["type"]==="payment-request-completed") {
									console.log("payment completed!")
									ended = true;
							}
							if(msg["type"]==="payment-request-canceled") {
								ended = true;
								console.log("payment request canceled is unexpected! :-o !")
							}
					});
						for(let j=0; j<250; j++) {
							let ended = false;
							let pr = Message.PaymentRequest(
									newMerch.pubkey, "merchant.name", newCust.pubkey, "1",
									[{what:"beer", amount:"1"}]);
							await newCust.sendMessage(pr);

							while (!ended) {
								await sleep(100)
							}
						}

					} finally {
						await newCust.leave()
					}
				}

			} finally {
				await newMerch.leave();
			}
		}

	}
	catch(err)
	{
		console.log(err)
	}
}

main().then(console.log('finish'))