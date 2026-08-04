export enum PaymentScenario {
    BalancePaidPayNow = 'BalancePaidPayNow',
    BalanceOutstandingPayNow = 'BalanceOutstandingPayNow',
    BalancePaidPayLater = 'BalancePaidPayLater',
    BalancePaidPayingOnlyFeeNow = 'BalancePaidPayingOnlyFeeNow',
    BalanceOutstandingPayingOnlyFeeNow = 'BalanceOutstandingPayingOnlyFeeNow',
    BalanceOutstandingPayLater = 'BalanceOutstandingPayLater',
    BalancePaidRefund = 'BalancePaidRefund',
    BalanceOutstandingRefundToBalance = 'BalanceOutstandingRefundToBalance',
    BalanceOutstandingNoPriceChange = 'BalanceOutstandingNoPriceChange',
    BalancePaidNoPriceChange = 'BalancePaidNoPriceChange',
}
