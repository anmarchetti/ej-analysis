import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';

import { CurrencyCode } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import comparePricesCalendarService from 'frontend/services/comparePricesCalendar.service';
import { logger } from 'frontend/services/logging';
import { ComparePriceStore } from 'frontend/store/base/comparePrice/ComparePriceStore';
import { TRootStore } from 'frontend/store/IStores';
import { formatDateL10n, getDate } from 'frontend/utils/date.utils';
import { buildRoomAllocationFromOfferUnitParams, getAccommodationIdsString } from 'frontend/utils/url.utils';
import { IAlternativeOffer, IAlternativeOffers } from 'models/data/IAlternativeOffers';
import { IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { IAlterationResults } from 'frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer';

export enum FreeForKidsChangeState {
    Removed = 'removed',
    Gained = 'gained',
    Stable = 'stable',
}

export enum NewOfferState {
    Error = 'error',
    Accepted = 'accepted',
    NoChange = 'no change',
}

export class ComparePricesCalendarStore extends ComparePriceStore {
    @observable alternativeOffers: IAlternativeOffer[] = [];
    @observable isLoadingAlternativeDates: boolean = false;
    @observable mapRerenderTrigger: number = Math.random();
    @observable bestPriceOffers: Map<number, IAlternativeOffer> = new Map();
    @observable newOfferState: NewOfferState = NewOfferState.NoChange;

    constructor(public rootStore: TRootStore) {
        super(rootStore);

        makeObservable(this);
    }

    @computed get currency(): CurrencyCode | undefined {
        return this.alternativeOffers?.length > 0
            ? this.alternativeOffers[0].currency?.code
            : this.rootStore.bookingStore.currency;
    }

    @computed get alternativeOffersMap(): Map<number, IAlternativeOffer> {
        const offersMap = new Map();

        this.alternativeOffers.forEach(offer => offersMap.set(getDate(offer.date).getTime(), offer));

        return offersMap;
    }

    @action setNewOfferState = (value: NewOfferState): void => {
        this.newOfferState = value;
    };

    @action handleNewOfferError = (): void => {
        if (this.newOfferState !== NewOfferState.NoChange && !this.rootStore.layoutStore.isHotelDetailsBookPage) {
            this.setNewOfferState(NewOfferState.NoChange);
        }
    };

    getAlternativeOfferPrice = (offer: IAlternativeOffer | undefined): number => offer?.price ?? 0;

    getAlternativeAndSelectedOffersInfo = (date: Date): { items: IUnit[]; offer: IAlternativeOffer | undefined } => {
        const offer = this.alternativeOffersMap.get(date.getTime());

        const { unit: items } = this.rootStore.bookingStore.selectedOffer?.accom ?? { unit: [] as IUnit[] };

        return { offer, items };
    };

    freeForKidsChangeState = (offer: IAlternativeOffer | undefined, items: IUnit[]): FreeForKidsChangeState => {
        if (!offer?.rooms || !items) {
            return FreeForKidsChangeState.Stable;
        }

        const selectedFreeForKids = items.map(({ isFreeForKids }) => isFreeForKids).join('');
        const alternativeOfferFreeForKids = offer.rooms.map(({ isFreeForKids }) => isFreeForKids).join('');

        if (selectedFreeForKids.length < alternativeOfferFreeForKids.length) {
            return FreeForKidsChangeState.Removed;
        }

        if (selectedFreeForKids.length > alternativeOfferFreeForKids.length) {
            return FreeForKidsChangeState.Gained;
        }

        return FreeForKidsChangeState.Stable;
    };

    getBoardAlteration = (
        offer: IAlternativeOffer | undefined,
        items: IUnit[],
        title?: ISitecoreField<string>,
        subtitle?: ISitecoreField<string>,
        text?: ISitecoreField<string>,
    ): IAlterationResults[] => {
        if (offer?.boardType && items[0].boardType && offer?.board !== items[0].board) {
            return [
                {
                    items: [
                        {
                            oldItemImgSrc: items[0].boardType.iconUrl,
                            oldItemName: items[0].boardType.title,
                            newItem: {
                                item: offer?.boardType,
                            },
                        },
                    ],
                    title: title,
                    subtitle: subtitle,
                    text: text,
                    isBoardAlteration: true,
                },
            ];
        }

        return [];
    };

    getRoomAlterations = (
        offer: IAlternativeOffer | undefined,
        items: IUnit[],
        title?: ISitecoreField<string>,
        subtitle?: ISitecoreField<string>,
        text?: ISitecoreField<string>,
    ): IAlterationResults[] => {
        const rooms: IAlterationResults[] = [
            {
                items: [],
                title: title,
                subtitle: subtitle,
                text: text,
                isBoardAlteration: false,
            },
        ];

        items.forEach((item, idx) => {
            if (offer?.rooms?.length && item.roomType.code !== offer?.rooms?.[idx]?.roomType?.code) {
                rooms[0].items.push({
                    isKidsPlaceWilBeRemoved: false,
                    oldItemImgSrc: item.roomType.images?.[0]?.small,
                    oldItemName:
                        typeof item.roomType.title === 'string' ? item.roomType.title : item.roomType.title.value,
                    newItem: {
                        item: offer?.rooms?.[idx],
                        roomIdx: idx,
                    },
                });
            }
        });

        return rooms[0].items.length ? rooms : [];
    };

    changesRequired = (
        offer: IAlternativeOffer | undefined,
        items: IUnit[],
        date: Date,
        isFreeKidsChangeDisabled: boolean = false,
    ): boolean => {
        if (!offer || !items) return false;

        const isBoardChange = !!this.getBoardAlteration(offer, items).length;
        const isRoomChange = !!this.getRoomAlterations(offer, items).length;
        const isFreeKidsChange = isFreeKidsChangeDisabled
            ? false
            : this.freeForKidsChangeState(offer, items) === FreeForKidsChangeState.Removed;

        return (
            (isBoardChange || isRoomChange || isFreeKidsChange) &&
            formatDateL10n(date, DATE_FORMATS.dateWithTime) !== this.rootStore.bookingStore.selectedOffer?.date
        );
    };

    private callLoadAlternativeOffers = (
        selectedOffer: IOfferWithoutAltBoards,
        startDate: Date,
        endDate: Date,
    ): Promise<IAlternativeOffers> =>
        comparePricesCalendarService.loadAlternativeOffers(
            this.rootStore.searchStore.searchWhen.from as Date,
            startDate,
            endDate,
            0,
            selectedOffer.stay,
            this.rootStore.alternativeFlightsStore.departureAirportsQuery,
            buildRoomAllocationFromOfferUnitParams(selectedOffer.accom.unit),
            getAccommodationIdsString(this.rootStore.queryParamsStore),
            this.rootStore.bookingStore.boardTypeCode,
            this.rootStore.alternativeFlightsStore.selectedOutboundDepTimes,
            this.rootStore.alternativeFlightsStore.selectedInboundDepTimes,
            this.rootStore.layoutStore.isCheapestComparePriceOption,
        );

    @action loadAlternativeOffers = async (start?: Date, end?: Date) => {
        try {
            const selectedOffer = this.rootStore.bookingStore.selectedOffer;

            if (!selectedOffer) {
                return;
            }

            if (!this.isNeedLoadOffers(start, end)) {
                return;
            }

            this.isLoadingAlternativeDates = true;

            let result;

            if (this.alternativeOffers.length) {
                result = await this.callLoadAlternativeOffers(selectedOffer, start as Date, end as Date);
            } else {
                const dates = this.getDatesForFirstLoading(new Date(selectedOffer.date));

                result = await Promise.all(
                    dates.map(interval => this.callLoadAlternativeOffers(selectedOffer, interval[0], interval[1])),
                );
            }

            runInAction(() => {
                if (result.length) {
                    /**if results is array it means initial loading was performed */
                    const offers = result.length === 2 ? result[0].offers.concat(result[1].offers) : result[0].offers;
                    this.alternativeOffers = offers;
                    this.updateBestPriceOffers(toJS(this.alternativeOffers));
                } else if (
                    this.alternativeOffers.length &&
                    new Date(this.alternativeOffers[this.alternativeOffers.length - 1].date).getTime() <
                        new Date(result.offers[0].date).getTime()
                ) {
                    /**next dates were loaded */
                    this.alternativeOffers = toJS(this.alternativeOffers).concat(result.offers);
                    this.updateBestPriceOffers(result.offers);
                } else {
                    /**previous dates were loaded */
                    this.alternativeOffers = result.offers.concat(toJS(this.alternativeOffers));
                    this.updateBestPriceOffers(result.offers);
                }
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

    getDatesForFirstLoading = (selectedOfferDate: Date) => {
        if (this.rootStore.appStore.isScreenMedium) {
            const leftEndDate = new Date(selectedOfferDate.getFullYear(), selectedOfferDate.getMonth() + 1, 0);
            const leftStartDate = new Date(leftEndDate.getFullYear(), leftEndDate.getMonth() - 1, 1);

            const rightStartDate = new Date(selectedOfferDate.getFullYear(), selectedOfferDate.getMonth() + 1, 1);
            const rightEndDate = new Date(rightStartDate.getFullYear(), rightStartDate.getMonth() + 2, 0);

            return [
                [leftStartDate, leftEndDate],
                [rightStartDate, rightEndDate],
            ];
        }

        const startDate = new Date(selectedOfferDate.getFullYear(), selectedOfferDate.getMonth() - 1, 1);

        const endDate = new Date(selectedOfferDate.getFullYear(), selectedOfferDate.getMonth() + 2, 0);

        return [[startDate, endDate]];
    };

    isNeedLoadOffers = (startDate?: Date, endDate?: Date) =>
        (!this.alternativeOffers.length && !startDate && !endDate) ||
        (this.alternativeOffers.length &&
            startDate &&
            endDate &&
            this.alternativeOffers[0] &&
            (new Date(this.alternativeOffers[0].date).getTime() > startDate.getTime() ||
                new Date(this.alternativeOffers[this.alternativeOffers.length - 1].date).getTime() <
                    endDate.getTime()));

    @action updateBestPriceOffers = (offers: IAlternativeOffer[]) => {
        const allOffers = offers;

        while (allOffers.length > 0) {
            const monthStartDate = new Date(allOffers[0].date);
            const monthEndDateIdx = allOffers.findIndex(
                item => new Date(item.date).getMonth() !== monthStartDate.getMonth(),
            );

            const monthOffers = monthEndDateIdx >= 0 ? allOffers.splice(0, monthEndDateIdx) : allOffers.splice(0);

            const prices = monthOffers
                .filter(offer => offer.price && offer.price > 0)
                .map(offer => offer.price) as number[];
            const bestPrice = Math.min.apply(null, prices);

            const offerthWithBestPrice = monthOffers.filter(offer => offer.price === bestPrice);
            offerthWithBestPrice.forEach(offer => this.bestPriceOffers.set(getDate(offer.date).getTime(), offer));
        }
    };

    @action rerenderMap = () => {
        this.mapRerenderTrigger = Math.random();
    };

    @action resetToInitial = () => {
        this.alternativeOffers = [];
        this.bestPriceOffers = new Map();
    };
}
