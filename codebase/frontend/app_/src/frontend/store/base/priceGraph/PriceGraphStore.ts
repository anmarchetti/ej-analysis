import { CancelTokenSource } from 'axios';
import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';

import { CurrencyCode } from 'code/currency';
import { logger } from 'frontend/services/logging';
import priceGraphService from 'frontend/services/priceGraph.service';
import { ComparePriceStore } from 'frontend/store/base/comparePrice/ComparePriceStore';
import { TRootStore } from 'frontend/store/IStores';
import { addDays, getDate } from 'frontend/utils/date.utils';
import { buildRoomAllocationFromOfferUnitParams, getAccommodationIdsString } from 'frontend/utils/url.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IOffer } from 'models/data/IOffer';

const MOBILE_BREAKPOINT = 799;

export class PriceGraphStore extends ComparePriceStore {
    @observable alternativeOffers: IAlternativeOffer[] = [];
    @observable isLoadingAlternativeDates: boolean = false;
    @observable middleDate: Nullable<Date> = null;
    @observable priceGraphPopupVisible: boolean = false;
    @observable mapRerenderTrigger: number = Math.random();
    @observable holidayDurationSingleSearch: Nullable<number>;

    constructor(public rootStore: TRootStore) {
        super(rootStore);

        makeObservable(this);
    }

    // Price Graph & Calendar has own mobile breakpoint - 799px (requested by designers EUX-765)
    @computed get isMobileView(): boolean {
        return this.rootStore.appStore.breakpoint <= MOBILE_BREAKPOINT;
    }

    @computed get currency(): CurrencyCode | undefined {
        return this.alternativeOffers?.length > 0
            ? this.alternativeOffers[0].currency?.code
            : this.rootStore.bookingStore.currency;
    }

    @action loadAlternativeOffers = async (
        isSingleNoResult?: boolean,
        newMiddleDate?: Date,
        isNext?: boolean,
        cancelSource?: CancelTokenSource,
    ) => {
        try {
            const selectedOffer = isSingleNoResult ? ({} as IOffer) : this.rootStore.bookingStore.selectedOffer;

            if (!selectedOffer) {
                return;
            } else if (newMiddleDate && isNext !== undefined && !this.isDataShouldBeLoaded(newMiddleDate, isNext)) {
                this.middleDate = newMiddleDate;

                return;
            }

            this.isLoadingAlternativeDates = true;

            const accommodationIds = getAccommodationIdsString(this.rootStore.queryParamsStore);

            const result = isSingleNoResult
                ? await priceGraphService.loadAlternativeOffers(
                      newMiddleDate ? newMiddleDate : (this.rootStore.searchStore.searchWhen.from as Date),
                      this.rootStore.searchStore.searchWhen.from as Date,
                      this.rootStore.searchStore.searchWhen.flexDays,
                      this.rootStore.searchStore.searchWhen.selectedNumberOfNights,
                      (this.rootStore.searchStore.searchFrom.origins || []).join(','),
                      this.rootStore.queryParamsStore.roomsAllocationFromUrl,
                      accommodationIds,
                      '',
                      [],
                      [],
                      undefined,
                      cancelSource,
                  )
                : await priceGraphService.loadAlternativeOffers(
                      newMiddleDate ? newMiddleDate : getDate(selectedOffer.date),
                      getDate(selectedOffer.date),
                      0,
                      selectedOffer.stay,
                      this.rootStore.alternativeFlightsStore.departureAirportsQuery,
                      buildRoomAllocationFromOfferUnitParams(selectedOffer.accom.unit),
                      accommodationIds,
                      this.rootStore.bookingStore.boardTypeCode,
                      this.rootStore.alternativeFlightsStore.selectedOutboundDepTimes,
                      this.rootStore.alternativeFlightsStore.selectedInboundDepTimes,
                      this.rootStore.layoutStore.isCheapestComparePriceOption,
                      cancelSource,
                  );

            runInAction(() => {
                if (!newMiddleDate) {
                    this.alternativeOffers = result.offers;
                } else if (newMiddleDate && this.middleDate && newMiddleDate.getTime() > this.middleDate.getTime()) {
                    const offers = toJS(this.alternativeOffers).concat(result.offers);

                    this.makeOffersDistinct(offers);
                } else if (newMiddleDate && this.middleDate && newMiddleDate.getTime() < this.middleDate.getTime()) {
                    const offers = result.offers.concat(toJS(this.alternativeOffers));

                    this.makeOffersDistinct(offers);
                }

                this.middleDate = newMiddleDate
                    ? newMiddleDate
                    : isSingleNoResult
                    ? (this.rootStore.searchStore.searchWhen.from as Date)
                    : getDate(selectedOffer.date);
                this.holidayDurationSingleSearch = isSingleNoResult
                    ? this.rootStore.searchStore.searchWhen.selectedNumberOfNights
                    : null;
                this.isLoadingAlternativeDates = false;
            });
        } catch (e) {
            logger.info(`Get price graph data error`);
            this.isLoadingError = true;
        } finally {
            runInAction(() => {
                this.isLoadingAlternativeDates = false;
            });
        }
    };

    @action rerenderMap = () => {
        this.mapRerenderTrigger = Math.random();
    };

    @action makeOffersDistinct(offers) {
        this.alternativeOffers = Array.from(new Set(offers.map(s => s.date))).map(id =>
            offers.find(s => s.date === id),
        ) as IAlternativeOffer[];
    }

    @action resetToInitial = () => {
        this.middleDate = this.rootStore.bookingStore.selectedOffer
            ? new Date(this.rootStore.bookingStore.selectedOffer.date)
            : null;
    };

    private get shouldDisplayPricesWithTouristTax(): boolean {
        return this.rootStore.layoutStore.isTouristTaxEnabled && this.rootStore.layoutStore.isHotelDetailsBookPage;
    }

    get totalPriceForSelectedDate(): number {
        return this.shouldDisplayPricesWithTouristTax
            ? this.rootStore.bookingStore.totalPriceWithTouristTax
            : this.rootStore.bookingStore.totalPrice;
    }

    isDataShouldBeLoaded = (dateForLoading: Date, isNext?: boolean): boolean => {
        let edgeDate;

        if (isNext === true) {
            edgeDate = addDays(7, dateForLoading);
        } else if (isNext === false) {
            edgeDate = new Date(dateForLoading);
            edgeDate.setDate(edgeDate.getDate() - 7);
        }

        return !this.isDataLoaded(edgeDate);
    };

    isDataLoaded = (date: Date): boolean => {
        const offer = this.alternativeOffers.find(offer => date.getTime() === new Date(offer.date).getTime());

        return !!offer;
    };

    @action resetMiddleDate = (date: Date) => {
        this.middleDate = date;
    };

    @action clearAlternativeOffers = () => {
        this.alternativeOffers = [];
    };
}
