import { buildLivePriceCode, getRequestedPriceAmountText } from 'frontend/utils/livePrice.utils';
import { IRequestedPrice } from 'models/data/IRequestedPrice';
import { IHolidayTypesHubEventParams } from 'models/data/tracking/IEventWithParams';

import { IDealsDestinationsCard, IDealsDestinationTileFields } from './interfaces';

export const getDestTileRequestedPriceText = (
    fields: IDealsDestinationTileFields,
    pricesByDestCodes: Map<string, IRequestedPrice>,
    formatMoney: (amount: number) => string,
): string => {
    const dest = fields.Destination?.[0]?.fields;
    const destCode = dest?.Code?.value;
    const isPriceEnabled = fields.IsRequestedPriceEnabled?.value;
    const isPricePP = !!fields.IsRequestedPricePP?.value;
    const priceMathFunction = fields.PriceMathFunction?.fields?.Code?.value;
    const reqPrice = destCode && pricesByDestCodes && isPriceEnabled ? pricesByDestCodes.get(destCode) : null;

    return reqPrice ? getRequestedPriceAmountText(reqPrice, priceMathFunction, isPricePP, formatMoney) : '';
};

export const getCardsRequestedPriceCodes = (cards: IDealsDestinationsCard[], searchName?: string): string[] =>
    cards.reduce((codes, card) => {
        (card.fields?.Tiles || []).forEach(tile => {
            const dest = tile.fields?.Destination?.[0]?.fields;
            const destCode = dest?.Code?.value;
            const isPriceEnabled = tile.fields?.IsRequestedPriceEnabled?.value;

            if (destCode && isPriceEnabled) {
                const priceCode = buildLivePriceCode(destCode, searchName);
                codes.push(priceCode);
            }
        });

        return codes;
    }, [] as string[]);

export const collectCardsTrackingInfo = (
    cards: IDealsDestinationsCard[],
    pricesByDestCodes: Map<string, IRequestedPrice>,
    formatMoney: (amount: number) => string,
): IHolidayTypesHubEventParams[] =>
    cards.reduce((events, card) => {
        const { Country, Title, Tiles } = card.fields;

        const event: IHolidayTypesHubEventParams = {
            moduleTitle: Title?.value || Country?.fields?.Name?.value || '',
        };

        (Tiles || []).forEach(tile => {
            const dest = tile.fields?.Destination?.[0]?.fields?.Name.value;
            const price = getDestTileRequestedPriceText(tile.fields, pricesByDestCodes, formatMoney) || formatMoney(0);

            if (dest) {
                event.destinationName = event.destinationName ? `${event.destinationName}|${dest}` : dest;
                event.price = event.price ? `${event.price}|${price}` : price;
            }
        });

        events.push(event);

        return events;
    }, [] as IHolidayTypesHubEventParams[]);
