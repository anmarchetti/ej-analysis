import { BaseQueryParamsStore } from 'frontend/store/base';
import { TradePortalRootStore } from 'frontend/store/tradePortal/TradePortalRootStore';
import { IOffer } from 'models/data/IOffer';
import { Bd4TravelListIdTrade } from 'models/enum/Bd4TravelListId';
import { QueryParamName } from 'models/enum/QueryParamName';

export class TradePortalQueryParamsStore extends BaseQueryParamsStore {
    constructor(public rootStore: TradePortalRootStore) {
        super(rootStore);
    }

    public buildBD4HotelParam = (
        offerPosition: number,
        paramName: QueryParamName,
    ): Nullable<Partial<Record<QueryParamName, string>>> =>
        super.buildBD4HotelParam(offerPosition, paramName, Bd4TravelListIdTrade);

    updatePageWithLCBQuery = (): void => {
        const lcbParams = this.updatePageWithLCBQueryBase();

        this.rootStore.routerStore.updateCurrentPage(this.buildHotelDetailsQuery(undefined, lcbParams));
    };

    buildHotelDetailsQuery = (
        offer: Nullable<IOffer> = undefined,
        params: AnyObject = {},
        fallbackParams: AnyObject = {},
    ): string => {
        const linkParams = this.hotelParamsBase(offer, params);

        return this.buildHotelDetailsQueryBase(fallbackParams, linkParams);
    };
}
