import moment from 'moment';

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