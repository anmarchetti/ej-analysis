import Axios, { CancelTokenSource } from 'axios';
import { action, computed, makeObservable, observable, runInAction, toJS, when } from 'mobx';

import offersService from 'frontend/services/offers.service';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import { onlyUnique } from 'frontend/utils/array.utils';
import {
    createParentDstDisplayValueByCodes,
    getCombinedDestinationCodes,
    getDestinationOrChildrenByCode,
    getIDestinationByCode,
    manageDestinationCodes,
} from 'frontend/utils/destinations.utils';
import { getParentDestination } from 'frontend/utils/offer.utils';
import { sortDestinationsByRelevance } from 'frontend/utils/search/search.sort.utils';
import {
    getFirstAndLastTitles,
    getParentVirtualCountry,
    isSingleHotelSearch,
    SINGLE_SELECTABLE_DESTINATION_TYPES,
} from 'frontend/utils/search/search.utils';
import { hasEnoughSymbolsToSearch } from 'frontend/utils/search/searchPod.utils';
import { IDestination } from 'models/data/IDestination';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import { IDisplayValue } from 'models/data/IDisplayValue';
import { IPrefilledSearchParams } from 'models/data/IPrefilledSearchParams';
import { ITypeAheadResponse } from 'models/data/ITypeAheadResponse';
import { DestinationType } from 'models/enum/DestinationType';
import { GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';

const MAX_HOTEL_CODES_LENGTH = 3;

export interface ISearchToInitialState {
    selectedAccommodationCodes?: string;
    selectedDestinationCodes?: string[];
    selectedDestinationCodesQuery?: string;
    selectedDestinations?: IDestination[];
    selectedParentDestinationCodesQuery?: string;
}

export interface ISearchToStore extends ISearchToInitialState {
    addDestination: (destination: IDestination, noUpdate?: boolean, isAddHotelWithGiataCode?: boolean) => void;
    availableDestinations: Set<string>;
    availableDestinationsCodes: string[] | null;
    changeDestinations: (destinations: IDestination[], updateDates?: boolean, updateOrigins?: boolean) => Promise<void>;
    clearDestinations: (options?: { noUpdate?: boolean }) => void;
    collectLoadedDestinationsTitles: (destinations: IDestinationCountry[], updateDisplayValue?: boolean) => void;
    countries: Map<string, IDestinationCountry>;
    countriesWithRegions: IDestinationCountry[];
    createDstDisplayValueByCodes: (
        codes: string[],
        placesWithNames: IDestinationCountry[],
        availableDestinationsCodes: string[] | null,
        isParent?: boolean,
        maxMainAmount?: number,
    ) => IDisplayValue;
    deserialize: (initialState?: ISearchToInitialState) => void;
    destinationsDisplayValue: IDisplayValue;
    destinationsParentDisplayValue: IDisplayValue;
    destinationsWithNames: IDestinationCountry[];
    displayValue: IDisplayValue;
    fullDisplayValue: string;
    getTypeAheadDestinations: (value: string, token?: CancelTokenSource) => Promise<ITypeAheadResponse>;
    isAnywhereSelected: boolean;
    isCheckedItem: (item: IDestination | IDestinationCountry, parent?: IDestinationCountry) => boolean;
    isDestinationAvailable: (code: string) => boolean;
    isDestinationsLoaded: boolean;
    isDestinationsSearchLoading: boolean;
    isDisabledItem: (item: IDestination | IDestinationCountry) => boolean;
    isLoadingDestinations: boolean;
    loadAllDestinations: (isSelectedParent?: boolean) => Promise<void>;
    prefillDestinations: (prefilledParams: IPrefilledSearchParams) => Promise<void>;
    removeDestination: (destination: IDestination, noUpdate?: boolean) => void;
    searchTypeAheadDestinations: (value: string) => Promise<void>;
    selectSingleDestination: (
        destination: IDestination,
        updateDates?: boolean,
        updateOrigins?: boolean,
    ) => Promise<void>;
    selectedAccommodationCodes: string;
    selectedData: Set<string>;
    selectedDestinationCodes: string[];
    selectedDestinationCodesQuery: string;
    selectedDestinations: IDestination[];
    selectedFullyAvailableDestinations: IDestination[];
    selectedParentDestination: (destinations: IDestinationCountry[]) => void;
    serialize: () => ISearchToInitialState;
    setAvailableDestinationCodes: (codes: string[] | null) => void;
    setCountriesWithRegions: (countries: IDestinationCountry[]) => void;
    setSelectedAccommodationCodes: (value: string) => void;
    setSelectedDestinationCodes: (codes: string[]) => void;
    setSelectedDestinationCodesQuery: (query: string) => void;
    setSelectedDestinations: (destinations: IDestination[]) => void;
    setSelectedParentDestinationCodesQuery: (query: string) => void;
    syncDestinationItems: () => Promise<void>;
    typeAheadDestinations: ITypeAheadResponse | null;
    updateAvailableDstCodes: (onlyIfEmpty?: boolean) => Promise<void>;
    updateDestinationCodes: (updateDates?: boolean, updateOrigins?: boolean) => Promise<void>;
    updateDestinationsDisplayValue: () => Promise<void>;
}

export class SearchToStore implements ISssrStore<ISearchToInitialState> {
    protected destinationsSearchCancelSource: CancelTokenSource;

    @observable.shallow public selectedDestinations: IDestination[] = [];

    @observable public selectedDestinationCodes: string[] = [];
    @observable public selectedDestinationCodesQuery: string;
    @observable public selectedParentDestinationCodesQuery: string;

    @observable public selectedAccommodationCodes: string;

    @observable public availableDestinationsCodes: string[] | null = null;

    @observable public destinationsDisplayValue: IDisplayValue = { main: '' };
    @observable public destinationsParentDisplayValue: IDisplayValue = { main: '' };

    @observable public countriesWithRegions: IDestinationCountry[];
    @observable destinationsWithNames: IDestinationCountry[] = [];

    @observable isLoadingDestinations: boolean = false;
    @observable isDestinationsLoaded: boolean = false;
    @observable public isDestinationsSearchLoading: boolean = false;

    @observable public typeAheadDestinations: ITypeAheadResponse | null = null;

    constructor(private rootStore: TRootStore) {
        makeObservable(this);
    }

    @computed get selectedFullyAvailableDestinations(): IDestination[] {
        return this.selectedDestinations
            .filter(destination => this.availableDestinationsCodes?.includes(destination.code))
            .map(destination => ({
                ...destination,
                children: destination.children?.filter(child => this.availableDestinationsCodes?.includes(child.code)),
                relatedRegions: destination.relatedRegions?.filter(code =>
                    this.availableDestinationsCodes?.includes(code),
                ),
            }));
    }

    @computed get isAnywhereSelected(): boolean {
        return (
            this.selectedDestinations.some(dst => dst.code === GEOGRAPHY_ALL_CODE) ||
            (this.selectedDestinationCodes || []).some(code => code === GEOGRAPHY_ALL_CODE)
        );
    }

    @computed get availableDestinations(): Set<string> {
        return new Set(this.availableDestinationsCodes);
    }

    @computed get selectedData(): Set<string> {
        let destinationCodes: string[] = [];

        if (!this.availableDestinationsCodes) {
            destinationCodes = this.selectedDestinationCodes;
        } else if (this.availableDestinationsCodes.length) {
            destinationCodes = this.selectedDestinationCodes.filter(code => this.availableDestinations.has(code));
        }

        return new Set(destinationCodes);
    }

    @computed get countries(): Map<string, IDestinationCountry> {
        const data: Map<string, IDestinationCountry> = new Map();

        for (const country of this.countriesWithRegions) {
            const isCountrySelected = this.selectedData.has(country.code);

            if (isCountrySelected) {
                data.set(country.code, country);
                continue;
            }

            const children = country.children?.filter(region => this.availableDestinations.has(region.code));
            const isRegionDeselected = children?.length
                ? !!children.find(region => !this.selectedData.has(region.code))
                : true;

            if (!isRegionDeselected) {
                data.set(country.code, country);
            }
        }

        return data;
    }

    @computed get displayValue(): IDisplayValue {
        if (!this.selectedDestinations?.length) return { main: '' };

        if (this.isAnywhereSelected)
            return {
                main: this.rootStore.layoutStore.getPhrase(SitecoreDictionary.SearchPodLabelsAnywhere),
            };

        if (this.destinationsDisplayValue.main) {
            return this.destinationsDisplayValue;
        }

        // when destinationsDisplayValue is empty (e.g. titles not yet loaded or filtered by availability)
        return getFirstAndLastTitles(this.selectedDestinations.filter(d => d.name));
    }

    @computed get fullDisplayValue(): string {
        return this.displayValue.add ? `${this.displayValue.main} ${this.displayValue.add}` : this.displayValue.main;
    }

    serialize = (): ISearchToInitialState => ({
        selectedDestinationCodes: (this.selectedDestinationCodes || []).map(el => el.toLocaleUpperCase()),
        selectedParentDestinationCodesQuery: getParentDestination(this.selectedDestinationCodesQuery),
        selectedDestinationCodesQuery: this.selectedDestinationCodesQuery,
        selectedDestinations: this.selectedDestinations,
        selectedAccommodationCodes: this.selectedAccommodationCodes,
    });

    deserialize = (initialState?: ISearchToInitialState): void => {
        if (!initialState) {
            return;
        }

        this.setSelectedParentDestinationCodesQuery(
            getParentDestination(initialState.selectedDestinationCodesQuery ?? ''),
        );
        this.setSelectedDestinationCodes(
            (initialState.selectedDestinationCodes || []).map(el => el.toLocaleUpperCase()),
        );
        this.setSelectedDestinationCodesQuery(initialState.selectedDestinationCodesQuery ?? '');
        this.setSelectedAccommodationCodes(initialState.selectedAccommodationCodes ?? '');
        this.setSelectedDestinations(initialState.selectedDestinations || []);
    };

    @action setSelectedParentDestinationCodesQuery = (query: string): void => {
        this.selectedParentDestinationCodesQuery = query;
    };

    @action setSelectedDestinations = (destinations: IDestination[]): void => {
        this.selectedDestinations = destinations;
    };

    @action setSelectedDestinationCodes = (codes: string[]): void => {
        this.selectedDestinationCodes = codes;
    };

    @action setAvailableDestinationCodes = (codes: string[] | null): void => {
        this.availableDestinationsCodes = codes;
    };

    @action setCountriesWithRegions = (countries: IDestinationCountry[]): void => {
        this.countriesWithRegions = countries;
    };

    @action setSelectedDestinationCodesQuery = (query: string): void => {
        this.selectedDestinationCodesQuery = query;
    };

    @action setSelectedAccommodationCodes = (value: string): void => {
        this.selectedAccommodationCodes = value;
    };

    isDisabledItem = (item: IDestination | IDestinationCountry): boolean => {
        if (this.isAnywhereSelected) return true;

        if (!this.availableDestinationsCodes) return false;

        return !this.availableDestinations.has(item.code);
    };

    isCheckedItem = (item: IDestination | IDestinationCountry, parent?: IDestinationCountry): boolean => {
        if (this.isAnywhereSelected || this.availableDestinationsCodes?.length === 0) return false;

        if (parent && this.countries.has(parent.code)) return true;

        switch (item.type) {
            case DestinationType.Country:
            case DestinationType.VirtualCountry:
                return this.countries.has(item.code);

            case DestinationType.Region:
            case DestinationType.Resort:
                return this.selectedData.has(item.code);

            case DestinationType.VirtualRegion: {
                const regions = item.relatedRegions!.filter(code => this.availableDestinations.has(code));
                const isRegionDeselected = regions.length ? !!regions.find(code => !this.selectedData.has(code)) : true;

                return this.selectedData.has(item.code) || !isRegionDeselected;
            }

            default:
                return false;
        }
    };

    /**
     * @param noUpdate might be needed to prevent repeated requests to `destinations` endpoint
     */
    @action addDestination = (
        destination: IDestination,
        noUpdate: boolean = false,
        isAddHotelWithGiataCode: boolean = false,
    ) => {
        if (this.rootStore.searchStore.isSingleSelectableDestination) {
            this.clearDestinations({ noUpdate });
            this.rootStore.searchStore.isSingleSelectableDestination = false;
        }

        if (this.selectedDestinations.some(x => x.code === destination.code)) {
            return;
        }

        /** To remove previous selected destinations which is not equal to selected hotel */
        if (isAddHotelWithGiataCode) {
            this.setSelectedDestinations(
                this.selectedDestinations.filter(dest => dest.giataCode === destination.giataCode),
            );
        }

        const virtualCountryParent = getParentVirtualCountry(destination);
        const isSingleSelectableResortDestination =
            destination.type &&
            destination.type !== DestinationType.Hotel &&
            SINGLE_SELECTABLE_DESTINATION_TYPES.includes(destination.type);
        const isSingleResortSelection = isSingleSelectableResortDestination && !virtualCountryParent;

        if (isSingleResortSelection) {
            // should not be called for hotels as they could have the same giata code but different accomCodes
            this.selectSingleDestination(destination);
        } else {
            this.selectedDestinations.push(destination);
        }

        if (!noUpdate) {
            this.updateDestinationCodes();
        }
    };

    /**
     * @param noUpdate might be needed to prevent repeated requests to `destinations` endpoint
     */
    @action removeDestination = (destination: IDestination, noUpdate?: boolean) => {
        for (let i = 0; i < this.selectedDestinations.length; i++) {
            if (this.selectedDestinations[i].code === destination.code) {
                this.selectedDestinations.splice(i, 1);
                break;
            }
        }

        if (!noUpdate) this.updateDestinationCodes();
    };

    @action changeDestinations = async (
        destinations: IDestination[],
        updateDates = true,
        updateOrigins = true,
    ): Promise<void> => {
        const isSingleDestination = destinations.some(
            ({ type }) => type && SINGLE_SELECTABLE_DESTINATION_TYPES.includes(type),
        );

        if (isSingleDestination) {
            this.rootStore.searchStore.isSingleSelectableDestination = true;
        }

        this.setSelectedDestinations(destinations);

        await this.updateDestinationCodes(updateDates, updateOrigins);
    };

    /**
     * @param options.noUpdate might be needed to prevent repeated requests to `destinations` endpoint
     */

    @action clearDestinations = (options: { noUpdate?: boolean } = {}) => {
        const defaultOptions = { noUpdate: false };
        options = Object.assign(defaultOptions, options);

        this.setSelectedDestinations([]);

        this.selectedDestinationCodesQuery = '';

        if (!this.rootStore.layoutStore.isTradePortal) {
            this.setSelectedDestinationCodes([]);
        }

        if (!options.noUpdate) {
            this.updateDestinationCodes();
        }
    };

    /*
     *
     * @param destinations - array with all destination
     * we get a set of parent destination codes
     * Separate destinations by type and set to arrays
     * Depending on the parent type of the destination, call selectSingleDestination
     */
    @action selectedParentDestination = async (destinations: IDestinationCountry[]): Promise<void> => {
        this.clearDestinations({ noUpdate: true });
        const selectedParentDestinationCodesQuery = getCombinedDestinationCodes(
            this.selectedParentDestinationCodesQuery || '',
            '',
        );

        selectedParentDestinationCodesQuery.forEach(el => {
            const destination: IDestination = getIDestinationByCode(destinations, el);

            if (destination.type === DestinationType.Region || destination.type === DestinationType.VirtualRegion) {
                destination.parents && this.removeDestination(destination.parents[0]);
            }

            this.addDestination(destination, true);
        });

        await this.updateDestinationCodes();
    };

    /**
     * Changing destination
     */
    @action selectSingleDestination = async (
        destination: IDestination,
        updateDates?: boolean,
        updateOrigins?: boolean,
    ): Promise<void> => {
        if (SINGLE_SELECTABLE_DESTINATION_TYPES.includes(destination.type as DestinationType)) {
            this.rootStore.searchStore.isSingleSelectableDestination = true;
        }

        this.setSelectedDestinations([destination]);
        await this.updateDestinationCodes(updateDates, updateOrigins);
    };

    @action loadAllDestinations = async (isSelectedParent?: boolean): Promise<void> => {
        if (this.isLoadingDestinations) {
            await when(() => !this.isLoadingDestinations);
        }

        if (this.countriesWithRegions) {
            if (isSelectedParent) {
                await this.selectedParentDestination(this.countriesWithRegions);
            }

            await this.syncDestinationItems();

            return;
        }

        this.isLoadingDestinations = true;

        try {
            const result = await offersService.getAllDestinations();

            this.setCountriesWithRegions(result?.destinations || []);
            this.collectLoadedDestinationsTitles(this.countriesWithRegions);

            if (isSelectedParent) {
                await this.selectedParentDestination(this.countriesWithRegions);
            }

            await this.syncDestinationItems();
        } catch (e) {
            this.setCountriesWithRegions([]);
        } finally {
            this.isLoadingDestinations = false;
            this.isDestinationsLoaded = true;
        }
    };

    // For case when page is reloaded and we have dst codes from url but have no this.selectedDestinations items
    @action syncDestinationItems = async () => {
        const dsts2Add: IDestination[] = [];
        const missedCodes: string[] = [];

        const { selectedDestinationCodesFromUrl } = this.rootStore.queryParamsStore;

        const destinationCodes = this.selectedDestinationCodes?.length
            ? this.selectedDestinationCodes
            : selectedDestinationCodesFromUrl;

        for (const code of destinationCodes) {
            if (!code) {
                continue;
            }

            if (!this.selectedDestinations.some(selectedDst => selectedDst.code === code)) {
                const foundDst = getIDestinationByCode(this.destinationsWithNames, code);
                foundDst ? dsts2Add.push(foundDst) : missedCodes.push(code);
            }
        }

        // Load missing destinations
        if (missedCodes.length > 0) {
            let missedDestinations = await this.rootStore.searchStore.loadPlacesTitlesByCodes(missedCodes, true);

            if (!missedDestinations.length && missedCodes.some(code => code === GEOGRAPHY_ALL_CODE)) {
                missedDestinations = [{ code: GEOGRAPHY_ALL_CODE, name: this.rootStore.searchStore.anywhereWord }];
            }

            dsts2Add.push(...missedDestinations);
        }

        if (dsts2Add.length > 0) {
            runInAction(() => {
                const newDestinations = this.selectedDestinations.concat(dsts2Add);

                const isSingleSelectableDestinationChosen = newDestinations.some(d =>
                    SINGLE_SELECTABLE_DESTINATION_TYPES.includes(d.type as DestinationType),
                );

                if (isSingleSelectableDestinationChosen) {
                    this.rootStore.searchStore.isSingleSelectableDestination = true;
                }

                this.setSelectedDestinations(newDestinations);
                this.setSelectedDestinationCodes(newDestinations.map(({ code }) => code));

                this.rootStore.searchStore.oldSelectedDestinations = [...this.selectedDestinations];

                this.updateDestinationsDisplayValue();
            });
        }
    };

    @action prefillDestinations = async (prefilledParams: IPrefilledSearchParams): Promise<void> => {
        const destCodes = prefilledParams.dest.split(',').filter(Boolean);

        if (!destCodes.length) {
            this.clearDestinations();

            return;
        }

        this.clearDestinations({ noUpdate: true });

        // Select 'Anywhere'
        if (destCodes.includes(GEOGRAPHY_ALL_CODE)) {
            const destinations = [{ code: GEOGRAPHY_ALL_CODE, name: this.rootStore.searchStore.anywhereWord }];

            return this.changeDestinations(destinations);
        }

        await when(() => !!this.countriesWithRegions?.length);

        // It's not allowed to select multiple Resorts/Hotels/Virtual Resorts on Search Pod
        // Select available Countries/Regions
        const countriesRegions = destCodes
            .map(c => getIDestinationByCode(this.countriesWithRegions, c))
            .filter(Boolean);

        if (countriesRegions.length) {
            return await this.changeDestinations(
                countriesRegions.filter(d => this.availableDestinationsCodes?.indexOf(d.code) !== -1),
            );
        }

        // Multiple resorts can only be selected within a single Virtual Resort
        if (destCodes.length > MAX_HOTEL_CODES_LENGTH && !prefilledParams.isVirtualResort) {
            return;
        }

        // Load destinations with parents
        const destinations = await this.rootStore.searchStore.loadPlacesTitlesByCodes(destCodes, true);

        const isVirtualResortIncluded = destinations.some(
            destination => destination.type === DestinationType.VirtualResort,
        );

        // Select Single Hotel/Resort/Virtual Resort
        if (destinations.length === 1 || isVirtualResortIncluded) {
            return this.selectSingleDestination(destinations[0]);
        }

        // Select de-dupe (contract & external) Hotels (EJH-11865)
        if (
            destinations.length > 1 &&
            destinations[0].type === DestinationType.Hotel &&
            destinations[0].name === destinations[1].name
        ) {
            return await this.changeDestinations(destinations);
        }
    };

    private readonly createQuery = (array: string[]): string => (array.length > 0 ? ',' + array.join('|') : '');

    private readonly syncCountryAndRegionCodes = (
        inputCountries: string[],
        inputRegions: string[],
    ): { countries: string[]; regions: string[] } => {
        let countries = [...inputCountries];
        let regions = [...inputRegions];

        // if destination type has at least one Region

        // need to populate other `country-type` destinations with their regions
        for (const country of countries) {
            const foundDstCountry = getIDestinationByCode(this.countriesWithRegions, country);

            if (
                foundDstCountry?.children?.length &&
                foundDstCountry.children.every(child => regions.indexOf(child.code) === -1)
            ) {
                // if country has no regions - add them all
                regions = [...regions, ...foundDstCountry.children.map(child => child.code)];
            }
        }
        // need to populate all `region-type` destinations with their countries
        for (const region of regions) {
            const foundDstCountry = getIDestinationByCode(this.countriesWithRegions, region);

            if (foundDstCountry?.parents?.length && countries.indexOf(foundDstCountry.parents[0].code) === -1) {
                // if region has no country - add it
                countries = [...countries, foundDstCountry.parents[0].code];
            }
        }

        return { countries, regions };
    };

    private readonly composeSelectedDestinationCodesQuery = (
        countriesQuery: string,
        regionsQuery: string,
        resortsQuery: string,
    ): string => {
        if (this.selectedDestinations.some(dst => dst.code === GEOGRAPHY_ALL_CODE)) {
            return GEOGRAPHY_ALL_CODE;
        }

        return countriesQuery + regionsQuery + resortsQuery;
    };

    /**
     * @param updateDates using for prevent API call to available date
     * @param updateOrigins using for prevent origins update
     */
    @action updateDestinationCodes = async (updateDates = true, updateOrigins = true): Promise<void> => {
        // Add additional regions if needed
        const additionalRegions = this.rootStore.searchStore.manageVirtualRegions() as IDestination[];
        // to make popup empty on next typeahead search
        this.typeAheadDestinations = null;

        const relatedResorts = await this.rootStore.searchStore.getSelectedVirtualResortRelatedResorts();

        let dstClone = [...this.selectedDestinations];

        if (additionalRegions?.length) {
            dstClone.push(...additionalRegions);
        }

        if (relatedResorts.length) {
            dstClone.push(...relatedResorts);
        }

        const countryOrRegionIsSelected = dstClone.find(
            dst => dst.type && (dst.type == DestinationType.Country || dst.type == DestinationType.Region),
        );

        // It's possible to select regions and hotels for Promo Pages
        if (countryOrRegionIsSelected && !this.rootStore.layoutStore.isPromoPage) {
            dstClone = dstClone.filter(dst => dst.type && dst.type != DestinationType.Hotel);
        }

        dstClone = dstClone.sort(sortDestinationsByRelevance);
        const newParsedCodes: string[] = dstClone.map(d => d.code).filter(onlyUnique);

        this.setSelectedDestinationCodes(newParsedCodes);

        let countries: string[] = [];
        let regions: string[] = [];
        const resorts: string[] = [];
        const hotels: string[] = [];

        //TODO: probably it is better ot move this logic to the query maker
        manageDestinationCodes(dstClone, countries, regions, resorts, hotels);

        /**
         * Sync country/region codes for correct `geography` work
         */
        if (regions.length && countries.length && this.countriesWithRegions?.length) {
            ({ countries, regions } = this.syncCountryAndRegionCodes(countries, regions));
        }

        /*
        geog=cty1|cty1
        geog=cty1|cty1,cty2|cty2|cty2
        geog=cty1|cty1,cty2|cty2|cty2,cty3
        Where,
        Cty1 = Country
        Cty2 = Location
        Cty3 = Resort
        */

        const countriesQuery = (countries || []).join('|');
        const regionsQuery = this.createQuery(regions);
        const resortsQuery = this.createQuery(resorts);

        this.selectedDestinationCodesQuery = this.composeSelectedDestinationCodesQuery(
            countriesQuery,
            regionsQuery,
            resortsQuery,
        );

        this.setSelectedAccommodationCodes(hotels.join(','));

        /* update selectedParentDestinationCodesQuery only when we call new search */
        if (
            this.selectedDestinationCodesQuery === this.rootStore.queryParamsStore.selectedDestinationCodesQueryFromUrl
        ) {
            const parentDestinationCodesQuery = resorts.length > 0 ? countriesQuery + regionsQuery : countriesQuery;
            this.selectedParentDestinationCodesQuery = countriesQuery.length
                ? parentDestinationCodesQuery
                : this.selectedParentDestinationCodesQuery;
        }

        this.updateDestinationsDisplayValue();

        if (dstClone.length > 0 && this.rootStore.searchStore.hasErrorInField(SearchBarDropdown.To)) {
            this.rootStore.searchStore.clearErrorMessage();
        }

        //cos position of calendar will be reset on reopen
        this.rootStore.searchStore.searchWhen.resetDateAvailabilityInterval();

        updateOrigins && (await this.rootStore.searchStore.searchFrom.updateAvailableOrigins());
        updateDates && this.rootStore.searchStore.searchWhen.updateAvailableDates(true);
    };

    private readonly getAvailableDestinationsCodes = async (): Promise<string[] | null> => {
        const {
            searchFrom: { origins = [] },
            searchWhen: { whenParamsForRequest, isWhenParamsValid },
        } = this.rootStore.searchStore;
        const { fromParam, toParam, duration, flexDays } = whenParamsForRequest;

        if (origins.length === 0 && !isWhenParamsValid) {
            return null;
        }

        return await offersService.getAvailableDestinations(origins.join(','), fromParam, toParam, flexDays, duration);
    };

    @action updateAvailableDstCodes = async (onlyIfEmpty?: boolean): Promise<void> => {
        if (onlyIfEmpty && this.availableDestinationsCodes) {
            return;
        }

        try {
            const result = await this.getAvailableDestinationsCodes();

            this.setAvailableDestinationCodes(result);
            this.updateDestinationsDisplayValue();
        } catch (e) {
            if (!Axios.isCancel(e)) {
                this.setAvailableDestinationCodes(null);
            }
        }
    };

    @action updateDestinationsDisplayValue = async () => {
        // Avoid extra requests`destination/titles` if all destination are not loading
        await when(() => !this.isLoadingDestinations);

        const isDestinationsAreDuplicatedHotels =
            this.selectedDestinations.length > 0 &&
            this.selectedDestinations.every(
                dest => dest.giataCode && dest.giataCode === this.selectedDestinations[0]?.giataCode,
            );

        const virtualResort = this.selectedDestinations.find(r => r.type === DestinationType.VirtualResort);
        const virtualResortCodes = new Set([virtualResort?.code, ...(virtualResort?.relatedResorts ?? [])]);
        const isOnlyVirtualResortSelected =
            virtualResort && this.selectedDestinations.every(d => virtualResortCodes.has(d.code));

        runInAction(() => {
            const codes = isDestinationsAreDuplicatedHotels
                ? [this.selectedDestinationCodes[0]]
                : this.selectedDestinationCodes;
            this.destinationsDisplayValue = this.createDstDisplayValueByCodes(
                isOnlyVirtualResortSelected ? [virtualResort.code] : codes,
                this.destinationsWithNames,
                this.availableDestinationsCodes,
            );

            this.destinationsParentDisplayValue = this.createDstDisplayValueByCodes(
                [...(getCombinedDestinationCodes(this.selectedParentDestinationCodesQuery || '', '') || [])],
                this.destinationsWithNames,
                this.availableDestinationsCodes,
                true,
            );
        });
    };

    // TO DO change to computed property
    @action createDstDisplayValueByCodes = (
        codes: string[],
        placesWithNames: IDestinationCountry[],
        availableDestinationsCodes: string[] | null,
        isParent?: boolean,
        maxMainAmount = 1,
    ): IDisplayValue => {
        const destinationCountries: IDestinationCountry[] = [];
        const missedCodes: string[] = [];

        if (codes.includes(GEOGRAPHY_ALL_CODE)) {
            return {
                main: this.rootStore.layoutStore.getPhrase(SitecoreDictionary.SearchPodLabelsAnywhere),
            };
        }

        let filteredCodes;

        /**EJH-12747 Two hotel codes will mean that user select one hotel, that has contract and external offers.
         *  We don't need show duplicated name */
        if (isSingleHotelSearch(codes)) {
            filteredCodes = [codes[0]];
        } else {
            filteredCodes = codes.filter(
                code =>
                    //checking that single destination (hotel or resort) is selected
                    this.rootStore.searchStore.isSingleSelectableDestination ||
                    //and skip availability check for hotels and resorts
                    //edge case for offer on reloaded page
                    (codes.length === 1 && code.length > 4) ||
                    availableDestinationsCodes?.indexOf(code) !== -1 ||
                    (codes.length === 2 && code?.length === 8),
            );
        }

        filteredCodes.forEach(code => {
            const item = getDestinationOrChildrenByCode(code, placesWithNames);
            item ? destinationCountries.push(item) : missedCodes.push(code);
        });

        const filteredMissedCodes = missedCodes.filter(Boolean);

        if (filteredMissedCodes.length) {
            this.rootStore.searchStore.loadPlacesTitlesByCodes(filteredMissedCodes);
        }

        /* * should call createParentDstDisplayValueByCodes */
        if (isParent) {
            return createParentDstDisplayValueByCodes(
                filteredCodes,
                this.destinationsWithNames,
                this.rootStore.layoutStore.getPhrase,
            );
        }

        return getFirstAndLastTitles(destinationCountries, maxMainAmount);
    };

    isDestinationAvailable = (code: string): boolean =>
        !this.availableDestinationsCodes?.length || this.availableDestinationsCodes.indexOf(code) > -1;

    /**
     * Type ahead
     */
    @action searchTypeAheadDestinations = async (value: string) => {
        // cancel previous request if there is one
        if (this.destinationsSearchCancelSource) {
            this.destinationsSearchCancelSource.cancel();
        }

        if (!hasEnoughSymbolsToSearch(value)) {
            this.typeAheadDestinations = null;

            return;
        }

        this.isDestinationsSearchLoading = true;

        try {
            this.destinationsSearchCancelSource = Axios.CancelToken.source();

            const result = await this.getTypeAheadDestinations(value, this.destinationsSearchCancelSource);

            runInAction(() => {
                this.typeAheadDestinations = result;
                this.isDestinationsSearchLoading = false;
            });
        } catch (e) {
            if (!Axios.isCancel(e)) {
                runInAction(() => {
                    this.typeAheadDestinations = null;
                    this.isDestinationsSearchLoading = false;
                });
            }
        }
    };

    getTypeAheadDestinations = async (value: string, token?: CancelTokenSource) => {
        const {
            searchFrom: { origins = [] },
            searchWhen: { whenParamsForRequest },
        } = this.rootStore.searchStore;
        const { fromParam, toParam, duration, flexDays } = whenParamsForRequest;

        const result = await offersService.searchDestinations(
            value,
            origins.join(','),
            fromParam,
            toParam,
            flexDays,
            duration,
            token,
        );

        if (result.destinations) {
            this.collectLoadedDestinationsTitles(result.destinations);
        }

        if (
            this.rootStore.layoutStore.getSetting(SiteSettings.IsAnywhereShownInAutocomplete) &&
            this.rootStore.searchStore.anywhereWord.toLowerCase().includes(value.toLocaleLowerCase())
        ) {
            if (!result.destinations) {
                result.destinations = [];
            }

            result.destinations.unshift({
                available: true,
                code: GEOGRAPHY_ALL_CODE,
                name: this.rootStore.searchStore.anywhereWord,
                parents: [],
                showOnSearchPod: true,
                type: DestinationType.Anywhere,
            });
        }

        return result;
    };

    @action collectLoadedDestinationsTitles = (
        destinations: IDestinationCountry[],
        updateDisplayValue: boolean = true,
    ): void => {
        if (!destinations?.length) {
            return;
        }

        const newDestinations = toJS(destinations).reduce(
            (res, dest) => res.concat(toJS(dest.children) || []),
            [...destinations],
        );

        const destinationsToAdd: IDestinationCountry[] = newDestinations.filter(
            x => !this.destinationsWithNames.find(destination => destination.code == x.code),
        );

        if (destinationsToAdd.length) {
            this.destinationsWithNames = this.destinationsWithNames.concat(destinationsToAdd);
            updateDisplayValue && this.updateDestinationsDisplayValue();
        }
    };
}
