import axios from 'axios';
import { getShortDate, getLongDate } from '../util/tools'
import aeternity from './aeternity';

export default async function getTxHistory(from) {
  let res;
  if (from === undefined)
    res = await axios.get(
      "https://aehub.coinfabrik.com:3000/client/history/" + await aeternity.getAddress() + "/"
    );
  else
    res = await axios.get(
      "https://aehub.coinfabrik.com:3000/client/history/" + await aeternity.getAddress() + "/" + from
    );
  const dataWithDate = res.data.map(element => { element.shortDate = getShortDate(element.timestamp); element.longDate = getLongDate(element.timestamp); return element; });
  return dataWithDate.map(element => { element.item = JSON.parse(element.item); return element; })
}