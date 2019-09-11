import BigNumber from 'bignumber.js'

// Displays two-decimal, rounded-down AEs from unit in Aettos.
//
export function DisplayUnitsToAE(units, digits) {
    return (BigNumber(units).dividedBy(BigNumber(10**18)).toFixed(digits === undefined ? 2 : digits, BigNumber.ROUND_DOWN)).toString();
}
