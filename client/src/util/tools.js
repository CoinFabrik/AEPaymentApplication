import moment from 'moment';

export function getShortDate(timestamp) {
	return moment(timestamp).format('DD/MM HH:mm');
}

export function getLongDate(timestamp) {
	return moment(timestamp).format('DD/MM/YYYY HH:mm:ss');
}
