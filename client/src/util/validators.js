/* eslint-disable no-console */
import { Crypto } from '@aeternity/aepp-sdk'

export function validateAddress(addr) {
    return Crypto.isAddressValid(addr);
}

export function validateOnboardingQr(qrtext) {
    if (qrtext === undefined) {
        return false;
    }

    try {
        let obj = JSON.parse(qrtext);
        if (obj.hub === undefined || obj.node === undefined) {
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
        if (obj.hub === undefined || obj.node === undefined) {
            return false;
        }



        return true;
    } catch (e) {
        console.error("Validating Purchase QR Text as JSON failed. Reason: " + e.toString());
        return false;
    }
}