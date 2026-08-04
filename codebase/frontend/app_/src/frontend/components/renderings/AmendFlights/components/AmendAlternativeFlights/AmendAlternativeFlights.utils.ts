import { IAmendTransport } from 'models/data/IAmendBookingFlights';
import { IAmendPromoFields } from 'models/data/IAmendFlights';
import { PromocodeStatuses } from 'models/data/IPromocode';
import { ITransferWithAmendmentCharges } from 'models/data/ITransfer';

export const getPromoMessage = (promoCodeStatus, fields?: IAmendPromoFields) => {
    if (!fields) {
        return '';
    }

    switch (promoCodeStatus) {
        case PromocodeStatuses.TIER_UPGRADE:
            return fields.UpgradePromoText?.value;
        case PromocodeStatuses.TIER_DOWNGRADE:
            return fields.DowngradePromoText?.value;
        case PromocodeStatuses.PROMOCODE_REMOVED:
            return fields.NotValidPromoText?.value;
        case PromocodeStatuses.ERROR:
            return fields.ErrorPromoText?.value;
        default:
            return '';
    }
};

export const getAmendAlternativeTransports = (
    transports: (IAmendTransport | ITransferWithAmendmentCharges)[],
    fields?: IAmendPromoFields,
): ((IAmendTransport | ITransferWithAmendmentCharges) & { errataMessages: string[] })[] =>
    transports.map(transport => {
        const hasError = transport.promoCodeBreakDown?.errors?.some(error => !!error.message);
        const promoMessage = getPromoMessage(
            hasError ? PromocodeStatuses.PROMOCODE_REMOVED : transport.promoCodeBreakDown?.promoCodeStatus,
            fields,
        );

        const errataMessages = [...(transport.errataFlightInfo || [])];

        if (promoMessage) {
            errataMessages.push(promoMessage);
        }

        return { ...transport, errataMessages };
    });
