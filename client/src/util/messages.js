//import { validateAddress } from '../util/validators.js'
const uuidv1 = require('uuid/v1');
import BigNumber from 'bignumber.js'

export function makeBuyMessage(price, items) {
    if (price <= 0 || !price) {
        throw Error("Price in Buy-message  must be positive");
    }

    if (items === undefined || items.length == 0) {
        throw Error("Items array in buy-message must be defined and not-empty");
    }

    return {
        "id": uuidv1(),
        "amount": ((new BigNumber(price)).multipliedBy(new BigNumber(10).exponentiatedBy(18))).toString(10),
        "something": items,
        "type": "buy-request"
    }
}