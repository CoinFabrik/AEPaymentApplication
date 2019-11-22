//import { validateAddress } from '../util/validators.js'
const uuidv4 = require('uuid/v4');
import BigNumber from 'bignumber.js'

export function makePaymentQrData(price, items, merchant) {
    if (price <= 0 || !price) {
        throw Error("Price in Buy-message  must be positive");
    }

    return {
        "amount": ((new BigNumber(price)).multipliedBy(new BigNumber(10).exponentiatedBy(18))).toString(10),
        "something": items,
        "merchant": merchant,
        "type": "payment-request"
    }
}
