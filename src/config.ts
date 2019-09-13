import {Get, getEnv, voidf} from "./tools";

let URL = getEnv('AENODE', '10.10.0.79'); //+ ':' + port;
export const API_URL =  (-1===URL.indexOf("://")) ? "http://" + URL : URL;
export const WS_URL = (-1===URL.indexOf("://")) ? "ws://" + URL: "ws"+(URL.slice(4));
export const ACCOUNT = getEnv("ACCOUNT", "hub");


export class MoreConfig {
    static external_ip = null;

    static get QR_HUB_URL(): string {
        return getEnv("QR_HUB_URL");
    }

    static async Init() {
        if (this.external_ip!=undefined)
            return;
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

    // static get ExternalIP(): string {
    //     return this.external_ip;
    // }

    static get USER_NODE(): string {
        let url = WS_URL;
        url = getEnv('USER_NODE', url);
        if(url.startsWith("wss://")||(url.startsWith("ws://"))) {
            url = url.slice(2);
        }
        return url;
    }

    static get MinimumDepth(): number {
        return Number.parseInt( getEnv("MIN_DEPTH", "3") );
    }

    static async display() {
        console.log("Config:")
        console.log("minimum_depth:", this.MinimumDepth);
        console.log("USER_NODE:", this.USER_NODE);
        console.log("QR_HUB_URL:", this.QR_HUB_URL);
    }
}

