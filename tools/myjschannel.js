const {
    Channel,
    Crypto,
    Universal
} = require('@aeternity/aepp-sdk');
const http = require('http');
const BigNumber = require('bignumber.js');
const jstools = require("./jstools");
const events = require('events');

const port=3001;
//NODE=165.22.18.138:3001 HUB=165.22.76.228:3001
let URL = jstools.getEnv("AENODE", jstools.getEnv("NODE", '165.22.18.138'));
let HUBADDR = jstools.getEnv("HUB", '165.22.76.228');

//const HUBHOST = "localhost";
const HUBPORT = 3000;

if(-1===URL.indexOf(":")) {
    URL = URL + ":"+port;
}

const API_URL = "http://" + URL;
const WS_URL = "ws://" + URL;  // http is ok too
const INTERNAL_API_URL = API_URL;
const compilerURL = 'https://compiler.aepps.com';
const NETWORK_ID = 'ae_devnet';

const INITIATOR_MIN_BALANCE = "1000000000000000";


console.log("hub>  ", HUBADDR);
console.log("node> ", URL);


async function get(url) {
    const opts = { hostname: HUBADDR, port: HUBPORT, path: url };
    return new Promise((resolve, reject) => {
        http.get(opts, (res) => {
            let rawData = '';

            if (res.statusCode !== 200) {
                reject("Request returned:" + res.statusCode +
                        " returned when: "+JSON.stringify(opts));
            }
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                resolve(rawData);
            });
            res.on('error', (err) => {
                reject(err);
            });
        });
    });
}


class MyChannel extends events.EventEmitter {
    async get_(actor) {
        let url = (actor==="merchant") ? "/merchant" : "/client";
        return JSON.parse(await get(url+"/all"));
    }

    async get(url) {
        return await get(url);
    }

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
            console.log("server returned:", data);
            console.error(err);
            throw err;
        }
    }

    constructor(pubkey, privkey, opposite_addr, init_amount, options) {
        super();
        this.options = options;
        if (init_amount===undefined) {
            init_amount = INITIATOR_MIN_BALANCE;
        }
        this.init_amount = init_amount;
        this.nodeuser = undefined;
        this.pubkey = pubkey;
        this.privkey = privkey;
        this.is_initiator = true;
        this.opposite = opposite_addr;
        this.STATUS = "";
    }

    get initiator() {
        return this.is_initiator? this.pubkey:this.opposite;
    }
    get responder() {
        return this.is_initiator? this.opposite:this.pubkey;
    }
    get role() {
        return this.is_initiator? "initiator" : "responder";
    }

    async init() {
        this.nodeuser = await Universal({
            networkId: NETWORK_ID,
            url: API_URL,
            internalUrl: INTERNAL_API_URL,
            keypair: {publicKey: this.pubkey, secretKey: this.privkey},
            compilerUrl: compilerURL
        });

        let balance = await this.nodeuser.balance(this.pubkey);
        console.log(" we: ", this.pubkey);
        // let bal = new BigNumber(balance);
        // if(bal.isLessThan(new BigNumber(INITIATOR_MIN_BALANCE))) {
        //     console.log("balance:  ", balance);
        //     console.log("required: ", INITIATOR_MIN_BALANCE);
        //     console.log("less balance than expected!");
        //     process.abort();
        // }
    }

    async wait_state(expected) {
        const self = this;
        return await wait_for(() => self.STATUS === expected);
    }

    async initChannel() {
        //     url:  WS_URL+'/channel',
        let options = jstools.clone(this.options);
        options["sign"] = async (tag, tx) => {
            console.log(tag, tx);
            try {
                const txData = Crypto.deserialize(Crypto.decodeTx(tx),
                                                { prettyTags: true })
                console.log(JSON.stringify(txData));
            } catch (err) {
                //console.log(err);
            }
            if (tag === "shutdown_sign_ack") {
                console.log("TX:", tx)
            }
            return this.nodeuser.signTransaction(tx)
        };


        this.channel = await Channel(options);
        this.channel.on('statusChanged', (status) => {
            this.STATUS = status.toUpperCase();
            console.log(`[${this.STATUS}]`);
            if (this.STATUS === "OPEN") {
                this.launch_hb();
            }
            if (this.STATUS === "DISCONNECTED") {
                //process.exit(0);
            }
        });

        this.channel.on('error', (msg) => {
            console.log(" ****   ERROR:", msg);
        });

        this.channel.on('message', (msg) => {
            try {
                let info = JSON.parse(msg["info"]);
                if (info["type"]==="heartbeat") return;
                this.emit("message", info);
            } catch(err) {
                console.log("cant parse info")
            }
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
        return await this.channel.sendMessage(message, this.opposite);
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
            let result = await this.channel.update(this.pubkey, this.opposite, amount, async (tx) => {
                return await self.nodeuser.signTransaction(tx);
            });
            return result;
        } catch(err) {
            console.log("Error on update:", err);
            throw err;
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
    sleep,
    INITIATOR_MIN_BALANCE,
    NETWORK_ID,
    API_URL,
    INTERNAL_API_URL
};
