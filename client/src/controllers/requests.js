import axios from 'axios';
import {getShortDate, getLongDate} from '../util/tools'

export default async function getTxHistory(from) {
	let res;
	if(from === undefined)
		res = await axios.get(
			"http://" + "10.10.0.24:3000" +
			"/client/history/" +
			"ak_9k9FzYxNbwrXYLVB8EDjhjspZbKzG9zWDTydqHVkDRR8To5Hs"
		);
	else
		res = await axios.get(
			"http://" + "10.10.0.24:3000" +
			"/client/history/" +
			"ak_9k9FzYxNbwrXYLVB8EDjhjspZbKzG9zWDTydqHVkDRR8To5Hs/" + from
		);
	const dataWithDate = res.data.map(element => { element.shortDate = getShortDate(element.timestamp); element.longDate = getLongDate(element.timestamp); return element; });
	return dataWithDate.map(element => {element.item = JSON.parse(element.item); return element;})
}