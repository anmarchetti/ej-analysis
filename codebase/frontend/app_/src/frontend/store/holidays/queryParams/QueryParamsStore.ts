import { computed } from 'mobx';

import { DATE_FORMATS } from 'code/dates';
import { BaseQueryParamsStore } from 'frontend/store/base';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { addDays, formatDateL10n, parseDateL10n } from 'frontend/utils/date.utils';
import { isShortlistOfferUnavailable } from 'frontend/utils/shortlist.utils';
import { buildRoomAllocationFromOfferUnitParams } from 'frontend/utils/url.utils';
import { HotelDetailsUtm } from 'frontend/utils/utm.utils';
import { ISelectedFilter } from 'models/data/IFilters';
import { IOffer } from 'models/data/IOffer';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath from 'models/enum/SitePath';

export class QueryParamsStore extends BaseQueryParamsStore {
    constructor(public rootStore: HolidaysRootStore) {
        super(rootStore);
    }

    /** Media Center `Topics` */
    @computed get selectedTopicsFromUrl(): ISelectedFilter[] {
        return this.parseArrayValue(this.query[QueryParamName.Topics]).map((topic: string) => ({
            code: topic,
            name: topic,
            groupCode: FilterGroupCodes.Topics,
        }));
    }

    @computed get parkingCodeFromUrl() {
        return this.parseStringValue(this.query[QueryParamName.AirportParkingCode]);
    }

    public buildShortlistHotelQuery = (offer: IOffer): string => {
        const params = {
            [QueryParamName.Origin]: [offer.transport.routes[0].depPt],
            [QueryParamName.Rooms]: buildRoomAllocationFromOfferUnitParams(offer?.accom?.unit),
        };

        if (isShortlistOfferUnavailable(offer)) {
            // origins and rooms used to prefill 'From' and 'Who' SearchPod fields on Hotel Browse
            return this.stringifyQuery(params);
        }

        const transfer = offer.transfers?.[0]?.code || '';
        const startDate = parseDateL10n(offer.date, DATE_FORMATS.query) as Date;
        const endDate = addDays(offer.stay, startDate);

        params[QueryParamName.Transfer] = transfer;
        params[QueryParamName.DefaultTransfer] = transfer;
        params[QueryParamName.From] = formatDateL10n(startDate);
        params[QueryParamName.To] = formatDateL10n(endDate);
        params[QueryParamName.Destination] = offer.accom?.id;
        params[QueryParamName.Geog] = '';

        return this.buildHotelDetailsQuery(offer, params);
    };

    public buildHotelQueryPromotingIframe = (offer: IOffer): string => {
        const accomId = offer.accom?.id;

        let queryParams: { [key: string]: any } = {
            [QueryParamName.Destination]: accomId,
            [QueryParamName.IsPromotingIframe]: true,
            [QueryParamName.IsReferer]: 1,
        };

        if (this.childrenQuantity || this.totalGuestQuantity === 1) {
            queryParams[QueryParamName.OpenSearchPodWhoField] = 1;
            queryParams[QueryParamName.Rooms] = this.buildRoomAllocationFromBookingStore();
            queryParams[QueryParamName.AccommodationId] = accomId;
            queryParams[QueryParamName.To] = formatDateL10n(this.rootStore.searchStore.searchWhen.to as Date);
            queryParams[QueryParamName.From] = formatDateL10n(this.rootStore.searchStore.searchWhen.from as Date);
            queryParams[QueryParamName.Origin] = (this.rootStore.searchStore.searchFrom.origins || []).map(
                origin => origin,
            );
        } else {
            const hotelParams = this.hotelParams(offer);
            delete hotelParams[QueryParamName.Geog];
            queryParams = {
                ...hotelParams,
                ...queryParams,
                [QueryParamName.SearchAccommodationId]: accomId,
            };
        }

        // add utm params per http://jra.europe.easyjet.local/browse/EJH-6747
        queryParams = {
            ...queryParams,
            ...HotelDetailsUtm,
        };

        return this.stringifyQuery(queryParams);
    };

    public buildMediaCenterFiltersQuery = (forceTopic?: string): string => {
        const queryParams: { [key: string]: any } = {};
        queryParams[QueryParamName.Topics] = forceTopic
            ? [forceTopic]
            : this.rootStore.mediaCenterStore.selectedFilters
                  .filter(filter => filter.groupCode === FilterGroupCodes.Topics)
                  .map(filter => filter.code);

        return this.stringifyQuery(queryParams);
    };

    public buildRedirectUrlToRedeemPage = (): string =>
        this.stringifyQuery({ [QueryParamName.RedirectUrl]: SitePath.RedeemVoucher });

    public buildRedirectUrlToShortlistPage = (): string =>
        this.stringifyQuery({ [QueryParamName.RedirectUrl]: SitePath.Shortlists });

    public buildBD4HotelParam = (
        offerPosition: number,
        paramName: QueryParamName,
    ): Nullable<Partial<Record<QueryParamName, string>>> => super.buildBD4HotelParam(offerPosition, paramName);

    updatePageWithLCBQuery = (): void => {
        const lcbParams = this.updatePageWithLCBQueryBase();

        this.rootStore.routerStore.updateCurrentPage(this.buildHotelDetailsQuery(undefined, lcbParams));
    };

    buildHotelDetailsQuery = (
        offer: Nullable<IOffer> = undefined,
        params: AnyObject = {},
        fallbackParams: AnyObject = {},
    ): string => {
        const linkParams = this.hotelParams(offer, params);

        return this.buildHotelDetailsQueryBase(fallbackParams, linkParams);
    };

    public hotelParams = (
        offer: Nullable<IOffer> = undefined,
        params: { [key: string]: string } = {},
    ): Partial<Record<QueryParamName, string | number | IQueryRoom[] | undefined>> => {
        const baseParams = this.hotelParamsBase(offer, params);

        const selectedAirportParking = this.rootStore.airportParkingStore.selectedAirportParking;

        if (selectedAirportParking) {
            baseParams[QueryParamName.AirportParkingCode] = selectedAirportParking.bookingDetails.productCode;
        }

        return baseParams;
    };
}
