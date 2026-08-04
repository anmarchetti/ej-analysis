import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import { isDefined } from 'frontend/utils/object.utils';
import { PromocodeStatuses, TPromoCodeStatusesType } from 'models/data/IPromocode';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import { IPriceJumpPopupFields } from './PriceJumpPopup';

const HINDRANCE_PRICE_DELTA = 0.5;

export const getAmendmentDescriptionTemplate = (
    { flight, transfer }: Partial<Record<'flight' | 'transfer', boolean>>,
    fields: IPriceJumpPopupFields,
) => {
    if (flight) {
        return fields.FlightDescription.value;
    }

    if (transfer) {
        return fields.TransferDescription.value;
    }

    return fields.DefaultDescription.value;
};

export const getPromoCodeSubtitle = (
    fields: IPriceJumpPopupFields,
    status?: TPromoCodeStatusesType,
): ISitecoreField<string> | undefined => {
    switch (status) {
        case PromocodeStatuses.TIER_UPGRADE:
            return fields.PromoUpgradeLabel;
        case PromocodeStatuses.TIER_DOWNGRADE:
            return fields.PromoDowngradeLabel;
        case PromocodeStatuses.PROMOCODE_REMOVED:
            return fields.PromoRemoveLabel;

        default:
            return;
    }
};

export const getPriceJumpPopupOptions = (
    selectedItemPrice: number | undefined,
    prevSelectedItemPrice: number | undefined,
): { deltaPrice: number; isPriceJumpPopupShownByPrice: boolean; totalPrice: number } => {
    if (selectedItemPrice === undefined || prevSelectedItemPrice === undefined) {
        return {
            deltaPrice: 0,
            totalPrice: 0,
            isPriceJumpPopupShownByPrice: false,
        };
    }

    // Need to round the prices pre-calculation otherwise the increase/decrease may be incorrect
    const delta = getAmendmentRoundedPrice(selectedItemPrice) - getAmendmentRoundedPrice(prevSelectedItemPrice);
    const actualDelta = Math.abs(delta) <= HINDRANCE_PRICE_DELTA ? 0 : delta;

    return {
        deltaPrice: actualDelta,
        totalPrice: getAmendmentRoundedPrice(selectedItemPrice),
        isPriceJumpPopupShownByPrice: !!actualDelta && isDefined(selectedItemPrice),
    };
};

type TGetPriceParams = Partial<
    Record<
        'flight' | 'transfer' | 'dates' | 'hotel' | 'payment',
        {
            isPage: boolean;
            prevPrice?: number;
            price?: number;
            totalPriceToBeShown?: number;
        }
    >
>;
export const getPrices = (data: TGetPriceParams): ReturnType<typeof getPriceJumpPopupOptions> => {
    const availableFlow = Object.values(data).find(({ isPage }) => isPage);

    const priceOptions = getPriceJumpPopupOptions(availableFlow?.price, availableFlow?.prevPrice);

    return {
        ...priceOptions,
        totalPrice: availableFlow?.totalPriceToBeShown
            ? getAmendmentRoundedPrice(availableFlow.totalPriceToBeShown)
            : priceOptions.totalPrice,
    };
};
