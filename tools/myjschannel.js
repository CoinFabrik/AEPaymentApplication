const {
    Channel,
    Crypto,
    Universal
} = require('@aeternity/aepp-sdk');
const http = require('http');
const BigNumber = require('bignumber.js');


const HUBADDR = "localhost"
const HUBPORT = 3000;

var util = require('util')
const port=3001;
let URL = 'localhost:'+port;
URL = process.env["NODE"]?process.env["NODE"] : URL;
console.log("Node> ", URL);
const API_URL = "http://" + URL;
const WS_URL = "ws://" + URL;  // http is ok too
const INTERNAL_API_URL = API_URL;
const compilerURL = 'https://compiler.aepps.com';
const NETWORK_ID = 'ae_devnet';


const i_addr = 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU';
const r_addr = 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk';
const i_secretKey = 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca';
const r_secretKey = '7c6e602a94f30e4ea7edabe4376314f69ba7eaa2f355ecedb339df847b6f0d80575f81ffb0a297b7725dc671da0b1769b1fc5cbe45385c7b5ad1fc2eaf1d609d';


var STATUS = "";


async function get(url) {
    return new Promise((resolve, reject) => {
        http.get({
            hostname: HUBADDR,
            port: HUBPORT,
            path: url
        }, (res) => {
            if (res.statusCode !== 200) {
                reject(res.statusCode);
            }
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                resolve(rawData);
            });
        });
    });
}

var INITIATOR_MIN_BALANCE = 1000000000000000;

class MyChannel {

    static async register(what, addr) {
        try {
            await get("/" + what + "/" + addr);
        } catch (err) {
            console.error(err);
        }
    }

    static async Initiator(other=r_addr) {
        try {
            await get("/client/"+i_addr);
        } catch (err) {
            console.error(err);
            return;
        }
        return new MyChannel(i_addr, i_secretKey, true, other);
    }

    static async Responder() {
        return new MyChannel(r_addr, r_secretKey, false, i_addr);
    }


    constructor(pubkey, privkey, init_role, oposite_pub) {
        this.nodeuser = undefined;
        this.pubkey = pubkey;
        this.privkey = privkey;
        this.is_initiator = init_role;
        this.oposite = oposite_pub;
        this.STATUS = "";
    }

    get initiator() {
        return this.is_initiator? this.pubkey:this.oposite;
    }
    get responder() {
        return this.is_initiator? this.oposite:this.pubkey;
    }
    get role() {
        return this.is_initiator? "initiator" : "responder";
    }

    get_options() {
        let options = {
            url:  WS_URL+'/channel',
            pushAmount: 3,
            initiatorAmount: INITIATOR_MIN_BALANCE,
            responderAmount: 1,
            channelReserve: 1,
            ttl: 10000,
            // host: "localhost",
            host: "localhost", //"10.10.0.79",
            port: 3001,
            lockPeriod: 1,
            initiatorId: this.initiator,
            responderId: this.responder,
            role: this.role,
        };
        console.log(1,this.initiator)
        console.log(1,this.responder)
        return options;
    }

    async init() {
        console.log(JSON.stringify({publicKey: this.pubkey, secretKey: this.privkey}))
        this.nodeuser = await Universal({
            networkId: NETWORK_ID,
            url: API_URL,
            internalUrl: INTERNAL_API_URL,
            keypair: {publicKey: this.pubkey, secretKey: this.privkey},
            compilerUrl: compilerURL
        });

        let balance = await this.nodeuser.balance(this.pubkey);
        console.log(" iaddr: ", this.pubkey, " balance: ", balance);
        let bal = new BigNumber(balance);
        if(bal.isLessThan(new BigNumber(INITIATOR_MIN_BALANCE))) {
            console.log("less balance than expected!");
            process.abort();
        }
    }

    async wait_state(expected) {
        const self = this;
        return await wait_for(() => self.STATUS === expected);
    }

    async initChannel() {
        const self = this;
        let options = this.get_options();

        options["sign"] = async (tag, tx) => {
            console.log(tag, tx);
            try {
                const txData = Crypto.deserialize(Crypto.decodeTx(tx), { prettyTags: true })
                console.log(JSON.stringify(txData));
            } catch (err) {
                //console.log(err);
            }
            if (tag === "shutdown_sign_ack") {
                console.log("TX:", tx)
            }
            return self.nodeuser.signTransaction(tx)
        };

        this.channel = await Channel(options);
        this.channel.on('statusChanged', (status) => {
            STATUS = status.toUpperCase();
            this.STATUS = STATUS;
            console.log(`[${STATUS}]`);
            console.log();
            if (STATUS === "DISCONNECTED") {
                //process.exit(0);
            }
        });
        this.channel.on('message', (msg) => {
            //console.log("RECV:>", typeof(msg["info"]))
            let info = JSON.parse(msg["info"]);
            console.log("RECV:>", info["type"])
        });
        return this.channel;
    }

    async sendMessage(message) {
        return await this.channel.sendMessage(message, this.oposite);
    }

    async shutdown() {
        if (this.is_initiator) {
            const self = this;
            let tx = await this.channel.shutdown(_tx => self.nodeuser.signTransaction(_tx));
            return tx;
        }
    }

    async height() {
        return await this.nodeuser.height();
    }

    async balance(opts) {
        if (opts===null) {
            opts={}
        }
        return await this.nodeuser.balance(this.pubkey, opts);
    }

    async update(amount) {
        const self = this;
        try {
            let result = await this.channel.update(this.pubkey, this.oposite, amount, async (tx) => {
                return await self.nodeuser.signTransaction(tx);
            });
            return result;
        } catch(err) {
            console.log("---------------------------------------------------")
            console.log("Error on update:", err);
            return null
        }
    }
}

const null_func = () => {
};

function call_async(f, ...args) {
    f(...args).then(null_func).catch(console.error);
}

async function sleep(ms, debug) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(resolve, ms)
        } catch (err) {
            reject(err)
        }
    });
}

// async function wait_state(expected) {
//     return await wait_for(() => STATUS === expected);
// }

async function wait_for(func) {
    while (!func()) {
        await sleep(100);
    }
}

async function hb(peer) {
    while (1) {
        await peer.sendMessage("beep beep");
        await sleep(46 * 1000, true);
    }
}



module.exports = {
    MyChannel,
    get,
    r_addr,
    sleep
}
