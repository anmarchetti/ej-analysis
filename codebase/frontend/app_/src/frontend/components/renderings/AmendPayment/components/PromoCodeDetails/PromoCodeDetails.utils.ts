import { CurrencyCode } from 'code/currency';
import { Tokens } from 'code/tokens';
import { MarketStore } from 'frontend/store/base';
import { getFormattedValidationErrors } from 'frontend/utils/formattingAPIErrors.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IApiInnerError } from 'models/data/ApiErrorData';
import {
    ErrorPromocodeStatuses,
    PromocodeStatuses,
    TierStatuses,
    TPromoCodeStatusesType,
} from 'models/data/IPromocode';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { IPromoCodeFields } from 'frontend/components/renderings/AmendPayment/interfaces';

const getEdgeCasePromoError = (
    promocodeStatus: TPromoCodeStatusesType,
    fields: IPromoCodeFields,
    formatMoney: MarketStore['formatMoney'],
    currency: CurrencyCode | undefined,
    promocode?: string,
    errors?: IApiInnerError[],
): IApiInnerError[] | null => {
    const isPromoCodeRemovedHasOwnError = promocodeStatus === PromocodeStatuses.PROMOCODE_REMOVED && !!errors?.length;
    const isTierPromoCodeHasNoPromoCode = promocodeStatus in TierStatuses && !promocode;

    if (isPromoCodeRemovedHasOwnError || isTierPromoCodeHasNoPromoCode) {
        return getFormattedValidationErrors(errors || [], formatMoney, currency);
    }

    return null;
};

const getPromoCodeMessage = (
    promocodeStatus: TPromoCodeStatusesType,
    fields: IPromoCodeFields,
    promocode?: string,
    errors?: IApiInnerError[],
): IApiInnerError[] | undefined => {
    let string;
    switch (promocodeStatus) {
        case PromocodeStatuses.TIER_DOWNGRADE:
            string = fields.PromoCodeDowngradedSubtext;
            break;
        case PromocodeStatuses.TIER_UPGRADE:
            string = fields.PromoCodeUpdatedSubtext;
            break;
        case PromocodeStatuses.ERROR:
            string = fields.PromoCodeErrorSubtext;
            break;
        case PromocodeStatuses.PROMOCODE_REMOVED:
            string = fields.PromoCodeRemovedDefaultError;
            break;

        default:
            return errors;
    }

    return [
        {
            code: promocodeStatus,
            message: promocode ? Tokenizer.replaceToken(string?.value, Tokens.PromoCode, promocode) : string?.value,
        },
    ];
};

export const getTransferPromocodeSubtextByStatus = (
    promocodeStatus: TPromoCodeStatusesType,
    fields: IPromoCodeFields,
    formatMoney: MarketStore['formatMoney'],
    currency: CurrencyCode | undefined,
    promocode?: string,
    errors?: IApiInnerError[],
): IApiInnerError[] | undefined => {
    const edgeCaseError = getEdgeCasePromoError(promocodeStatus, fields, formatMoney, currency, promocode, errors);
    const promoCodeMessage = getPromoCodeMessage(promocodeStatus, fields, promocode, errors);

    return edgeCaseError || promoCodeMessage;
};

export const getPromocodeTitleFieldByStatus = (
    promocodeStatus: TPromoCodeStatusesType | undefined,
    fields: IPromoCodeFields,
): ISitecoreField<string> => {
    switch (promocodeStatus) {
        case PromocodeStatuses.ERROR:
            return fields.PromoCodeErrorTitle;

        case PromocodeStatuses.PROMOCODE_REMOVED:
            return fields.PromoCodeRemovedTitle;

        default:
            return fields.PromoCodeChangedTitle;
    }
};

export const getPromocodeHeading = (
    promocodeStatus: TPromoCodeStatusesType | undefined,
    fields: IPromoCodeFields,
): ISitecoreField<string> => {
    switch (promocodeStatus) {
        case PromocodeStatuses.PROMOCODE_REMOVED:
            return fields.PromoCodeRemovedHeading;

        case PromocodeStatuses.TIER_DOWNGRADE:
            return fields.PromoCodeDowngradeHeading;

        case PromocodeStatuses.TIER_UPGRADE:
        default:
            return fields.PromoCodeUpdatedHeading;
    }
};

export const getShouldShowPromocode = (promoCodeStatus: TPromoCodeStatusesType | undefined): boolean => {
    if (!promoCodeStatus) {
        return false;
    }

    return promoCodeStatus in ErrorPromocodeStatuses;
};
