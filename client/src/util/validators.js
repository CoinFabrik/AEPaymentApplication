import { Crypto } from '@aeternity/aepp-sdk'

export function validateAddress(addr) {
    return Crypto.isAddressValid(addr);
}

