import { IOffer } from 'models/data/IOffer';

export const getShortlistOfferIdentifier = (offer: IOffer | undefined): string | null =>
    offer ? `${getStringOrNull(offer.hotel?.name)} | ${getStringOrNull(offer.accom?.id || offer.accom?.code)}` : null;

const getStringOrNull = (value: string | undefined): string | null => value || null;
