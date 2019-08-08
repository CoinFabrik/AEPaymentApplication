import { validateAddress } from '../util/validators.js'

export function makeBuyMessage(price, items, customer) {
    if (price <= 0 || !price) {
        throw Error("Price in Buy-message  must be positive");
    }

    if (items === undefined || items.length == 0) {
        throw Error("Items array in buy-message must be defined and not-empty");
    }

    if (customer === undefined) {
        throw Error("Customer address in buy-message must be defined");
    }

    if (!validateAddress(customer)) {
        throw Error("Customer address is not valid");
    }

    // Convert price to aettos

    // TODO: new BigNumber(price).multipliedBy(10**18);

    return {
        "amount": price * (10**18),
        "something": items,
        "toId": customer,
        "type": "buy-request",
    }
}