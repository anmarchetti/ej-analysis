import { toJS } from 'mobx';

import { envAll } from 'code/env';
import { Tokens } from 'code/tokens';
import { LayoutStore } from 'frontend/store/holidays';
import { IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IApplePayBookingPaymentInfo } from 'models/data/IAmendBookingRequestBody';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { IPaymentHistoryItem, IPaymentTrackingEvent } from 'models/data/IPaymentInfo';
import { IExtraPriceBreakdown, IPriceBreakdownItem } from 'models/data/IValidPackageInfo';
import { IPayDetailsFullWithApplePay, TPayDetails } from 'models/data/payment/IPayDetails';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import { IPaymentPageFields } from './interfaces';

export interface IPaymentMethod {
    cash: number;
    credit: number;
}

export interface IPriceBreakdownFphConfig {
    discount: number;
    isFph: boolean;
    text: string;
}

export const sendTrackingEvent = async (clientId: string, eventList: IPaymentTrackingEvent[]): Promise<void> => {
    try {
        await fetch(
            `https://www.google-analytics.com/mp/collect?measurement_id=${envAll.GA_MEASUREMENT_ID}&api_secret=${envAll.GA_TRACKING_API_SECRET}`,
            {
                method: 'POST',
                body: JSON.stringify({
                    client_id: clientId,
                    events: eventList,
                }),
            },
        );
    } catch (error) {
        console.error(error);
    }
};

export const getPaymentErrorMessage = (error: IPaymentFailureItem): string => {
    const description = error?.code ?? error?.descriptionKey;

    return `${error.messageKey} - ${description}`;
};

export const getPaymentLabelForSuccess = (payments: IPaymentHistoryItem[]): IPaymentMethod => {
    let cashAmount = 0;
    let creditAmount = 0;

    for (const payment of payments) {
        if (payment.isCredit) {
            creditAmount += payment.amount;
        } else {
            cashAmount += payment.amount;
        }
    }

    return {
        cash: cashAmount,
        credit: creditAmount,
    };
};

export const getPaymentLabelForBalancePaymentSuccess = (
    payDetails?: TPayDetails | IPayDetailsFullWithApplePay | IApplePayBookingPaymentInfo,
): IPaymentMethod => {
    if (payDetails) {
        const cashAmount = 'amount' in payDetails ? payDetails.amount : 0;
        const creditAmount = payDetails.creditAmount ?? 0;

        return {
            cash: cashAmount,
            credit: creditAmount,
        };
    }

    return {
        cash: 0,
        credit: 0,
    };
};

export const getDepositDescriptionField = (
    isPricePPShown: boolean,
    isTaxIncluded: boolean,
    fields?: IPaymentPageFields,
): ISitecoreField<string> => {
    if (!fields) {
        return { value: '' };
    }

    if (isTaxIncluded && isPricePPShown) {
        return fields.PayWithDepositDescriptionIncludingTax ?? { value: '' };
    }

    if (isTaxIncluded) {
        return fields.PayWithDepositDescriptionOnePassengerIncludingTax ?? { value: '' };
    }

    if (isPricePPShown) {
        return fields.PayWithDepositDescription;
    }

    return fields.PayWithDepositDescriptionOnePassenger;
};

export const getFullPriceDescriptionField = (
    isTaxIncluded: boolean,
    fields?: IPaymentPageFields,
): ISitecoreField<string> => {
    if (!fields) {
        return { value: '' };
    }

    if (isTaxIncluded) {
        return fields.PayFullDescriptionIncludingTax ?? { value: '' };
    }

    return fields.PayFullDescription;
};

export const createFphData = (
    getPhrase: (key: string) => string,
    isFlightAndHotelPackage: boolean,
    discount: number = 0,
): IPriceBreakdownFphConfig => {
    if (!isFlightAndHotelPackage) {
        return {
            isFph: false,
            discount: 0,
            text: '',
        };
    }

    return {
        isFph: true,
        discount,
        text: getPhrase(SitecoreDictionary.FlightPlusHotelPricesFlightPlusHotel),
    };
};

export const getPriceBreakdown = (
    booking: IBookingInfo | undefined,
    extraPriceBreakdown: IExtraPriceBreakdown[] | undefined,
    priceBreakdown: Nullable<IPriceBreakdownItem[]>,
    isTouristTax: boolean,
    fphData?: IPriceBreakdownFphConfig,
): IExtraPriceBreakdown[] | Nullable<IPriceBreakdownItem[]> => {
    let breakdownValue =
        booking?.extraPriceBreakdown ?? extraPriceBreakdown ?? booking?.priceBreakdown ?? priceBreakdown;

    if (!breakdownValue) {
        return undefined;
    }

    const hasFphWithDiscount = fphData?.isFph && fphData?.discount;
    const hasMinimalBreakdown = breakdownValue.length <= 1;

    if (hasMinimalBreakdown && isTouristTax && !hasFphWithDiscount) {
        return undefined;
    }

    if (fphData?.isFph) {
        breakdownValue = breakdownValue.map(item =>
            item.code === PriceBreakdownCode.Holiday
                ? { ...item, name: fphData.text, amount: item.amount + fphData.discount }
                : item,
        );
    }

    return breakdownValue;
};

export const getPaymentHistory = (
    isBooking: boolean,
    isPayRemaining?: boolean,
    paymentHistory?: IPaymentHistoryItem[],
): Nullable<IPaymentHistoryItem[]> => (isBooking && isPayRemaining ? paymentHistory : undefined);

export const getExtrasFromPriceBreakdown = (
    priceBreakdown: Nullable<IPriceBreakdownItem[]> | IExtraPriceBreakdown[] | undefined,
): Nullable<IPriceBreakdownItem> => {
    if (!priceBreakdown) {
        return undefined;
    }

    return priceBreakdown.find(item => item.code === PriceBreakdownCode.Extras);
};

export const getTouristTaxBannerProps = ({
    offer,
    fields,
    getPhrase,
    currencySymbol = '£',
}: {
    currencySymbol: string;
    fields: IPaymentPageFields;
    getPhrase: LayoutStore['getPhrase'];
    offer: Nullable<IOfferWithoutAltBoards>;
}): null | { text: ISitecoreField<string>; title: ISitecoreField<string> } => {
    if (!offer || !fields) return null;

    const { touristTax } = offer;

    if (touristTax === 0)
        return {
            title: fields.TouristTaxNoPaymentRequiredBannerTitle,
            text: fields.TouristTaxNoPaymentRequiredBannerText,
        };

    const taxesAndFees = Object.values(toJS(offer.taxesAndFees) || {});

    if (!taxesAndFees.length) return null;

    const amountList: string[] = [];
    const exchangeRateList: string[] = [];

    for (const { currency, totalLocalPrice, exchRt } of taxesAndFees) {
        amountList.push(`${currency} ${totalLocalPrice} (${currencySymbol}${Math.ceil(totalLocalPrice / exchRt)})`);
        exchangeRateList.push(`${currencySymbol}1 = ${currency} ${exchRt}`);
    }

    const amount = amountList.join(' + ');
    const exchangeRate = exchangeRateList.join(` ${getPhrase(SitecoreDictionary.GlobalConjunctionsAnd)} `);

    return {
        title: fields.TouristTaxPaymentRequiredBannerTitle,
        text: {
            value: Tokenizer.replaceTokens(fields.TouristTaxPaymentRequiredBannerText.value, {
                [Tokens.Amount]: amount,
                [Tokens.ExchangeRate]: exchangeRate,
            }),
        },
    };
};
