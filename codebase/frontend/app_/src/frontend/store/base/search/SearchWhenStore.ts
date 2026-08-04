import Axios from 'axios';
import dayjs from 'dayjs';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import offersService from 'frontend/services/offers.service';
import { ISssrStore, TRootStore } from 'frontend/store/IStores';
import {
    formatDateL10n,
    formatDateToQuery,
    getDate,
    getDaysDifference,
    getPreviousMonthDate,
    isDateInRange,
    parseDateL10n,
} from 'frontend/utils/date.utils';
import { getAvailableCountriesWithRegions, getCheapestMonthQuery } from 'frontend/utils/search/search.utils';
import { IAvailableDate } from 'models/data/IAvailableDate';
import { ICheapestMonth } from 'models/data/ICheapestMonth';
import { IMonthAvailability } from 'models/data/IMonthAvailability';
import { DestinationType } from 'models/enum/DestinationType';
import { GEOGRAPHY_ALL_CODE } from 'models/enum/RequestConstants';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SiteSettings from 'models/enum/SiteSettings';
import { IDurationPillOption } from 'models/sitecore/IDurationPillOption';

export const DEFAULT_DATE = 3;
export const RANGE_DURATION_IN_MONTHS = 3;
export const MAX_REQUEST_COUNT = 3;

export interface ISearchWhenInitialState {
    flexDays: number;
    from: string;
    isMonthSearch: boolean;
    monthSearchDuration: number;
    to: string;
}

export interface ISearchWhenStore {
    availableDates: IAvailableDate[] | null;
    changeDateAvailabilityInterval: (start: Date | null, end: Date | null) => void;
    cheapestMonthList: ICheapestMonth[] | undefined;
    clearDates: (noUpdate?: boolean) => void;
    clearMonthsAvailability: () => void;
    dateUpdated: () => void;
    defaultSearchPodMonthSearchDuration: number | undefined;
    deserialize: (initialState?: ISearchWhenInitialState) => void;
    firstAvailableDepartureDate: Date | undefined;
    flexDays: number;
    from: Date | null;
    hasCheapestMonthLoaded: boolean;
    isAvailableDatesLoading: boolean;
    isCheapestMonthSelected: boolean;
    isFlexible: boolean;
    isLastAvailableDateLoading: boolean;
    isMonthSearch: boolean;
    isWhenParamsValid: boolean;
    lastAvailableDate: Date | null;
    loadLastAvailableDate: () => Promise<void>;
    minDate: Date | undefined;
    monthSearchDuration: number;
    monthsAvailability: IMonthAvailability[];
    onChangeDates: (dates: Date[], updateDates?: boolean) => void;
    onChangeFlexible: (days: number) => void;
    onChangePrevFlexDays: (days: number) => void;
    prevFlexDays: number;
    requestAvailableDates: (
        fromString: string,
        toString: string,
        calculatedFrom: Date,
        calculatedTo: Date,
        selectedFromDate?: Date,
    ) => Promise<void>;
    requestAvailableMonths: () => Promise<void>;
    resetDateAvailabilityInterval: () => void;
    selectedNumberOfNights: number;
    serialize: () => ISearchWhenInitialState;
    setAvailableDatesLoading: (state: boolean) => void;
    setDates: (dates: Date[]) => void;
    setIsMonthSearch: (value: boolean) => void;
    setLastAvailableDate: (date: Date | null) => void;
    setLastAvailableDateLoading: (state: boolean) => void;
    setMonthSearchDuration: (duration: number | undefined) => void;
    to: Date | null;
    updateAvailableDates: (loadMonth: boolean) => Promise<void>;
    updateCheapestMonthPrices: () => Promise<void>;
    whenParamsForRequest: { duration: number | undefined; flexDays: number; fromParam: string; toParam: string };
}

export class SearchWhenStore implements ISssrStore<ISearchWhenInitialState> {
    @observable public from: Date | null;
    @observable public to: Date | null;
    @observable public flexDays: number;
    @observable public prevFlexDays: number;
    @observable public availableDates: IAvailableDate[] | null;
    @observable lastAvailableDate: Date | null;
    @observable isLastAvailableDateLoading: boolean = false;
    @observable isAvailableDatesLoading: boolean = false;
    @observable hasCheapestMonthLoaded: boolean = false;
    @observable public minDate: Date | undefined;
    @observable public isMonthSearch: boolean = false;
    @observable public monthsAvailability: IMonthAvailability[] = [];
    @observable private _monthSearchDuration: number | undefined;
    @observable public cheapestMonthList: ICheapestMonth[] | undefined = undefined;

    protected availableDateStart: Date | null;
    protected availableDateEnd: Date | null;
    protected datesCacheKey: string;
    protected datesCache: IAvailableDate[] = [];
    protected availableDateRequestsCount = 0;
    protected fromCacheKey: string | undefined;
    protected toCacheKey: string | undefined;

    constructor(private readonly rootStore: TRootStore) {
        makeObservable(this);
    }

    serialize = (): ISearchWhenInitialState => ({
        from: formatDateL10n(this.from),
        to: formatDateL10n(this.to),
        flexDays: this.flexDays,
        monthSearchDuration: this.monthSearchDuration,
        isMonthSearch: this.isMonthSearch,
    });

    deserialize = (initialState?: ISearchWhenInitialState): void => {
        if (!initialState) {
            return;
        }

        this.from = parseDateL10n(initialState.from);
        this.to = parseDateL10n(initialState.to);
        this.flexDays = initialState.flexDays;
        this._monthSearchDuration = initialState.monthSearchDuration;
        this.isMonthSearch = initialState.isMonthSearch;
    };

    @computed get isWhenParamsValid(): boolean {
        return !!(this.from && this.to);
    }

    @computed get isFlexible(): boolean {
        return !!this.flexDays;
    }

    @computed get selectedNumberOfNights(): number {
        if (!this.from || !this.to) {
            return 0;
        }

        if (this.isMonthSearch && this.from && this.to) {
            return this.monthSearchDuration;
        }

        return getDaysDifference(this.to, this.from);
    }

    @computed get firstAvailableDepartureDate(): Date | undefined {
        if ((this.availableDates || []).length === 0) {
            return undefined;
        }

        const firstAvailableDate = this.availableDates?.find(date => date.out === true);

        return firstAvailableDate && getDate(firstAvailableDate.date);
    }

    @computed get defaultSearchPodMonthSearchDuration(): number | undefined {
        const durationOption: IDurationPillOption = this.rootStore.layoutStore.getSetting(
            SiteSettings.DefaultSearchPodMonthSearchDuration,
        );

        return durationOption ? Number.parseInt(durationOption.Duration) : undefined;
    }

    setMonthSearchDuration = (duration: number | undefined): void => {
        this._monthSearchDuration = duration;
    };

    @computed get monthSearchDuration(): number {
        return this._monthSearchDuration || 0;
    }

    @action setLastAvailableDate = (date: Date | null): void => {
        if (date === null || date.getTime() >= new Date().getTime()) {
            this.lastAvailableDate = date;
        }
    };

    @action setLastAvailableDateLoading = (state: boolean): void => {
        this.isLastAvailableDateLoading = state;
    };

    @action setAvailableDatesLoading = (state: boolean): void => {
        this.isAvailableDatesLoading = state;
    };

    @action setDates = (dates: Date[]): void => {
        this.from = dates[0] ?? null;
        this.to = dates[1] ?? null;
    };

    @action onChangeFlexible = (days: number): void => {
        this.flexDays = days;
    };

    @action onChangePrevFlexDays = (days: number): void => {
        this.prevFlexDays = days;
    };

    @action setIsMonthSearch = (value: boolean): void => {
        this.isMonthSearch = value;
    };

    get whenParamsForRequest(): { duration: number | undefined; flexDays: number; fromParam: string; toParam: string } {
        const duration = this.isMonthSearch ? this.monthSearchDuration : undefined;

        return {
            fromParam: formatDateToQuery(this.from),
            toParam: formatDateToQuery(this.to),
            flexDays: this.flexDays,
            duration,
        };
    }

    @action dateUpdated = (): void => {
        if ((this.from && this.to) || (!this.from && !this.to)) {
            this.rootStore.searchStore.searchFrom.updateAvailableOrigins();
            this.rootStore.searchStore.searchTo.updateAvailableDstCodes();
        }
    };

    /**
     * Changing dates
     * @param updateDates might be needed to prevent repeated requests to `destinations` endpoint
     */
    @action onChangeDates = (dates: Date[], updateDates = true): void => {
        this.setDates(dates);

        if (dates.length > 1 && this.rootStore.searchStore.hasErrorInField(SearchBarDropdown.When)) {
            this.rootStore.searchStore.clearErrorMessage();
        }

        if (updateDates) {
            this.dateUpdated();
        }
    };

    /**
     * @param noUpdate might be needed to prevent repeated requests to `destinations` endpoint
     */
    @action clearDates = (noUpdate?: boolean): void => {
        this.from = null;
        this.to = null;

        this.updateAvailableDates(false);

        if (!noUpdate) {
            this.dateUpdated();
        }
    };

    @action changeDateAvailabilityInterval = (start: Date | null, end: Date | null): void => {
        const { availableDateStart: promoStart, availableDateEnd: promoEnd } = this.rootStore.promoPageStore;
        const needCheckPromoDates = this.rootStore.layoutStore.isPromoPage && !!promoStart && !!promoEnd;

        // If it's Promo Page, available dates should be in date range [promoStart, promoEnd]
        this.availableDateStart =
            start && needCheckPromoDates && !isDateInRange(start, promoStart, promoEnd) ? promoStart : start;
        this.availableDateEnd =
            end && needCheckPromoDates && !isDateInRange(end, promoStart, promoEnd) ? promoEnd : end;

        this.updateAvailableDates(false);
    };

    @action resetDateAvailabilityInterval = (): void => {
        this.availableDateStart = null;
        this.availableDateEnd = null;
    };

    @action updateAvailableDates = async (loadMonth: boolean): Promise<void> => {
        if (this.rootStore.layoutStore.isMonthSearchEnabled && !this.rootStore.layoutStore.isPromoPage && loadMonth) {
            this.requestAvailableMonths();
        }

        if (!this.lastAvailableDate && !this.isLastAvailableDateLoading) {
            this.loadLastAvailableDate();
        }

        if (
            (this.rootStore.searchStore.searchFrom.origins || []).length === 0 &&
            (this.rootStore.searchStore.searchTo.selectedDestinationCodes || []).length === 0 &&
            !this.rootStore.layoutStore.isPromoPage
        ) {
            this.availableDates = null;

            return;
        }

        // Avoid extra calls, if it's Promo Page and dates have not set.
        if (this.rootStore.layoutStore.isPromoPage && !this.rootStore.promoPageStore.availableDateStart) {
            return;
        }

        try {
            this.setAvailableDatesLoading(true);
            const result = await this.getAvailableDates();

            this.availableDates = [...result];
        } catch (e) {
            if (!Axios.isCancel(e)) {
                this.availableDates = null;
            }
        } finally {
            this.setAvailableDatesLoading(false);
        }
    };

    @action clearMonthsAvailability = (): void => {
        this.monthsAvailability = [];
    };

    @action requestAvailableMonths = async (): Promise<void> => {
        const origins = this.rootStore.searchStore.searchFrom.origins;
        const selectedDestinationCodes = this.rootStore.searchStore.searchTo.selectedDestinationCodes;

        if (!origins?.length || !selectedDestinationCodes.length) {
            this.clearMonthsAvailability();

            return;
        }

        const { monthsAvailability, lastAvailableDate } = await offersService.getAvailableMonths(
            this.monthSearchDuration,
            origins?.join(','),
            selectedDestinationCodes.join(','),
        );

        this.monthsAvailability = monthsAvailability;
        this.setLastAvailableDate(new Date(lastAvailableDate));
    };

    requestAvailableDates = async (
        fromString: string,
        toString: string,
        calculatedFrom: Date,
        calculatedTo: Date,
        selectedFromDate?: Date,
    ): Promise<void> => {
        // stop recursion if was made max request count
        if (this.availableDateRequestsCount === MAX_REQUEST_COUNT) {
            this.availableDateRequestsCount = 0;

            return;
        }

        const promoPageId = this.rootStore.layoutStore.isPromoPage ? this.rootStore.layoutStore.layoutId : undefined;

        this.setAvailableDatesLoading(true);

        const missingDates = await offersService.getAvailableDates(
            fromString,
            toString,
            formatDateToQuery(calculatedFrom),
            formatDateToQuery(calculatedTo),
            promoPageId,
            selectedFromDate ? formatDateToQuery(selectedFromDate) : undefined,
        );

        // replace existing entries for the same date
        const incomingDates = missingDates.dates || [];

        if (incomingDates.length > 0) {
            const incomingDateKeys = new Set(incomingDates.map(d => d.date));
            this.datesCache = [...this.datesCache.filter(d => !incomingDateKeys.has(d.date)), ...incomingDates];
        }

        this.setLastAvailableDate(new Date(missingDates.lastAvailableDate));

        this.setAvailableDatesLoading(false);

        // and sort by date
        this.datesCache.sort((a: IAvailableDate, b: IAvailableDate) => a.date.localeCompare(b.date));

        // Send another request with new availability interval,
        // if current interval [calculatedFrom, calculatedTo] doesn't have available dates
        // or if month of nextAvailableDate equals month of calculatedTo.
        // Don't do it for Promo Page because its offers can be only in [calculatedFrom, calculatedTo]
        // Such recursion requests can do MAX_REQUEST_COUNT times
        if (
            missingDates.nextAvailableDate &&
            !this.rootStore.layoutStore.isPromoPage &&
            this.rootStore.appStore.isScreenMedium
        ) {
            const firstAvailableDate = getDate(missingDates.nextAvailableDate);

            if (
                calculatedTo.getTime() < firstAvailableDate.getTime() ||
                calculatedTo.getMonth() === firstAvailableDate.getMonth()
            ) {
                const lastAvailableDateOfRange = new Date(firstAvailableDate);
                lastAvailableDateOfRange.setMonth(firstAvailableDate.getMonth() + RANGE_DURATION_IN_MONTHS);

                // get availability for new interval
                this.availableDateRequestsCount += 1;
                this.changeDateAvailabilityInterval(calculatedTo, lastAvailableDateOfRange);

                return;
            }
        }

        /**On mobile we need load availability for all dates until lastAvailable.
         * After we got lastAvailable we need check if this date is in currently loaded range.
         * If no load dates until lastAvailable*/

        if (
            !this.rootStore.appStore.isScreenMedium &&
            missingDates.lastAvailableDate &&
            !isDateInRange(
                new Date(missingDates.lastAvailableDate),
                new Date(this.datesCache[0].date),
                new Date(this.datesCache[this.datesCache.length - 1].date),
            )
        ) {
            /** We need load availability till end of last available month,
             *  as we can have dates after last available date that are available for returning */
            const lastMonthDate = new Date(missingDates.lastAvailableDate);
            lastMonthDate.setDate(1);
            lastMonthDate.setMonth(lastMonthDate.getMonth() + 1);
            lastMonthDate.setDate(0);

            this.availableDateRequestsCount += 1;
            this.changeDateAvailabilityInterval(calculatedTo, lastMonthDate);

            return;
        }

        this.availableDateRequestsCount = 0;
    };

    loadLastAvailableDate = async (): Promise<void> => {
        try {
            this.setLastAvailableDateLoading(true);
            const lastDate = await offersService.getLastAvailableDate();
            runInAction(() => {
                this.setLastAvailableDate(lastDate);
                this.setLastAvailableDateLoading(false);
            });
        } catch (e) {
            this.setLastAvailableDate(null);
            this.setLastAvailableDateLoading(false);
        }
    };

    /**
     * check whether search route (from-to) was changed
     * @param key
     */
    @action private readonly updateDatesCacheKey = (key: string): void => {
        if (this.datesCacheKey !== key) {
            this.datesCache = [];
            this.datesCacheKey = key;
        }
    };

    private readonly getAvailableDates = async (): Promise<IAvailableDate[]> => {
        const getFromToDesktop = (): { from: Date; to: Date } => {
            let from, to;
            let fromSelected;
            const ignoreDateRange = this.isMonthSearch && !this.rootStore.layoutStore.isPromoPage; // promo page doesn't support month search feature

            if (!ignoreDateRange && this.from) {
                fromSelected = new Date(this.from);
                fromSelected.setDate(-DEFAULT_DATE);
                fromSelected.setMonth(fromSelected.getMonth() - 1);
            }

            const earlierFrom = this.availableDateStart || fromSelected;

            from =
                (this.rootStore.layoutStore.isPromoPage
                    ? this.rootStore.promoPageStore.availableDateStart
                    : this.minDate) ?? new Date();
            let prevMonthCount = 0;

            if (earlierFrom > from) {
                from = earlierFrom;
                prevMonthCount = 1;
            }

            let toSelected;

            if (!ignoreDateRange && this.to) {
                toSelected = new Date(this.to);
                toSelected.setDate(-DEFAULT_DATE);
                toSelected = getPreviousMonthDate(toSelected);
            }

            const latestTo = this.availableDateEnd || toSelected;

            if (this.rootStore.layoutStore.isPromoPage && this.rootStore.promoPageStore.availableDateEnd) {
                to = this.rootStore.promoPageStore.availableDateEnd;
            } else {
                to = new Date(from);
                to.setDate(DEFAULT_DATE);
                to.setMonth(to.getMonth() + RANGE_DURATION_IN_MONTHS + prevMonthCount);
            }

            if (latestTo > to) {
                to = latestTo;
            }

            return { from, to };
        };

        const getFromToMobile = (): { from: Date; to: Date } => {
            let to;
            const from =
                (this.rootStore.layoutStore.isPromoPage
                    ? this.rootStore.promoPageStore.availableDateStart
                    : this.availableDateStart) ?? new Date();

            if (this.rootStore.layoutStore.isPromoPage && this.rootStore.promoPageStore.availableDateEnd) {
                to = this.rootStore.promoPageStore.availableDateEnd;
            } else if (this.availableDateEnd) {
                to = this.availableDateEnd;
            } else {
                const DECEMBER_INDEX = 11;
                const DECEMBER_DAY_COUNT = 31;

                to = new Date(from);
                to.setYear(to.getFullYear() + 1); // check available dates including next year
                to.setMonth(DECEMBER_INDEX);
                to.setDate(DECEMBER_DAY_COUNT);
            }

            return { from, to };
        };

        const getFromTo = (): { from: Date; to: Date } =>
            this.rootStore.appStore.isScreenMedium ? getFromToDesktop() : getFromToMobile();

        const { from, to } = getFromTo();

        const fromString = (this.rootStore.searchStore.searchFrom.origins || []).join(',');
        const toString = this.rootStore.searchStore.searchTo.selectedDestinationCodes.join(',');

        // check whether search route (from-to) was changed
        this.updateDatesCacheKey(`${fromString}-${toString}`);

        let calculatedFrom = from;
        let calculatedTo = to;

        // if something is cached, get only missing part
        if (this.datesCache.length > 0) {
            // detect shift direction

            const cacheStartDate = new Date(this.datesCache[0].date);
            // compare dates without the time part
            cacheStartDate.setHours(0, 0, 0, 0);
            from.setHours(0, 0, 0, 0);

            if (from < cacheStartDate) {
                calculatedTo = cacheStartDate;
            }

            const cacheEndDate = new Date(this.datesCache[this.datesCache.length - 1].date);
            // compare dates without the time part
            cacheEndDate.setHours(0, 0, 0, 0);
            to.setHours(0, 0, 0, 0);

            if (to > cacheEndDate) {
                calculatedFrom = cacheEndDate;
            }
        }

        const currentFromKey = this.from?.toISOString();
        const fromChanged = currentFromKey !== this.fromCacheKey;
        this.fromCacheKey = currentFromKey;

        const currentToKey = this.to?.toISOString();
        const toChangedFromEmpty = !this.toCacheKey && !!currentToKey;
        this.toCacheKey = currentToKey;

        // if we are not iterating cached dated only OR if cache is empty OR if this.from changed OR if this.to changed from empty to a date
        if (
            calculatedFrom !== from ||
            to !== calculatedTo ||
            this.datesCache.length === 0 ||
            fromChanged ||
            toChangedFromEmpty
        ) {
            // fetch only missing dates
            await this.requestAvailableDates(
                fromString,
                toString,
                calculatedFrom,
                calculatedTo,
                // if end date is selected, we don't need to pass selectedFromDate, because we need to load all dates available for new range
                !this.to && this.from ? this.from : undefined,
            );
        }

        return this.datesCache;
    };

    @action updateCheapestMonthPrices = async (): Promise<void> => {
        if (!this.rootStore.layoutStore.isCheapestMonthPriceEnabled) {
            this.hasCheapestMonthLoaded = true;

            return;
        }

        try {
            const { selectedAvailableOrigins } = this.rootStore.searchStore.searchFrom;
            const {
                selectedFullyAvailableDestinations,
                selectedDestinations,
                availableDestinationsCodes,
                countriesWithRegions,
            } = this.rootStore.searchStore.searchTo;

            const isAnywhereSelected = selectedDestinations.some(dest => dest.code === GEOGRAPHY_ALL_CODE);

            const selectedDestinationsForCheapestMonth = isAnywhereSelected
                ? getAvailableCountriesWithRegions(countriesWithRegions, availableDestinationsCodes)
                : selectedFullyAvailableDestinations.map(destination => {
                      if (destination.type === DestinationType.Country && !destination.children) {
                          const regions = countriesWithRegions.find(
                              country => country.code === destination.code,
                          )?.children;

                          const availableRegions = availableDestinationsCodes?.length
                              ? regions?.filter(region => availableDestinationsCodes?.includes(region.code))
                              : regions;

                          return availableRegions && availableRegions.length > 0
                              ? { ...destination, children: availableRegions }
                              : destination;
                      }

                      return destination;
                  });

            const isAllowed = this.rootStore.searchStore.isCheapestMonthAllowed(selectedDestinationsForCheapestMonth);

            if (!isAllowed) {
                this.cheapestMonthList = undefined;

                return;
            }

            const destinationQuery = getCheapestMonthQuery(selectedDestinationsForCheapestMonth);

            const cheapestMonthList = await offersService.fetchCheapestMonthList(
                selectedAvailableOrigins.join(','),
                destinationQuery,
            );

            runInAction(() => {
                this.cheapestMonthList = cheapestMonthList.map(item => ({
                    ...item,
                    // On the server month count starts from 1 - January, FE count it from 0 - January
                    month: item.month - 1,
                }));
            });
        } catch (e) {
            console.error(e);

            runInAction(() => {
                this.cheapestMonthList = undefined;
            });
        } finally {
            runInAction(() => {
                this.hasCheapestMonthLoaded = true;
            });
        }
    };

    @computed get isCheapestMonthSelected(): boolean {
        const isMonthSelected =
            !!this.from && this.rootStore.layoutStore.isCheapestMonthPriceEnabled && this.isMonthSearch;

        if (!isMonthSelected) {
            return false;
        }

        const formattedDate = dayjs(this.from);

        return !!this.cheapestMonthList?.some(
            cheapestMonth =>
                cheapestMonth.year === formattedDate.year() && cheapestMonth.month === formattedDate.month(),
        );
    }
}
