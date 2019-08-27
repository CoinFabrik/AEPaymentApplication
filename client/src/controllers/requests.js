import axios from 'axios';
import {getShortDate, getLongDate} from '../util/tools'
import aeternity from './aeternity';

export default async function getTxHistory(from) {
	let res;
	const address = await aeternity.getAddress();
	const url = "https://10.10.0.24:3000/client/history/" + String(address) + "/"
	if (address) {
		if(!from)
			res = await axios.get(url);
		else
			res = await axios.get(url + from);
		const dataWithDate = res.data.map(element => { element.shortDate = getShortDate(element.timestamp); element.longDate = getLongDate(element.timestamp); return element; });
		return dataWithDate.map(element => {element.item = JSON.parse(element.item); return element;})
	}
	this.$swal.fire('error', 'Invalid address', 'Cannot get the address of this wallet!')
}