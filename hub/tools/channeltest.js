/*-----------------------------------------------------------------------------------
    SIMPLE REVERSI
---------------------------------------------------------------------------------- */
const os = require("os");
const EventEmitter = require('events');
const {
    Channel,
    Crypto,
    Universal
} = require('@aeternity/aepp-sdk');

const fs = require('fs');
const bs58 = require('bs58');

const i_addr = 'ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU';
const r_addr = 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk';
const i_secretKey = 'bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca';
const r_secretKey = '7c6e602a94f30e4ea7edabe4376314f69ba7eaa2f355ecedb339df847b6f0d80575f81ffb0a297b7725dc671da0b1769b1fc5cbe45385c7b5ad1fc2eaf1d609d';

const port=3001;
let URL = 'localhost:'+port;
URL = process.env["NODE"]?process.env["NODE"] : URL;
console.log("Node> ", URL);
const API_URL = "http://" + URL;
const WS_URL = "ws://" + URL;  // http is ok too
const INTERNAL_API_URL = API_URL;
let STATUS = "";
const compilerURL = 'https://compiler.aepps.com';
const NETWORK_ID = 'ae_devnet';


class MyChannel {
    static Initiator() {
        return new MyChannel(i_addr, i_secretKey, true, r_addr);
    }
    static Responder() {
        return new MyChannel(r_addr, r_secretKey, false, i_addr);
    }

    constructor(pubkey, privkey, init_role, oposite_pub) {
        this.nodeuser = undefined;
        this.pubkey = pubkey;
        this.privkey = privkey;
        this.is_initiator = init_role;
        this.opposite = oposite_pub;
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
            initiatorAmount: 1000000000000000,
            responderAmount: 1000000000000000,
            channelReserve: 20000000000,
            ttl: 10000,
            host: "localhost",
            port: 3001,
            lockPeriod: 1,
            initiatorId: this.initiator,
            responderId: this.responder,
            role: this.role,
        };
        return options;
    }

    async init() {
        this.nodeuser = await Universal({
            networkId: NETWORK_ID,
            url: API_URL,
            internalUrl: INTERNAL_API_URL,
            keypair: {publicKey: this.pubkey, secretKey: this.privkey},
            compilerUrl: compilerURL
        });
    }

    async initChannel() {
        const self = this;
        let options = this.get_options();
        if (this.is_initiator) {
            //let spent = await this.nodeuser.spend('6000000000000000', this.opposite);
            //console.log("SPENT:", spent.tx.amount);
        }

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
            console.log(`[${STATUS}]`);
            console.log();
            if (STATUS === "DISCONNECTED") {
                //process.exit(0);
            }
        });
        this.channel.on('message', (msg) => {
            console.log("RECV:>", msg)
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

    async balance(opts={}) {
        return await this.nodeuser.balance(this.pubkey, opts);
    }
}



/*-----------------------------------------------------------------------------------
    UTIL FUNCTIONS
---------------------------------------------------------------------------------- */
const null_func = () => {};

function call_async(f, ...args) {
    f(...args).then(null_func).catch(console.error);
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

async function wait_state(expected) {
    return await wait_for(() => STATUS === expected);
}

async function wait_for(func) {
    while (!func()) {
        await sleep(100);
    }
}


(async function () {
    let is_initiator = (process.argv[2][0].toLowerCase() === "i");
    let peer =  (is_initiator) ? MyChannel.Initiator() :  MyChannel.Responder();

    await peer.init();

    let h = await peer.height();
    console.log("height:", h, "Balance:", await peer.balance({height: h}));

    await peer.initChannel();

    await wait_state("OPEN");
    await peer.sendMessage("Im your father!");
    await sleep(5000);
    await peer.shutdown();

    await wait_state("DISCONNECTED");
    h = await peer.height();
    console.log("height:", h, "Balance:", await peer.balance({height: h}));

})();
