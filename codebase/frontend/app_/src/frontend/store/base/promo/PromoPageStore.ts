// using for prevent circular structure error
import { stringify } from 'flatted';
import { action, computed, makeObservable, observable, runInAction, toJS, when } from 'mobx';

import offersService from 'frontend/services/offers.service';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import { removePrefixes } from 'frontend/utils/array.utils';
import { addDays, formatDateL10n, isDateGreater } from 'frontend/utils/date.utils';
import { getIDestinationByCode } from 'frontend/utils/destinations.utils';
import isBackend from 'frontend/utils/isBackend';
import {
    convertSitecoreItemsToIDestinations,
    getHotelsIDestinations,
    getPromoPageDestinationByUrl,
} from 'frontend/utils/promoPage.utils';
import { getPromoPageAvailableDateRange, getPromoPageDates } from 'frontend/utils/promoPageDates';
import {
    getFieldValue,
    getOnlyFieldValuesFromSitecoreItemsArray,
    SitecoreKeyFieldName,
} from 'frontend/utils/sitecore.utils';
import { buildGeogParamByDestinationCodeQuery } from 'frontend/utils/url.utils';
import { parseValueFromLocalStorage } from 'frontend/utils/webStorage.utils';
import { IDestination } from 'models/data/IDestination';
import { IFilterOption } from 'models/data/IFilters';
import { IHotelThemeFields, IHotelThemeTypeFields } from 'models/data/IHotelInfoFields';
import { ISitecoreFacility } from 'models/data/ISitecoreFacility';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { DataStatus } from 'models/enum/DataStatus';
import { DestinationType } from 'models/enum/DestinationType';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { HolidayThemesTypesCodes } from 'models/enum/HolidayThemes';
import { OffersAndPromotionsSettings } from 'models/enum/OffersAndPromotionsSettings';
import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { IPromoCollectionFields } from 'models/IPromoCollectionFields';
import { RoomAllocation } from 'models/RoomAllocation';
import { ISitecoreCompositeField, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface ISearchParamsPayload {
    departures: string[];
    destinations: { code: string; type: string }[];
    duration: number;
    from: Date;
    rooms: IQueryRoom[];
    to: Date;
}

export interface IPromoPageInitialState {
    pageDestination?: Nullable<IDestination>;
}

export interface ISeason {
    Code: ISitecoreField<string>;
    EndDate: ISitecoreField<Date>;
    Name: ISitecoreField<string>;
    StartDate: ISitecoreField<Date>;
}

export const ADVANCE_DAYS = 2;
const DEFAULT_DURATION = 7;

export class PromoPageStore implements ISssrStore<IPromoPageInitialState> {
    @observable pageDestination: Nullable<IDestination>;
    @observable pageDestinationCode: Nullable<string>;
    @observable isLoadingPageDestination: boolean = false;
    @observable wasPromoPageClearedInStorage: boolean = false;
    @observable availableDateStart: Date | null;
    @observable availableDateEnd: Date | null;
    /** selected destination for promo page from layout */
    @observable.ref defaultDestinations: Nullable<IDestination[]>;
    @observable destinationFromUrl: Nullable<string>;
    @observable geographyFromUrl: Nullable<string>;

    @observable pageThemeTypeCodes: HolidayThemesTypesCodes[] = [];

    private facilities: ISitecoreFacility[] = [];

    /** Mapping of board type codes to their parent board group codes from Sitecore */
    @observable boardTypeToParentMap: Record<string, string> = {};

    /** preselected hotel types */
    @observable hotelTypes: string[] = [];

    @observable minPricePP: Nullable<number>;
    @observable maxPricePP: Nullable<number>;
    @observable minTotalPrice: Nullable<number>;
    @observable maxTotalPrice: Nullable<number>;

    /** force prefill promoPage pageNumber (used when we return to promoPage on clicking browser back button)  */
    @observable forcePrefillPage: number;

    @observable public from: Date | null;
    @observable public to: Date | null;
    @observable public duration: number | undefined;
    @observable public departures: string;
    @observable public editorDestinations: { code: string; type: string }[];
    @observable public rooms: IQueryRoom[] = [];

    private _promoCollections: string[] = [];

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    public serialize(): IPromoPageInitialState {
        return {
            pageDestination: toJS(this.pageDestination),
        };
    }

    public deserialize(initialState?: IPromoPageInitialState): void {
        if (initialState) {
            this.pageDestination = initialState.pageDestination;
        }
    }

    @computed get defaultDestinationsCodes(): string[] {
        const selectedCodes: string[] = [];

        (this.defaultDestinations || []).forEach(d => {
            if (d.children) {
                d.children.forEach(ch => selectedCodes.push(ch.code));
            } else {
                selectedCodes.push(d.code);
            }
        });

        return selectedCodes;
    }

    needToRestoreFromLocalStorage = (): boolean =>
        this.rootStore.routerStore.isPopState ||
        this.rootStore.routerStore.state?.BackToPromoFromHotelDetails === 'true';

    clearPromopageStore = (): void => {
        this.duration = undefined;
        this.from = null;
        this.to = null;
        this.departures = '';
        this.rooms = [];
    };

    clearQueryParamsData = (): void => {
        this.duration = undefined;
        this.rooms = [];
        this.departures = '';
    };

    @action setOverrideWhoValue = (): void => {
        const { isDynamicPromoPage } = this.rootStore.layoutStore;

        if (!isDynamicPromoPage) return;

        const { OverridePaxMix, NumberOfAdults, NumberOfChildren, NumberOfInfants, ChildrenAges } =
            this.rootStore.layoutStore.route?.fields || {};

        if (!OverridePaxMix?.value) return;

        const room = [new RoomAllocation()];

        if (NumberOfAdults.value && NumberOfAdults.value > 0) {
            new Array(NumberOfAdults.value).fill(null).forEach(() => room[0].addAdult());
        }

        if (NumberOfChildren.value && NumberOfChildren.value > 0) {
            new Array(NumberOfChildren.value).fill(null).forEach(() => room[0].addChild());

            const childrenAges = ChildrenAges.value?.split(',');

            if (childrenAges && childrenAges.length > 0) {
                room[0].children.forEach((child, index) => {
                    child.age = Number(childrenAges[index]);
                });
            }
        }

        if (NumberOfInfants.value && NumberOfInfants.value > 0) {
            new Array(NumberOfInfants.value).fill(null).forEach(() => room[0].addInfant());
        }

        this.rootStore.searchStore.searchWho.setRoomsAllocation(room);
    };

    @computed get editorDestinationsQuery(): string[] | null {
        if (!this.editorDestinations?.length || !this.rootStore.layoutStore.isDynamicPromoPage) return null;

        return this.editorDestinations.map(({ type, code }) => `${type?.toLowerCase()}:${code}`);
    }

    @computed get editorGeographyQuery(): string {
        if (!this.editorDestinations) return '';

        const COUNTRY_LENGTH = 2;
        const REGION_LENGTH = 4;

        const countries: Set<string> = new Set();
        const regions: Set<string> = new Set();
        const resorts: Set<string> = new Set();

        this.editorDestinations.forEach(({ type, code }) => {
            switch (type) {
                case DestinationType.Country:
                    countries.add(code);
                    break;
                case DestinationType.Region:
                    countries.add(code.slice(0, COUNTRY_LENGTH));
                    regions.add(code);
                    break;
                case DestinationType.Resort:
                    countries.add(code.slice(0, COUNTRY_LENGTH));
                    regions.add(code.slice(0, REGION_LENGTH));
                    resorts.add(code);
                    break;
            }
        });

        return [Array.from(countries).join('|'), Array.from(regions).join('|'), Array.from(resorts).join('|')]
            .filter(Boolean)
            .join(',');
    }

    constructSearchPayload = (): ISearchParamsPayload => {
        const {
            OverridePaxMix,
            OverrideDestinations,
            OverrideDefaultDuration,
            NumberOfAdults,
            NumberOfChildren,
            NumberOfInfants,
            Destinations,
            DefaultDuration,
            InitialSearchDays,
            ChildrenAges,
        } = this.rootStore.layoutStore.route?.fields || {};

        const payload: ISearchParamsPayload = {
            duration: 0,
            destinations: [],
            departures: [],
            rooms: [],
            from: addDays(ADVANCE_DAYS, new Date()),
            to: addDays(ADVANCE_DAYS + InitialSearchDays?.value, new Date()),
        };

        if (OverridePaxMix?.value) {
            const childrenAges =
                typeof ChildrenAges?.value === 'string' ? ChildrenAges?.value?.split(',').map(Number) : [];

            payload.rooms.push({
                adults: NumberOfAdults.value,
                children: NumberOfChildren.value,
                infants: NumberOfInfants.value,
                roomCode: '',
                childrenAges,
            });
        }

        if (OverrideDestinations?.value && Destinations?.length) {
            payload.destinations = Destinations.map(({ fields }) => ({
                type: fields.PageCategory?.value,
                code: fields.Code?.value,
            }));
        }

        if (OverrideDefaultDuration?.value) {
            payload.duration = DefaultDuration.value;
        }

        return payload;
    };

    setPromoCollections = (promoCollections: string[]): void => {
        this._promoCollections = promoCollections;
    };

    /** preselected promo collections */
    get promoCollections(): string[] {
        return this._promoCollections;
    }

    getSeasonFields = (): ISeason | undefined => {
        const { layoutStore, queryParamsStore } = this.rootStore;
        const { seasonFromUrl } = queryParamsStore;
        const sitecoreFields = layoutStore.layout?.sitecore?.route?.fields;

        const { OverrideSeasons, DefaultSeason, Seasons } = sitecoreFields || {};

        let seasonCode;

        if (seasonFromUrl) {
            seasonCode = seasonFromUrl;
        }

        if (OverrideSeasons?.value) {
            seasonCode = DefaultSeason.fields?.Code?.value;
        }

        return Seasons?.find(season => season.fields?.Code?.value === seasonCode)?.fields;
    };

    getSeasonDates = (payloadFrom: Date): Date[] => {
        const season = this.getSeasonFields();

        if (season && isDateGreater(season.EndDate.value, payloadFrom)) {
            const { EndDate, StartDate } = season;
            const from = isDateGreater(StartDate.value, payloadFrom) ? StartDate.value : payloadFrom;
            const to = EndDate.value;

            return [from, to];
        }

        return [];
    };

    getSeasonName = (): string | null => {
        const season = this.getSeasonFields();

        if (!season) {
            return null;
        }

        return season.Name.value;
    };

    getToSearchParam = (to: Date, seasonTo: Date, seasonFrom: Date): Date => {
        const { layoutStore } = this.rootStore;
        const sitecoreFields = layoutStore.layout?.sitecore?.route?.fields;

        const { InitialSearchDays } = sitecoreFields || {};

        if (isDateGreater(addDays(InitialSearchDays?.value, seasonFrom), to)) {
            return addDays(InitialSearchDays?.value, seasonFrom);
        }

        return isDateGreater(to, seasonTo) ? seasonTo : to;
    };

    updateSearchParamsAndExecuteSearch = async (applyFilters = true): Promise<void> => {
        const { queryParamsStore, bookingStore, hotelsStore } = this.rootStore;
        const { duration, from, to, departures, rooms, destinations } = this.constructSearchPayload();
        const [seasonFrom, seasonTo] = this.getSeasonDates(from);

        this.editorDestinations = destinations;
        this.duration = duration || queryParamsStore.durationFromUrl || DEFAULT_DURATION;
        this.from = seasonFrom || from;
        this.to = this.getToSearchParam(to, seasonTo, seasonFrom);
        this.departures = departures?.length ? departures.join(',') : bookingStore.origins.join(',');
        this.rooms = rooms?.length ? rooms : bookingStore.createRoomAllocation();

        applyFilters && (await this.setFilters());

        await hotelsStore.fetchOffers(true);

        this.clearQueryParamsData();
    };

    saveSearchParamsAndFilterToLocalStorage = (layoutId: string) => {
        const searchStore = this.rootStore.searchStore.serialize();
        const filtersStore = this.rootStore.searchFiltersStore.serialize();

        // synchronize search store params with last executed search params
        const lastActualSearchParams = this.rootStore.bookingStore.lastActualSearchParams;

        searchStore.searchWhen.from = formatDateL10n(lastActualSearchParams.from);
        searchStore.searchWhen.to = formatDateL10n(lastActualSearchParams.to);
        searchStore.searchWho.roomsAllocation = lastActualSearchParams.roomsAllocation;

        localStorage.setItem(
            WebStorageKeys.Promopage,
            stringify({
                layoutId,
                searchStore,
                filtersStore,
                pageDestinationCode: this.pageDestinationCode,
                defaultDestinations: !!this.defaultDestinations ? toJS(this.defaultDestinations) : null,
                destinationFromUrl: this.rootStore.queryParamsStore.destinationFromUrl,
                pageThemeTypeCodes: this.pageThemeTypeCodes,
                hotelTypes: this.hotelTypes,
                promoCollections: this.promoCollections,
            }),
        );
    };

    restoreSearchParamsAndFilterFromLocalStorage = (currentLayoutId: string) => {
        const localStorageValue = localStorage.getItem(WebStorageKeys.Promopage);

        /**
         * Nothing to restore
         */
        if (!localStorageValue) {
            return false;
        }

        const {
            layoutId,
            searchStore,
            filtersStore,
            pageDestinationCode,
            defaultDestinations,
            destinationFromUrl,
            pageThemeTypeCodes,
            hotelTypes,
            promoCollections,
        } = parseValueFromLocalStorage(localStorageValue);
        const currentDestFromUrl = this.rootStore.queryParamsStore.destinationFromUrl;

        /**
         * Don't restore if local storage data is for different promo page.
         * (Extra Check destination for dynamic promo pages, because they have one layout for different destinations)
         */
        if (
            layoutId !== currentLayoutId ||
            (pageDestinationCode && this.pageDestinationCode && pageDestinationCode !== this.pageDestinationCode) ||
            defaultDestinations === undefined || // ensure that pages with previously saved values does not break
            ((destinationFromUrl || currentDestFromUrl) && destinationFromUrl !== currentDestFromUrl) // don't restore if page should be pre-filled by different destination
        ) {
            return false;
        }

        runInAction(() => {
            this.defaultDestinations = [...(defaultDestinations || [])];
            this.pageThemeTypeCodes = pageThemeTypeCodes;
            this.hotelTypes = hotelTypes;
            this.setPromoCollections(promoCollections);

            if (searchStore) {
                this.rootStore.searchStore.deserialize(searchStore);
            }

            if (filtersStore) {
                this.rootStore.searchFiltersStore.deserialize(filtersStore);
            }
        });

        return true;
    };

    clearPromoPageFromLocalStorage = () => {
        localStorage.removeItem(WebStorageKeys.Promopage);
        this.setPromoPageClearedInStorage(true);
    };

    @action clearPromo = () => {
        this.availableDateStart = null;
        this.availableDateEnd = null;
        this.pageThemeTypeCodes = [];
        this.hotelTypes = [];
        this.setPromoCollections([]);
        this.resetDestinationsFromUrl();
        this.rootStore.searchStore.clearSearchValues();
        this.rootStore.searchFiltersStore.onClearAllFilters();
    };

    @action clearPageDestination = () => {
        this.pageDestination = null;
        this.pageDestinationCode = null;
    };

    @action prefillSearchParameters = () => {
        this.setDates();
        this.setRoomsAllocation();
    };

    @action prefillPromoPageFilters = async () => {
        await this.setFilters();
    };

    @action restoreFromLocalStorage = async (): Promise<void> => {
        const needToRestore = this.needToRestoreFromLocalStorage();

        if (needToRestore) {
            this.restoreSearchParamsAndFilterFromLocalStorage(this.rootStore.layoutStore.layoutId);
        }
    };

    @action prefillPromoPage = async () => {
        this.rootStore.hotelsStore.updateOffersDataStatus(DataStatus.Loading);

        this.clearPromo();
        await this.loadDynamicPromoPageDestination();

        const needToRestore = this.needToRestoreFromLocalStorage();
        let isRestored = false;

        if (needToRestore) {
            try {
                isRestored = this.restoreSearchParamsAndFilterFromLocalStorage(this.rootStore.layoutStore.layoutId);
            } catch (e) {
                // clear promo in case exception was thrown amid restoring
                this.clearPromo();
            }
        } else {
            this.clearPromoPageFromLocalStorage();
        }

        if (!isRestored) {
            // search parameters
            this.setOrigins();
            this.setRoomsAllocation();

            // combine destination and filters as these ones require api requests
            // additional false arg for prevent useless request to available dates API
            await Promise.all([this.setDestinations(false), this.prefillPromoPageFilters()]);
        }

        // Set promo page dates range and call dates availability
        this.setDates();
        this.setDestinationsFromUrl(
            this.rootStore.queryParamsStore.destinationFromUrl,
            this.rootStore.queryParamsStore.selectedDestinationCodesQueryFromUrl,
        );
        this.setSortOrder();

        /** prefill promoPage number (from history) when we navigate back to promoPage  */
        if (this.forcePrefillPage && this.forcePrefillPage > 1) {
            this.rootStore.searchStore.page = this.forcePrefillPage;
            this.setForcePrefillPage(1);
        }

        // update search values on Booking Store, because they are used on fetching offers
        this.rootStore.bookingStore.grabSearchValuesFromSearchStore();

        if (!this.rootStore.layoutStore.isPreviewMode) {
            this.rootStore.routerStore.clearPromoQuery();
        }

        await this.rootStore.hotelsStore.fetchOffers(true);
    };

    @action setForcePrefillPage = (page: number) => {
        this.forcePrefillPage = page;
    };

    //Potentially can be removed since we don’t use this[specialFilter] anywhere in the project
    @action setBackgroundFilters = (kidsGoFree?: boolean, superDeals?: boolean) => {
        this.rootStore.searchStore.setSpecialFilters(OffersAndPromotionsSettings.KidsGoFree, !!kidsGoFree);
        this.rootStore.searchStore.setSpecialFilters(OffersAndPromotionsSettings.ShowSuperDeals, !!superDeals);
    };

    /**
     *  Set destination for Dynamic Promo Page that defined by url or by saved code.
     *  This destination is used for search and page title (metaPageTitle and title of DynamicPromoTextBlock)
     */
    @action private loadDynamicPromoPageDestination = async () => {
        if (this.isLoadingPageDestination) {
            await when(() => this.isLoadingPageDestination === false);

            return;
        }

        if (!this.rootStore.layoutStore.isDynamicPromoPage || this.pageDestination) {
            return;
        }

        this.isLoadingPageDestination = true;
        await this.rootStore.searchStore.searchTo.loadAllDestinations();
        let destination;

        if (this.pageDestinationCode) {
            // Find destination by saved code when moving from Holiday Tile in Destination Page to Dynamic Promo Page.
            destination = getIDestinationByCode(
                this.rootStore.searchStore.searchTo.destinationsWithNames,
                this.pageDestinationCode,
            );
        } else {
            destination = getPromoPageDestinationByUrl(
                this.rootStore.layoutStore.currentPath,
                this.rootStore.searchStore.searchTo.destinationsWithNames,
            );
        }

        runInAction(() => {
            this.isLoadingPageDestination = false;
            this.pageDestination = destination;
            this.pageDestinationCode = destination?.code || null;
        });
    };

    @action private setOrigins = () => {
        const origins: ISitecoreCompositeField<any>[] = this.rootStore.layoutStore.layout.sitecore.route.fields.Origin;
        this.rootStore.searchStore.searchFrom.setOrigins(
            (origins || []).map(o => o.fields.Code.value),
            false,
        );
    };

    @action private setDestinations = async (updateDates = true) => {
        if (this.rootStore.layoutStore.isDynamicPromoPage) {
            if (!!this.pageDestination) {
                this.defaultDestinations = [this.pageDestination];
            } else {
                this.defaultDestinations = undefined;
            }

            this.pageDestination && this.rootStore.searchStore.searchTo.selectSingleDestination(this.pageDestination);

            return;
        }

        // Set destinations for other Promo Pages, this destinations are configurable in sitecore
        const destinations: ISitecoreCompositeField<any>[] =
            this.rootStore.layoutStore.layout.sitecore.route.fields.Destination;

        if (destinations) {
            // Load all countries with regions in searchStore
            await this.rootStore.searchStore.searchTo.loadAllDestinations();

            // Get all hotels from sitecore destinations and save them to searchStore
            const hotels = getHotelsIDestinations(destinations);
            this.rootStore.searchStore.searchTo.collectLoadedDestinationsTitles(hotels, false);

            await when(() => !!this.rootStore.searchStore.searchTo.destinationsWithNames.length);

            // Set selectedDestination in searchStore
            const selectedDestinations = convertSitecoreItemsToIDestinations(
                destinations,
                this.rootStore.searchStore.searchTo.destinationsWithNames,
            );

            const hotelsDestinations = selectedDestinations.filter(d => d.type === DestinationType.Hotel);

            // if there are hotels selected, then get their parents and add to defaultDestinations
            if (hotelsDestinations.length > 0) {
                const codes = hotelsDestinations.map(d => d.code);

                try {
                    const destinations = await offersService.fetchDestinationsByCodes(codes, true);

                    destinations.forEach(d => {
                        const additionalDestinations = (d.parents || []).filter(
                            // resorts need to be added for correct work of Virtual Countries
                            p => p.type === DestinationType.Region || p.type === DestinationType.Resort,
                        );

                        if (additionalDestinations.length) {
                            selectedDestinations.push(...additionalDestinations);
                        }
                    });
                } catch (e) {}
            }

            this.defaultDestinations = selectedDestinations;

            this.rootStore.searchStore.searchTo.changeDestinations(selectedDestinations, updateDates);
        } else {
            this.defaultDestinations = undefined;
        }
    };

    @action setDestinationsFromUrl = (dest: string, geog: string) => {
        this.destinationFromUrl = dest;
        this.geographyFromUrl = geog ? geog : buildGeogParamByDestinationCodeQuery(dest);
    };

    @action resetDestinationsFromUrl = () => {
        this.destinationFromUrl = null;
        this.geographyFromUrl = null;
    };

    @action setDates = () => {
        const dates = getPromoPageDates(this.rootStore.layoutStore.layout);

        if (dates) {
            let { endDate } = dates;

            if (this.isOneMonthPromoPage) {
                const newEndDate = new Date(dates.startDate);
                newEndDate.setMonth(dates.startDate.getMonth() + 2);
                newEndDate.setDate(0);

                endDate = newEndDate;
            }

            const { from, to } = getPromoPageAvailableDateRange(new Date(dates.startDate), new Date(endDate));
            this.availableDateStart = from;
            this.availableDateEnd = to;

            // Change availability interval and request available dates
            this.rootStore.searchStore.searchWhen.changeDateAvailabilityInterval(
                this.availableDateStart,
                this.availableDateEnd,
            );
        }
    };

    @action private setRoomsAllocation = () => {
        const { fields } = this.rootStore.layoutStore.layout.sitecore.route;
        const isTradePortal = this.rootStore.layoutStore.isTradePortal;

        const roomsAllocation = [new RoomAllocation()];
        const adults = Number(fields.NumberOfAdults?.value ?? 0);
        const children = Number(fields.NumberOfChildren?.value ?? 0);
        const infants = Number(fields.NumberOfInfants?.value ?? 0);
        const childrenAgesFromSitecore = fields.ChildrenAges?.value ? fields.ChildrenAges.value.split(',') : [];
        let childrenAges: number[] = [];

        if (childrenAgesFromSitecore.length > 0) {
            childrenAges = childrenAgesFromSitecore.map(age => +age).filter(Boolean);
        }

        this.rootStore.searchStore.searchWho.onChangeRooms(-1);

        if (adults && adults > 0) {
            new Array(adults).fill(null).forEach(() => roomsAllocation[0].addAdult(isTradePortal));
        }

        if (children && children > 0) {
            new Array(children).fill(null).forEach(() => roomsAllocation[0].addChild());

            if (childrenAges && childrenAges.length > 0) {
                roomsAllocation[0].children.forEach((child, index) => {
                    child.age = childrenAges[index] || 2;
                });
            }
        }

        if (infants && infants > 0) {
            new Array(infants).fill(null).forEach(() => roomsAllocation[0].addInfant());
        }

        this.rootStore.searchStore.searchWho.setRoomsAllocation(roomsAllocation);
    };

    @action private setFilters = async () => {
        const { fields } = this.rootStore.layoutStore.layout.sitecore.route;
        const { OverrideHotelTypes, StarRating, TripAdvisorRating } = fields;
        const isDynamicPromoPage = this.rootStore.layoutStore.isDynamicPromoPage;

        this.setBoardTypesFilters();
        await this.setFacilitiesTypesFilters();

        const starRatings = StarRating?.value ? StarRating.value.split(',') : [];
        this.setRatingFilters(starRatings, FilterGroupCodes.StarRating);

        const tripAdvisorRatings = TripAdvisorRating?.value ? [TripAdvisorRating.value] : [];
        this.setRatingFilters(tripAdvisorRatings, FilterGroupCodes.TripAdvisorRating);

        this.setPriceFilters();

        this.setPackageThemes();

        if (!isDynamicPromoPage || OverrideHotelTypes?.value) this.setPackageFacilityMatrix();

        this.initializePromoCollectionsOrFilters();
    };

    @action private setBoardTypesFilters = () => {
        const boardTypes: ISitecoreCompositeField<any>[] =
            this.rootStore.layoutStore.layout.sitecore.route.fields.BoardTypes;

        this.boardTypeToParentMap = {};
        boardTypes?.forEach(boardType => {
            const code = boardType.fields.Code.value;
            const parentCode = boardType.fields.BoardGroup?.fields?.Code?.value;

            this.boardTypeToParentMap[code] = parentCode || code;
        });

        this.rootStore.searchFiltersStore.selectedFilters = this.rootStore.searchFiltersStore.selectedFilters.filter(
            f => f.groupCode !== FilterGroupCodes.BoardType,
        );

        if (boardTypes && boardTypes.length > 0) {
            boardTypes.forEach(boardType => {
                const boardTypeFilterValue = {
                    code: boardType.fields.Code.value,
                    count: 0,
                    name: boardType.fields.Name.value,
                    groupCode: FilterGroupCodes.BoardType,
                };

                this.rootStore.searchFiltersStore.onSelectFilters(boardTypeFilterValue);
            });
        }
    };

    @action private setFacilitiesTypesFilters = async () => {
        const facilityTypes: any[] = this.rootStore.layoutStore.layout.sitecore.route.fields.FacilityTypes;

        if (facilityTypes && facilityTypes.length > 0) {
            const facilities = await this.loadFacilities();

            if (facilities && facilities.length > 0) {
                const composedFacilities: IFilterOption[] = [];

                facilityTypes.forEach(facilityType => {
                    const facility = facilities.find(f => f.itemID === facilityType.id);

                    if (facility) {
                        composedFacilities.push({
                            code: `${facility.groupCode}-${facility.code}`,
                            count: 0,
                            name: `${facility.name}`,
                            groupCode: FilterGroupCodes.Facilities,
                        });
                    }
                });

                if (composedFacilities) {
                    composedFacilities.forEach(facility => this.rootStore.searchFiltersStore.onSelectFilters(facility));
                }
            }
        }
    };

    /**
     * Parse prices configured on sitecore.
     * The prices will be send directly in offers request. (Don't need to set price filter in searchFiltersStore!)
     */
    @action private setPriceFilters = () => {
        const { MinPricePP, MaxPricePP, MinTotalPrice, MaxTotalPrice } =
            this.rootStore.layoutStore.layout.sitecore.route.fields;
        this.minPricePP = parseInt(MinPricePP?.value, 10) || null;
        this.maxPricePP = parseInt(MaxPricePP?.value, 10) || null;
        this.minTotalPrice = parseInt(MinTotalPrice?.value, 10) || null;
        this.maxTotalPrice = parseInt(MaxTotalPrice?.value, 10) || null;
    };

    /**
     * Set pre-selected or pre-filtered Promo Collections for the promo page.
     * PromoCollections - list of promo collections to filter promo page by.
     * ShowSelectedPromoCollectionsInFilters - if selected, option will be visible in filters and user can de-select it.
     */
    @action private readonly initializePromoCollectionsOrFilters = (): void => {
        const {
            PromoCollections,
            ShowSelectedPromoCollectionsInFilters,
        }: {
            PromoCollections: Nullable<ISitecoreCompositeField<IPromoCollectionFields>[]>;
            ShowSelectedPromoCollectionsInFilters: Nullable<ISitecoreField<boolean>>;
        } = this.rootStore.layoutStore.layout.sitecore.route.fields;

        if (!PromoCollections?.length) {
            return;
        }

        if (ShowSelectedPromoCollectionsInFilters?.value) {
            PromoCollections.forEach(collection => this.setPromoCollectionFilters(collection));
        } else {
            this.setPromoCollections(
                getOnlyFieldValuesFromSitecoreItemsArray(PromoCollections, SitecoreKeyFieldName.Key),
            );
        }
    };

    /**
     * Set Promo Collection filters.
     * @param collection promo collection to set filters for.
     */
    private readonly setPromoCollectionFilters = (
        collection: ISitecoreCompositeField<IPromoCollectionFields>,
    ): void => {
        const { Key, Title } = collection.fields;

        if (!Key?.value) {
            return;
        }

        const promoCollectionFilter: IFilterOption = {
            code: Key.value,
            count: 0,
            name: Title?.value,
            groupCode: FilterGroupCodes.PromoCollection,
        };

        this.rootStore.searchFiltersStore.onSelectFilters(promoCollectionFilter);
    };

    /**
     * Set Hotel Types per facility matrix. There are 2 fields:
     * FacilityMatrix - list of facility matrix to filter promo page by.
     * ShowSelectedFacilityMatrixInFilters - if selected, option will be visible in filters and user can de-select it.
     */
    @action private readonly setPackageFacilityMatrix = (): void => {
        const {
            FacilityMatrix,
            ShowSelectedFacilityMatrixInFilters,
        }: {
            FacilityMatrix: Nullable<ISitecoreCompositeField<IHotelThemeFields | IHotelThemeTypeFields>[]>;
            ShowSelectedFacilityMatrixInFilters: Nullable<ISitecoreField<boolean>>;
        } = this.rootStore.layoutStore.layout.sitecore.route.fields || {};

        if (!FacilityMatrix?.length) {
            return;
        }

        if (ShowSelectedFacilityMatrixInFilters?.value) {
            FacilityMatrix.forEach(type => this.setPackageHotelTypeFilters(type));
        } else {
            this.hotelTypes = getOnlyFieldValuesFromSitecoreItemsArray(FacilityMatrix, SitecoreKeyFieldName.Code);
        }
    };

    /**
     * Set Package Themes/Types. There are 4 types of fields:
     * HolidayThemes - list of selected themes to filter promo page by.
     * HolidayTypes - list of selected theme-types to filter promo page by.
     * ShowSelectedHolidayThemesInFilters - if selected, themes will be visible in filters and user can de-select it.
     * ShowSelectedHolidayTypesInFilters - if selected, types will be visible in filters and user can de-select it.
     */
    @action private readonly setPackageThemes = (): void => {
        const {
            HolidayThemes,
            HolidayTypes,
            OverrideHolidayTheme,
            OverrideHolidayType,
            ShowSelectedHolidayThemesInFilters,
            ShowSelectedHolidayTypesInFilters,
        }: {
            HolidayThemes: Nullable<ISitecoreCompositeField<IHotelThemeFields>[]>;
            HolidayTypes: Nullable<ISitecoreCompositeField<IHotelThemeTypeFields>[]>;
            OverrideHolidayTheme: Nullable<ISitecoreField<boolean>>;
            OverrideHolidayType: Nullable<ISitecoreField<boolean>>;
            ShowSelectedHolidayThemesInFilters: Nullable<ISitecoreField<boolean>>;
            ShowSelectedHolidayTypesInFilters: Nullable<ISitecoreField<boolean>>;
        } = this.rootStore.layoutStore.layout.sitecore.route.fields || {};

        const isDynamicPromoPage = this.rootStore.layoutStore.isDynamicPromoPage;

        // Save page theme/types codes. They will send directly in offers request.
        // Don't save them in selected filters, because we don't need show any pills/selected checkboxes on UI.
        let preSelectedThemes: ISitecoreCompositeField<IHotelThemeFields | IHotelThemeTypeFields>[] = [];

        // select which themes/types need to be displayed in filters and which always preselected
        const selectThemeItems = (
            items: Nullable<ISitecoreCompositeField<IHotelThemeFields | IHotelThemeTypeFields>[]>,
            showInFilters: Nullable<ISitecoreField<boolean>>,
        ): void => {
            const showInFiltersValue = showInFilters?.value;

            if (showInFiltersValue) {
                // Set preSelected themes/types as selected search filters
                (items || []).forEach(theme => this.setPackageThemeFilters(theme));
            } else {
                preSelectedThemes = [...preSelectedThemes, ...(items || [])];
            }
        };

        if (!isDynamicPromoPage || OverrideHolidayTheme?.value)
            selectThemeItems(HolidayThemes, ShowSelectedHolidayThemesInFilters);

        if (!isDynamicPromoPage || OverrideHolidayType?.value)
            selectThemeItems(HolidayTypes, ShowSelectedHolidayTypesInFilters);

        if (preSelectedThemes?.length > 0) {
            // Remove theme if there is configured child type (e.g. configured theme 'B' (Beach) and type 'BL' (Beach Luxury), save only 'BL')
            // Because if we send theme and type to api, api returns results for the whole theme (need only type)
            const allPageThemesTypesCodes = getOnlyFieldValuesFromSitecoreItemsArray(
                preSelectedThemes,
                SitecoreKeyFieldName.Code,
            );
            this.pageThemeTypeCodes = removePrefixes(allPageThemesTypesCodes) as HolidayThemesTypesCodes[];
        }
    };

    @action private setPackageThemeFilters(
        theme: ISitecoreCompositeField<IHotelThemeFields | IHotelThemeTypeFields>,
    ): void {
        const code = theme?.fields?.Code?.value;

        // Preselect only themes/types that enabled on current promo page
        if (code && this.isPackageThemeEnabledOnPromoPage(code)) {
            const themeFilter = {
                code,
                count: 0,
                name: theme.fields.Name.value,
                groupCode: FilterGroupCodes.PackageTheme,
            };

            this.rootStore.searchFiltersStore.onSelectFilters(themeFilter);
        }
    }

    private setPackageHotelTypeFilters(type: ISitecoreCompositeField<IHotelThemeFields | IHotelThemeTypeFields>): void {
        const code = type?.fields?.Code?.value;
        const isExclusive = type?.fields?.IsExclusive?.value ?? false;

        if (code) {
            const hotelTypeFilter: IFilterOption = {
                code,
                count: 0,
                name: type.fields.Name.value,
                groupCode: FilterGroupCodes.HotelTypes,
                isExclusive,
            };

            this.rootStore.searchFiltersStore.onSelectFilters(hotelTypeFilter);
        }
    }

    /**
     * Check if theme/type is enabled. Its code should be in configured theme/type codes list.
     * @param code - theme/type code
     */
    isPackageThemeEnabledOnPromoPage = (code: string) => {
        // If the promo page hasn't configured themes/types, all themes/types are enabled.
        if (!this.pageThemeTypeCodes?.length) {
            return true;
        }

        const isTheme = code.length === 1;
        const themeCode = code[0];

        // Check if the code or parent theme code or child type code are saved
        return this.pageThemeTypeCodes.some(c => c === code || (isTheme ? c[0] === code : c === themeCode));
    };

    @action private setRatingFilters(ratings: string[], groupCode: FilterGroupCodes) {
        const ratingsNumbers = ratings.map(rating => Number(rating)).filter(rating => rating >= 2 && rating <= 5);

        if (ratingsNumbers.length > 0) {
            ratingsNumbers.forEach(ratingNumber => {
                const filter = {
                    code: String(ratingNumber),
                    count: 0,
                    name: this.rootStore.searchFiltersStore.getRatingFilterName(ratingNumber, groupCode),
                    groupCode,
                };

                this.rootStore.searchFiltersStore.onSelectFilters(filter);
            });
        }
    }

    @action private loadFacilities = async () => {
        if (this.facilities.length === 0) {
            try {
                this.facilities = await offersService.getFacilities();
            } catch (e) {
                this.facilities = [];
            }
        }

        return this.facilities;
    };

    @action private setSortOrder = () => {
        const { orderByFromUrl, orderDirectionFromUrl } = this.rootStore.queryParamsStore;

        if (orderByFromUrl && orderDirectionFromUrl) {
            this.rootStore.searchStore.updateOrder(orderByFromUrl as OrderBy, orderDirectionFromUrl as OrderDirection);
        }
    };

    /**Default pax defined in Sitecore for each promo page */
    isInitialPaxIsDefault = (): boolean => {
        const { fields } = this.rootStore.layoutStore.layout.sitecore.route;

        const adultsFromSitecore = Number(getFieldValue(fields.NumberOfAdults)) || 0;
        const childrenFromSitecore = Number(getFieldValue(fields.NumberOfChildren)) || 0;
        const infantsFromSitecore = Number(getFieldValue(fields.NumberOfInfants)) || 0;

        const { adultsQuantity, childrenQuantity, infantsQuantity } = this.rootStore.searchStore.searchWho;

        return (
            adultsFromSitecore === adultsQuantity &&
            childrenFromSitecore === childrenQuantity &&
            infantsFromSitecore === infantsQuantity
        );
    };

    pageFromStorage = (): number => {
        if (isBackend()) {
            return 1;
        }

        const localStorageValue = localStorage.getItem(WebStorageKeys.Promopage);

        if (!localStorageValue) {
            return 1;
        }

        const {
            searchStore: { page },
        } = parseValueFromLocalStorage(localStorageValue);

        return page;
    };

    isPromoPageStorage = () => !!localStorage && !!localStorage.getItem(WebStorageKeys.Promopage);

    @action setPromoPageClearedInStorage = (state: boolean) => {
        this.wasPromoPageClearedInStorage = state;
    };

    @computed get isOneMonthPromoPage() {
        return !!this.rootStore.layoutStore.pageFields?.IsMonthOnlyPage?.value && !!this.earliestDateField;
    }

    @computed get earliestDateField() {
        const earliestDate = this.rootStore.layoutStore.pageFields?.EarliestDate?.value;

        return earliestDate ? new Date(earliestDate) : null;
    }
}

export default PromoPageStore;
