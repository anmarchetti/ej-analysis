import { action, computed, makeObservable, observable } from 'mobx';

import settings from 'code/settings';
import { getUniqArray } from 'frontend/utils/array.utils';
import { parseDateL10n } from 'frontend/utils/date.utils';
import { parseAncString } from 'frontend/utils/seatAndBags.utils';
import { filterInvalidRelativePath, isEncoded, parseQuery } from 'frontend/utils/url.utils';
import { getUtmParams, MixedResultsUtm, UtmOptions } from 'frontend/utils/utm.utils';
import { IHoldLuggageInfo } from 'models/data/IHoldLuggage';
import { IAltAccommodation } from 'models/data/IOffer';
import { TSelectedSeatsFromQuery } from 'models/data/ISeatMapStore';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { FlightPlusHotelQueryParamName } from 'models/enum/FlightPlusHotelQueryParamName';
import { QueryParamName } from 'models/enum/QueryParamName';
import { IMapPopupState } from 'frontend/components/common/MapPopup/MapPopup.utils';

import { FLIGHTS_PLUS_HOTEL_PROVIDER } from './constants';

export class BaseQueryParamsGetters {
    constructor() {
        makeObservable(this);
    }

    @observable.ref public query: any = {};

    @action public parseBrowserQuery = (query: string): void => {
        this.query = parseQuery(query);
    };

    // Search parameters from query
    @computed get specialRequests(): string[] {
        return this.parseArrayValue(this.query[QueryParamName.SpecialRequests]);
    }

    @computed get isReferer(): boolean {
        return !!this.query[QueryParamName.IsReferer];
    }

    @computed get originFromUrl(): string[] {
        return this.parseArrayValue(this.query[QueryParamName.Origin]);
    }

    @computed get inboundFlightNumber(): string {
        return this.query[QueryParamName.InboundFlightNumber];
    }

    @computed get outboundFlightNumber(): string {
        return this.query[QueryParamName.OutboundFlightNumber];
    }

    // get single destination for promo pages
    @computed get destinationFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.Destination]);
    }

    @computed get selectedDestinationCodesFromUrl(): string[] {
        return this.parseArrayValue(this.query[QueryParamName.Destination]);
    }

    /**
     * sAccId is populated when a user directly searches for a hotel or is redirected when only 1 hotel exists
     */
    @computed get selectedAccommodationCodesFromUrl(): string {
        const selectedAccomCodes = this.parseStringValue(this.query[QueryParamName.SearchAccommodationId]).split(',');
        const altAccomCodes = this.parseStringValue(this.query[QueryParamName.AltAccommodationIds]).split(',');

        // combine searchAccommodation with altAccommodation codes
        return getUniqArray(selectedAccomCodes, altAccomCodes).join(',');
    }

    @computed get selectedDestinationCodesQueryFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.Geog]);
    }

    @computed get fromDateFromUrl(): Nullable<Date> {
        const date = parseDateL10n(this.query[QueryParamName.From]);

        return date;
    }

    @computed get toDateFromUrl(): Nullable<Date> {
        return parseDateL10n(this.query[QueryParamName.To]);
    }

    @computed get flexDaysFromUrl(): number {
        const urlValue = this.parseIntValueFromString(this.query[QueryParamName.FlexDays]) || 0;

        return Math.abs(urlValue);
    }

    @computed get isMonthSearchFromUrl(): boolean {
        return !!this.query[QueryParamName.IsMonthSearch];
    }

    @computed get monthSearchDurationFromUrl(): number {
        const urlValue = this.parseIntValueFromString(this.query[QueryParamName.MonthSearchDuration]) || 0;

        return Math.abs(urlValue);
    }

    @computed get durationFromUrl(): number {
        const urlValue = this.parseIntValueFromString(this.query[QueryParamName.Duration]) || 0;

        return Math.abs(urlValue);
    }

    @computed get seasonFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.Season]);
    }

    @computed get childrenQuantity(): number {
        return this.parseIntValueFromString(this.query[QueryParamName.Children]) || 0;
    }

    @computed get adultsQuantity(): number {
        return this.parseIntValueFromString(this.query[QueryParamName.Adults]) || 0;
    }

    @computed get infantsQuantity(): number {
        return this.parseIntValueFromString(this.query[QueryParamName.Infants]) || 0;
    }

    @computed get totalGuestQuantity(): number {
        return this.adultsQuantity + this.childrenQuantity + this.infantsQuantity;
    }

    @computed get isAutoAllocationFromUrl(): boolean | undefined {
        // return undefined if we don't have autoAllocation in query. default value will be used in this case
        if (!this.query[QueryParamName.AutoAllocation]) {
            return undefined;
        }

        return +this.query[QueryParamName.AutoAllocation] === 1;
    }

    @computed get roomsAllocationFromUrl(): IQueryRoom[] {
        const roomsData = this.parseArrayValue(this.query[QueryParamName.Rooms]);

        return this.parseRooms(roomsData);
    }

    @computed get seatSelectionFromUrl(): TSelectedSeatsFromQuery {
        return this.query[QueryParamName.SelectedSeats];
    }

    @computed get luggageSelectionFromUrl(): IHoldLuggageInfo | undefined {
        const data = this.query[QueryParamName.SelectedLuggage];

        return this.parseLuggage(data);
    }

    @computed get sportEquipmentSelectionFromUrl(): IHoldLuggageInfo | undefined {
        const data = this.query[QueryParamName.SelectedSportEquipment];

        return this.parseLuggage(data);
    }

    @computed get offerRoomsAllocationFromUrl(): IQueryRoom[] {
        const roomsData = this.parseArrayValue(this.query[QueryParamName.OfferRooms]);

        return this.parseRooms(roomsData);
    }

    @computed get altAccommodationsFromUrl(): IAltAccommodation[] {
        const altAccommodationIds = this.query[QueryParamName.AltAccommodationIds];
        const altPackageIds = this.query[QueryParamName.AltPackageIds];

        if (altAccommodationIds?.length && altPackageIds?.length) {
            return this.parseAltAccommodations(altAccommodationIds, altPackageIds);
        }

        return [];
    }

    // Offer parameters from query
    @computed get accommodationIdFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.AccommodationId]);
    }

    @computed get outboundFlightIdFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.OutboundId]);
    }

    @computed get inboundFlightIdFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.InboundId]);
    }

    @computed get outboundLCBSelectionFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.SelectedBagsOut]);
    }

    @computed get inboundLCBSelectionFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.SelectedBagsIn]);
    }

    @computed get packageIdFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.PackageId]);
    }

    @computed get boardTypeFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.BoardType]);
    }

    @computed get defaultTransferFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.DefaultTransfer]);
    }

    @computed get selectedTransferFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.Transfer]);
    }

    @computed get firebaseSource(): string {
        return this.parseStringValue(this.query[QueryParamName.FirebaseSource]);
    }

    @computed get otherRoutesFromUrl(): string[] {
        return this.parseArrayValue(this.query[QueryParamName.OtherRoutes]);
    }

    @computed get isExtFromUrl(): boolean {
        return this.query[QueryParamName.IsExt] == 1;
    }

    @computed get isMap(): boolean {
        return this.query[QueryParamName.IsMap] == 1 || !!this.mapPopupState;
    }

    @computed get mapPopupState(): IMapPopupState | null {
        const val = this.query[QueryParamName.IsMap];

        if (!val || val == 1 || val == 0) return null;

        const str = String(val);
        const atIndex = str.indexOf('@');

        if (atIndex === -1) return null;

        const accomId = str.slice(0, atIndex);
        const zoomLevel = Number(str.slice(atIndex + 1));

        if (!accomId || Number.isNaN(zoomLevel)) return null;

        return { accomId, zoomLevel };
    }

    @computed get isLateRoom(): boolean {
        return this.query[QueryParamName.LateRoomCheckout] == 1;
    }

    @computed get isNewFlow(): boolean {
        return this.query[FlightPlusHotelQueryParamName.IsNewFlow] == 1;
    }

    @computed get isFlightPlusHotelFunnel(): boolean {
        return this.query[QueryParamName.ExperienceContextProvider]?.toLowerCase() === FLIGHTS_PLUS_HOTEL_PROVIDER;
    }

    @computed get fphDiscountPriceFromUrl(): number | undefined {
        const dPrice = this.parseStringValue(this.query[FlightPlusHotelQueryParamName.Discount]);
        const parsed = Number(dPrice);

        return dPrice && !Number.isNaN(parsed) ? parsed : undefined;
    }

    @computed get ecp(): string | undefined {
        return this.query[QueryParamName.ExperienceContextProvider] || undefined;
    }

    // Pagination parameters from query
    @computed get pageNumberFromUrl(): number {
        return this.parsePaginationValue(this.query[QueryParamName.Page]) || settings.Default.page;
    }

    // Sort parameters from query

    @computed get orderByFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.OrderBy]);
    }

    @computed get orderDirectionFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.OrderDirection]);
    }

    @computed get redirectUrlFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.RedirectUrl]);
    }

    // Filters parameters from query

    @computed get themesCodesFromUrl(): string[] {
        return this.parseArrayValue(this.query[QueryParamName.ThemesCodes]);
    }

    @computed get facilitiesFromUrl(): string[] {
        return this.parseArrayValue(this.query[QueryParamName.Facilities]);
    }

    @computed get starRatingFromUrl(): string[] {
        return this.parseArrayValue(this.query[QueryParamName.StarRating]);
    }

    @computed get tripAdvisorRatingFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.TripAdvisorRating]);
    }

    @computed get utmParams(): qs.ParsedQs {
        return getUtmParams(this.query);
    }

    @computed get email(): string {
        return this.parseStringValue(this.query[QueryParamName.Email]);
    }

    @computed get source(): string {
        return this.parseStringValue(this.query[QueryParamName.Source]);
    }

    @computed get bookingRefFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.BookingRef]);
    }

    @computed get leadFirstNameFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.LeadFirstName]);
    }

    @computed get leadLastNameFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.LeadLastName]);
    }

    @computed get dateStartFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.DateStart]);
    }

    @computed get dateEndFromUrl(): string {
        return this.parseStringValue(this.query[QueryParamName.DateEnd]);
    }

    @computed get returnPathFromUrl(): string {
        return filterInvalidRelativePath(this.query[QueryParamName.ReturnPath]);
    }

    @computed get returnPathFromHotelDetailsFromUrl(): string {
        return filterInvalidRelativePath(this.query[QueryParamName.ReturnPathFromHotelDetails]);
    }

    /* ----------------------------------------------*/

    // Parsing values

    /**
     * Parse number of guests.
     * Can't be less than 0.
     * Can't be float.
     * Can't be non number.
     * Return 0 if value is invalid.
     *
     * @value
     */
    public parseGuestsInRoomValue = (value: string): number => {
        const intValue = +value;

        return !Number.isInteger(intValue) || intValue < 0 ? 0 : intValue;
    };

    /**
     * Parse page number of items per page number.
     * Can't be negative.
     * Can't be float.
     * Can't be non number.
     * Return 1 if value is invalid.
     *
     * @value
     */
    public parsePaginationValue = (value: string): number => {
        const parsedValue = this.parseIntValueFromString(value);

        if (!parsedValue || parsedValue < 0) {
            return 0;
        }

        return parsedValue;
    };

    public parseStringValue = (value: string): string => {
        if (!value) {
            return '';
        }

        // we expected string but got an array, then we need to return string
        // this can happen because we changed our url parser
        if (Array.isArray(value)) {
            return value.join(',');
        }

        if (typeof value !== 'string') {
            return '';
        }

        return value;
    };

    /**
     * return an array from query values
     * 1) for query like `topics=News`, value will be `News` string, so wee need to return is as an array
     * 2) for query like topics=News,Info value will be `[News, Info]` array
     * 3) sometimes parser makes a mistake and return `News,Info` string instead of array, so we need to return an array for such cases as well
     */
    public parseArrayValue = (value: string | string[]): string[] => {
        if (typeof value === 'string') {
            return value.split(',').filter(val => typeof val === 'string');
        }

        if (!value || !Array.isArray(value)) {
            return [];
        }

        return value.filter(val => typeof val === 'string');
    };

    /**
     * Parse int value using passed string.
     * There is an additional checking for an array as +[ ] === 0.
     * If parsed value is not an integer then return null.
     *
     * @value
     */
    public parseIntValueFromString = (value: string): Nullable<number> => {
        const parsedValue = +value;

        if (Array.isArray(value) || !Number.isInteger(parsedValue)) {
            return null;
        }

        return parsedValue;
    };

    /**
     * Parse rooms parameter
     */
    public parseRooms = (data: string[]): IQueryRoom[] => {
        if (!data || !Array.isArray(data)) {
            return [];
        }

        return data.reduce((rooms: IQueryRoom[], roomStr: string) => {
            // extra check that we got valid data
            if (!roomStr || typeof roomStr !== 'string') {
                return rooms;
            }

            const [guests, roomCode] = roomStr.split(/\/(.*)/s);
            const [adults, childrenData, infants] = guests.split('_');
            const [children, childAgesData] = (childrenData ?? '').split(':');
            const childrenAges = (childAgesData ?? '').split('|');

            const room: IQueryRoom = {
                adults: this.parseGuestsInRoomValue(adults),
                children: this.parseGuestsInRoomValue(children),
                infants: this.parseGuestsInRoomValue(infants),
                childrenAges: [],
                roomCode: this.parseStringValue(roomCode),
            } as IQueryRoom;

            // we can't have rooms without adults
            if (!room.adults) {
                return rooms;
            }

            if (isEncoded(room.roomCode)) {
                room.roomCode = decodeURIComponent(room.roomCode);
            }

            if (childrenAges) {
                room.childrenAges = childrenAges
                    .map(age => parseInt(age))
                    .filter(age => Number.isInteger(age) && age >= 2);
            }

            rooms.push(room);

            return rooms;
        }, []);
    };

    public parseAltAccommodations = (altAccommodationIds: string, altPackageIds: string): IAltAccommodation[] => {
        const accomCodes = this.parseArrayValue(altAccommodationIds).filter(id => !!id);
        const packageIds = this.parseArrayValue(altPackageIds).filter(id => !!id);

        return accomCodes.map((accomCode, index) => ({
            accomCode,
            packageId: packageIds[index],
        }));
    };

    /**
     * Parse luggage parameter
     */
    public parseLuggage = (data: string): IHoldLuggageInfo | undefined => {
        if (!data?.length) {
            return;
        }

        const items = parseAncString(data);
        const result = {};

        items.map(luggage => {
            const [code, quantity] = luggage.split('-');
            result[code] = Number(quantity);
        });

        return result;
    };

    @action public removeUtmParams = (): void => {
        Object.keys(this.query).forEach(key => {
            if (key.startsWith('utm')) {
                delete this.query[key];
            }
        });
    };

    public shouldShowPopunder = (utmParams: qs.ParsedQs): boolean =>
        utmParams[UtmOptions.utm_content] === MixedResultsUtm.utm_content &&
        utmParams[UtmOptions.utm_campaign] === MixedResultsUtm.utm_campaign &&
        utmParams[UtmOptions.utm_term] === MixedResultsUtm.utm_term;

    @computed get helpCategory(): string {
        return this.query[QueryParamName.HelpCategory];
    }

    @computed get helpQuestion(): string {
        return this.query[QueryParamName.HelpQuestion];
    }

    @computed get emptyAncillariesParams(): Record<string, string> {
        const params: Record<string, string> = {};

        if (this.seatSelectionFromUrl) {
            params[QueryParamName.SelectedSeats] = '';
        }

        if (this.luggageSelectionFromUrl) {
            params[QueryParamName.SelectedLuggage] = '';
        }

        if (this.sportEquipmentSelectionFromUrl) {
            params[QueryParamName.SelectedSportEquipment] = '';
        }

        if (this.outboundLCBSelectionFromUrl) {
            params[QueryParamName.SelectedBagsOut] = '';
        }

        if (this.inboundLCBSelectionFromUrl) {
            params[QueryParamName.SelectedBagsIn] = '';
        }

        return params;
    }
}
