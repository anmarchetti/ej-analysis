export enum OfferPromotionCodes {
    Luxury = 'lux',
    FlightAndHotel = 'fph',
}

export const MAP_OFFER_PROMOTION_CODES_TO_SITE_SETTINGS: Record<string, OfferPromotionCodes> = {
    ['Flight Plus Hotel']: OfferPromotionCodes.FlightAndHotel,
    ['Luxury']: OfferPromotionCodes.Luxury,
};
