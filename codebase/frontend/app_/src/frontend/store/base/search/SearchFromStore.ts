import Axios from 'axios';
import { action, computed, makeObservable, observable, runInAction, toJS, when } from 'mobx';

import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import { normalizeAirport } from 'frontend/utils/airports.utils';
import { createOriDisplayValueByCodes } from 'frontend/utils/search/search.utils';
import { IDisplayValue } from 'models/data/IDisplayValue';
import { MarketCode } from 'models/data/MarketSettings';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import { IAirport, IAirportCountry } from 'models/sitecore/IAirportsData';

export interface ISearchFromInitialState {
    origins?: string[];
}

export interface ISearchFromStore extends ISearchFromInitialState {
    airports: Map<string, IAirport>;
    availableOrigins: Set<string>;
    availableOriginsCodes: string[] | null;
    clearOriginFromGeo: () => void;
    countries: IAirportCountry[];
    country: IAirport[];

    deserialize: (initialState: ISearchFromInitialState) => void;
    displayValue: IDisplayValue;

    fullDisplayValue: string;
    isCheckedItem: (item: IAirport) => boolean;
    isDisabledItem: (item: IAirport) => boolean;

    isFromParamsValid: boolean;
    onAddOrigin: (code: string) => void;
    onAddOriginFromGeo: (airport: IAirport) => void;
    onClearOrigins: (noUpdate?: boolean) => void;
    onRemoveOrigin: (code: string) => void;
    originFromGeo: string | null;
    originsDisplayValue: IDisplayValue;
    selectedAvailableOrigins: string[];
    selectedOrigins: Set<string>;

    serialize: () => ISearchFromInitialState;
    setAllAvailableOrigins: () => Promise<void>;
    setAvailableOrigins: (value: string[] | null) => void;
    setCountries: (originalCountries: IAirportCountry[]) => void;
    setNormalOrigins: (codes: string[] | null) => void;
    setOrigins: (codes: string[] | null, validate?: boolean) => void;
    updateAvailableOrigins: (onlyIfEmpty?: boolean) => Promise<void>;
    updateOriginsDisplayValue: () => void;
}
export class SearchFromStore implements ISssrStore<ISearchFromInitialState> {
    @observable public countries: IAirportCountry[] = [];

    @observable public origins: string[];
    @observable public availableOriginsCodes: string[] | null;
    @observable public originsDisplayValue: IDisplayValue = { main: '' };

    /** variable that keeps airport code that was selected because of using geolocation */
    @observable originFromGeo: string | null = null;

    constructor(private rootStore: TRootStore) {
        makeObservable(this);
    }

    @computed get country(): IAirport[] {
        const { marketCode } = this.rootStore.marketStore;

        if (marketCode === MarketCode.UK) {
            const {
                airports = [],
                itemName,
                name,
            } = this.countries.find(({ code }) => code === marketCode) || this.countries[0] || {};

            return airports.map(airport => normalizeAirport(airport, { name, itemName }));
        }

        return this.countries.flatMap(({ code, name, itemName, airports = [] }) => {
            const isForeignAirport = code !== marketCode;

            return airports.map(airport => normalizeAirport(airport, { name, itemName }, isForeignAirport));
        });
    }

    @computed get airports(): Map<string, IAirport> {
        return this.country
            .flatMap(item => toJS(item.airports) || item)
            .reduce((acc, next) => acc.set(next.code, next), new Map());
    }

    @computed get isFromParamsValid(): boolean {
        return this.origins?.length > 0;
    }

    @computed get selectedAvailableOrigins(): string[] {
        return this.origins?.filter(code => this.availableOriginsCodes?.includes(code)) ?? [];
    }

    @computed get availableOrigins(): Set<string> {
        return new Set(this.availableOriginsCodes);
    }

    @computed get selectedOrigins(): Set<string> {
        return new Set(this.origins);
    }

    @computed get displayValue(): IDisplayValue {
        return this.originsDisplayValue;
    }

    @computed get fullDisplayValue(): string {
        return this.displayValue.add ? `${this.displayValue.main} ${this.displayValue.add}` : this.displayValue.main;
    }

    serialize = (): ISearchFromInitialState => ({
        origins: (this.origins || []).map(el => el.toLocaleUpperCase()),
    });

    deserialize = (initialState?: ISearchFromInitialState): void => {
        if (initialState) {
            this.origins = (initialState.origins || []).map(el => el.toLocaleUpperCase());
        }
    };

    @action setNormalOrigins = (codes: string[]): void => {
        this.origins = codes;
    };

    @action setCountries = (originalCountries: IAirportCountry[]): void => {
        this.countries = originalCountries;
    };

    isDisabledItem = (item: IAirport | IAirportCountry): boolean => {
        if (!this.availableOriginsCodes) return false;

        if (item.airports) {
            return !item.airports.find(airport => this.availableOrigins.has(airport.code));
        }

        return !this.availableOrigins.has(item.code);
    };

    isCheckedItem = (item: IAirport | IAirportCountry): boolean => {
        if (this.isDisabledItem(item)) return false;

        if (item.airports) {
            const airports = this.availableOriginsCodes
                ? item.airports.filter(airport => this.availableOrigins.has(airport.code))
                : item.airports;

            return !airports.find(airport => !this.selectedOrigins.has(airport.code));
        }

        return this.selectedOrigins.has(item.code);
    };

    @action setOrigins = (codes: string[], validate = true): void => {
        this.origins = codes;

        if (this.rootStore.searchStore.hasErrorInField(SearchBarDropdown.From)) {
            this.rootStore.searchStore.clearErrorMessage();
        }

        if (validate) {
            this.rootStore.searchStore.originsUpdated();
        }
    };

    @action onAddOrigin = (code: string): void => {
        this.origins = [...this.selectedOrigins.add(code)];

        if (this.rootStore.searchStore.hasErrorInField(SearchBarDropdown.From)) {
            this.rootStore.searchStore.clearErrorMessage();
        }

        this.rootStore.searchStore.originsUpdated();
    };

    @action onRemoveOrigin = (code: string) => {
        if (code === this.originFromGeo) {
            this.clearOriginFromGeo();
        }

        this.origins = this.origins.filter(origin => origin !== code);

        this.rootStore.searchStore.originsUpdated();
    };

    /**
     * @param noUpdate might be  needed to prevent repeated requests to `destinations` endpoint
     */
    @action onClearOrigins = (noUpdate?: boolean) => {
        this.origins = [];

        if (!noUpdate) {
            this.rootStore.searchStore.originsUpdated();
        }
    };

    //GEO

    @action clearOriginFromGeo = () => {
        this.originFromGeo = null;
    };

    @action onAddOriginFromGeo = (airport: IAirport) => {
        this.originFromGeo = airport.code;

        this.onAddOrigin(this.originFromGeo);
    };

    @action setAvailableOrigins = (origins: string[] | null): void => {
        this.availableOriginsCodes = origins;
    };

    @action setAllAvailableOrigins = async () => {
        await when(() => !!this.availableOriginsCodes);

        if (this.availableOriginsCodes && !this.rootStore.queryParamsStore.originFromUrl?.length) {
            // set origins only if it's shown in search pod
            const originCodes = this.availableOriginsCodes.filter(code => this.airports.has(code));
            this.setOrigins(originCodes);
        }
    };

    @action updateAvailableOrigins = async (onlyIfEmpty?: boolean) => {
        if (onlyIfEmpty && this.availableOriginsCodes) return;

        try {
            const result = await this.rootStore.searchStore.getAvailableOriginsCodes();

            runInAction(() => {
                this.availableOriginsCodes = result;

                // clear selected origin from geo if is now is not available
                if (this.originFromGeo && !this.availableOriginsCodes?.includes(this.originFromGeo)) {
                    this.clearOriginFromGeo();
                }

                this.updateOriginsDisplayValue();
            });
        } catch (e) {
            if (!Axios.isCancel(e)) {
                runInAction(() => {
                    this.availableOriginsCodes = null;
                });
            }
        }
    };

    @action updateOriginsDisplayValue = (): void => {
        const isAllAirportsEnabled = this.rootStore.layoutStore.isDestinationPage;
        let availableOriginsCodes = this.availableOriginsCodes;

        if (isAllAirportsEnabled && this.airports.size) {
            // on destinations pages only departure airports should be set as available, so we correctly show 'All airports' phrase
            availableOriginsCodes = this.availableOriginsCodes?.filter(code => this.airports.has(code)) || null;
        }

        this.originsDisplayValue = createOriDisplayValueByCodes(
            this.origins || [],
            this.rootStore.searchStore.originsWithNames,
            availableOriginsCodes,
            this.rootStore.layoutStore.getPhrase,
            this.rootStore.layoutStore.isDestinationPage,
            this.rootStore.marketStore.marketCode,
        );
    };
}
