import {Get, getEnv, voidf} from "./tools";

//const port = 3001;
let URL = getEnv('AENODE', '10.10.0.79'); //+ ':' + port;
if(-1===URL.indexOf(":")) {
    URL = URL + ":3001"
}
//let URL = 'localhost:'+port;
export const API_URL = "http://" + URL;
export const WS_URL = "ws://" + URL;  // http is ok too
export const INTERNAL_API_URL = API_URL;
//const compilerURL = 'https://compiler.aepps.com';

export const ACCOUNT = getEnv("ACCOUNT", "hub");
export const NETWORK_ID = 'ae_devnet';



export class MoreConfig {
    static external_ip = null;

    static async Init() {
        try {
            this.external_ip = getEnv("EXTERNAL_IP");
            if (this.external_ip==undefined) {
                let result = await Get("ipcheck.dynu.com", "/ipcheck.asp");
                if(result.startsWith("ip")) {
                    this.external_ip = result.slice(2);
                } else {
                    console.error("Cant't get external ip from: http://ipcheck.dynu.com/ipcheck.asp returns: "+result);
                }
            }
        } catch(err) {
            console.error("Cant't get external ip from: http://ipcheck.dynu.com/ipcheck.asp STATUS CODE:" +
                err.toString());
        }
    }

    static get ExternalIP(): string {
        return this.external_ip;
    }

    static get USER_NODE(): string {
        return getEnv('USER_NODE', WS_URL);

    }
}

