import { IMyCreditInfo } from 'models/data/MyCreditInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export const getCreditsLabels = (
    allCredits: Nullable<IMyCreditInfo[]>,
    marketCreditBalance: number,
    isGiftCardRedemptionEnabled: boolean,
    getPhrase: (key: string) => string,
) => {
    const activeCreditsLength =
        (allCredits?.length && allCredits.reduce((acc, credit) => (credit.balance > 0 ? ++acc : acc), 0)) || 0;

    // User has credit only in current market
    if (activeCreditsLength === 1 && marketCreditBalance > 0) {
        return {
            title: getPhrase(SitecoreDictionary.ViewBookingsTitlesViewCreditCard),
            description: getPhrase(SitecoreDictionary.ViewBookingsLabelsViewCreditCard),
            creditButtonText: getPhrase(SitecoreDictionary.ViewBookingsButtonsViewCredit),
            creditAmount: marketCreditBalance,
        };
    }

    // User has at least one credit in different markets
    if (activeCreditsLength) {
        return {
            title: getPhrase(SitecoreDictionary.ViewBookingsTitlesViewCreditCards),
            description: getPhrase(SitecoreDictionary.ViewBookingsLabelsViewCreditCards),
            showMultipleCurrenciesInfo: true,
            creditButtonText: getPhrase(SitecoreDictionary.ViewBookingsButtonsViewCredits),
        };
    }

    // User doesn't have credits, but gift card redemption is enabled
    if (isGiftCardRedemptionEnabled) {
        return {
            title: getPhrase(SitecoreDictionary.ViewBookingsTitlesRedeemVoucher),
            description: getPhrase(SitecoreDictionary.ViewBookingsLabelsRedeemVoucher),
        };
    }

    // User doesn't have credits and no gift card redemption
    return {
        title: getPhrase(SitecoreDictionary.ViewBookingsTitlesViewCreditCard),
        description: getPhrase(SitecoreDictionary.ViewBookingsLabelsViewCreditCard),
        creditButtonText: getPhrase(SitecoreDictionary.ViewBookingsButtonsViewCredit),
    };
};
