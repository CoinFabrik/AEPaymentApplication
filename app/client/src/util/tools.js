import moment from 'moment';
import isValidAddr, { validateAddress } from './validators'

export function getShortDate(timestamp) {
  return moment(timestamp).format('DD/MM HH:mm');
}

export function getLongDate(timestamp) {
  return moment(timestamp).format('DD/MM/YYYY HH:mm:ss');
}

export async function sleep(ms) {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => { resolve() }, ms);
    } catch (e) {
      reject(e)
    }
  })
}

export function trimAddress(aeAddress) {
  if (!validateAddress(aeAddress))
    return "invalid_addr";
  return aeAddress.substr(0, 8) + "..." + aeAddress.substr(aeAddress.length - 5, aeAddress.length - 1);
}

export function trimHash(aeTxHash) {
  // TODO: should validate hash...
  return aeTxHash.substr(0, 10) + "..." + aeTxHash.substr(aeTxHash.length - 7, aeTxHash.length - 1);
}