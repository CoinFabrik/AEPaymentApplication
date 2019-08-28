import BigNumber from 'bignumber.js'

// Displays two-decimal, rounded-down AEs from unit in Aettos.
//
export function DisplayUnitsToAE(units) {
    return (BigNumber(units).dividedBy(BigNumber(10**18)).toFixed(2, BigNumber.ROUND_DOWN)).toString();
}
