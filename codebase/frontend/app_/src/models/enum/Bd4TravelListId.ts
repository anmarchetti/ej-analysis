export enum Bd4TravelListIdHolidays {
    HotelsList = 'hotels_list',
    PromoList = 'promo_hotels_list',
}

export enum Bd4TravelListIdTrade {
    HotelsList = 'hotels_trade',
    PromoList = 'promo_hotels_trade',
}

export type TBd4TravelListId = typeof Bd4TravelListIdHolidays | typeof Bd4TravelListIdTrade;

export enum Bd4TravelPlacementId {
    HotelBook = 'ejh-reco-pdp-book-bottom',
    TradeHotelBook = 'trade-ejh-reco-pdp-book-bottom',
    HotelBrowse = 'ejh-reco-pdp-browse-bottom',
    Destination = 'ejh-reco-dg-central',
    SearchResults = 'ejh-reco-sr-bottom',
    TradeSearchResults = 'trade-ejh-reco-sr-bottom',
    PromoPage = 'ejh-reco-promo-bottom',
    TradePromoPage = 'trade-ejh-reco-promo-bottom',
    PromoPageErrorInternal = 'ejh-promo-error-internal',
    PromoPageErrorExternal = 'ejh-promo-error-external',
    NotFoundPageInternal = 'ejh-reco-carousel-404-internal',
    NotFoundPageExternal = 'ejh-reco-carousel-404-external',
    FiveResultsOnSearchResults = 'ejh-reco-sr-bottom-5',
    TradeFiveResultsOnSearchResults = 'trade-ejh-reco-sr-bottom-5',
    FiveResultsOnPromo = 'ejh-reco-promo-bottom-5',
    TradeFiveResultsOnPromo = 'trade-ejh-reco-promo-bottom-5',
}
