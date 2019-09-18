import BigNumber from 'bignumber.js'

// Displays two-decimal, rounded-down AEs from unit in Aettos.
//
export function DisplayUnitsToAE(units, options) {
    return (BigNumber(units).dividedBy(BigNumber(10**18)).toFixed(
        options.digits === undefined ? 2 : option.digits, 
        options.rounding === undefined ? BigNumber.ROUND_DOWN : options.rounding)).toString();
}
