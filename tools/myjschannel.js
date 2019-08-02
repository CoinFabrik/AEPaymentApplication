const {
    Channel,
    Crypto,
    Universal
} = require('@aeternity/aepp-sdk');
const http = require('http');
const BigNumber = require('bignumber.js');
const jstools = require("./jstools");

const port=3001;
let URL = jstools.getEnv("NODE", 'localhost:'+port);
console.log("Node> ", URL);

const HUBADDR = "localhost";
const HUBPORT = 3000;
const API_URL = "http://" + URL;
const WS_URL = "ws://" + URL;  // http is ok too
const INTERNAL_API_URL = API_URL;
const compilerURL = 'https://compiler.aepps.com';
const NETWORK_ID = 'ae_devnet';


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
    static async register(what, addr, amount, name) {
        let data;
        try {
            let url = "/" + what + "/" + addr + "/" + amount;
            if (name!=null) {
                url = url + "/" + encodeURIComponent(name);
            }
            data = await get(url);
            return JSON.parse(data);
        } catch (err) {
            console.error(err);
            throw err;
        }
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
            this.STATUS = status.toUpperCase();
            console.log(`[${this.STATUS}]`);
            console.log();
            if (this.STATUS === "OPEN") {
                this.launch_hb();
            }
            if (this.STATUS === "DISCONNECTED") {
                //process.exit(0);
            }
        });

        this.channel.on('message', (msg) => {
            console.log("RECV:>", msg)
            let info = JSON.parse(msg["info"]);
            // if (info["type"]!=="heartbeat"){
                //console.log("RECV:>", info["type"])
                // if (info["type"]!=="signnsend"){
                //     console.log("RECV:>", info["type"])
                // }
                // if (info["type"]==="signnsend") {
                //     console.log("Received!! sending..")+JSON.stringify(tx)
                //     self.nodeuser.signTransaction(info["tx"]).then(
                //         (txx) => {
                //             this.sendMessage({
                //                 "type": "signnsend",
                //                 "txx": txx,
                //                 "tx": info["tx"]
                //             });
                //         }
                //     ).catch(console.error);
                // }
            //}
        });
        return this.channel;
    }

    launch_hb() {
        this.hb().then(console.log).catch(console.error);
    }

    async hb() {
        while (1) {
            await this.sendMessage("beep beep");
            await sleep(46 * 1000, true);
        }
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

async function sleep(ms, debug) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(resolve, ms)
        } catch (err) {
            reject(err)
        }
    });
}

async function wait_for(func) {
    while (!func()) {
        await sleep(100);
    }
}

module.exports = {
    MyChannel,
    get,
    sleep
}
