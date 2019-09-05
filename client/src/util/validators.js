/* eslint-disable no-console */
/* eslint-disable no-useless-escape */
import { Crypto } from '@aeternity/aepp-sdk'
import BigNumber from 'bignumber.js';
import validator from 'validator';

export function validateAddress(addr) {
    return Crypto.isAddressValid(addr);
}

export function validateOnboardingQr(qrtext) {
    if (qrtext === undefined) {
        return false;
    }

    try {
        let obj = JSON.parse(qrtext);
        if (obj.hub === undefined) {
            console.error("Onboarding QR:  Does not contain required fields (hub) ");
            return false;
        }

        const ip_port_regex = "^(http:\/\/|https:\/\/){1}([^:/]+):[0-9]+$";

        if ((!validator.matches(obj.hub, ip_port_regex))) {
            console.error("Onboarding QR: Requires hub  in http[s]://IP:PORT format");
            return false;
        }

        return true;
    } catch (e) {
        console.error("Validating Onboarding QR Text as JSON failed. Reason: " + e.toString());
        return false;
    }
}

export function validatePurchaseQr(qrtext) {
    if (qrtext === undefined) {
        return false;
    }

    try {
        let obj = JSON.parse(qrtext);
        if ( !obj.hasOwnProperty('amount')
            || !obj.hasOwnProperty('something')
            || !obj.hasOwnProperty('uuid')
            || !obj.hasOwnProperty('merchant')
            || !obj.hasOwnProperty('type')) {
            console.error("Payment QR: does not contain required fields");
            return false;
        }

        if (new BigNumber(obj.amount).isLessThanOrEqualTo(0)) {
            console.error("Payment QR: Amount field less than or equal to 0");
            return false;
        }

        if (!validator.isUUID(obj.uuid, 4)) {
            console.error("Payment QR: Invalid UUIDv4 type identifier");
            return false;
        }

        if (obj.type !== "payment-request") {
            console.error("Payment QR: Invalid type [not payment-request]");
            return false;
        }

        return true;
    } catch (e) {
        console.error("Validating Purchase QR Text as JSON failed. Reason: " + e.toString());
        return false;
    }
}