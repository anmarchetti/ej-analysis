import { action, makeObservable, observable } from 'mobx';

import settings from 'code/settings';
import { TRootStore } from 'frontend/store/IStores';
import countDifferenceSave from 'frontend/utils/countDifferenceSafe';
import { areRoutesEqual, getOfferRoutesUniqueId } from 'frontend/utils/route.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IOffer } from 'models/data/IOffer';
import { ISelectOfferOnPriceGraphProps } from 'frontend/components/renderings/AlternativeFlights/AlternativeFlights';
import { getNewOfferForPriceGraph } from 'frontend/components/renderings/AlternativeFlights/AlternativeFlights.utils';

export class ComparePriceStore {
    @observable isDisplayed: boolean = false;
    @observable isLoadingError: boolean = false;
    @observable isLoadingOfferForNewDate: boolean = false;
    @observable showFlights: number = settings.AlternativeFlights.FirstPageFlightsNumber;
    @observable originalFlightsOrdering: string[] = [];
    @observable flightsList: IAlternativeOffer[] = [];

    constructor(public rootStore: TRootStore) {
        makeObservable(this);
    }

    get currentOffer(): IAlternativeOffer | undefined {
        if (this.rootStore.bookingStore.selectedOffer) {
            return this.rootStore.bookingStore.alternativeFlights.find(el =>
                areRoutesEqual(el, this.rootStore.bookingStore.selectedOffer!),
            );
        }

        return undefined;
    }

    get currentOfferPP(): number {
        return this.currentOffer ? this.currentOffer.pricePP : this.rootStore.bookingStore.selectedOffer!.pricePP;
    }

    @action setIsDisplayed = (value: boolean): void => {
        this.isDisplayed = value;
    };

    @action setIsLoadingError = (value: boolean): void => {
        this.isLoadingError = value;
    };

    @action setIsLoadingOfferForNewDate = (value: boolean): void => {
        this.isLoadingOfferForNewDate = value;
    };

    @action setShowFlights = (value: number): void => {
        this.showFlights = value;
    };

    @action setOriginalFlightsOrdering = (value: string[]): void => {
        this.originalFlightsOrdering = value;
    };

    @action selectOfferOnPriceGraph = async ({
        newDate,
        board,
        rooms,
        inboundRouteId,
        outboundRouteId,
        newAccommodationId,
        handleError,
    }: ISelectOfferOnPriceGraphProps): Promise<void> => {
        this.setIsLoadingOfferForNewDate(true);

        const alternativeFlights = await this.rootStore.bookingStore.loadAlternativeFlights({
            alternativeDate: newDate,
            boardCode: board,
            rooms,
            newAccommodationId,
            saveEmptyOffers: false,
            newInboundRouteId: inboundRouteId,
            newOutboundRouteId: outboundRouteId,
        });

        if (!alternativeFlights?.length) {
            handleError?.();
            this.setIsLoadingOfferForNewDate(false);

            return;
        }

        const newOffer = getNewOfferForPriceGraph(
            this.rootStore.alternativeFlightsStore.filterFlights(alternativeFlights),
            inboundRouteId,
            outboundRouteId,
        );
        const priceDifference = countDifferenceSave(newOffer.pricePP, this.currentOfferPP);

        await this.rootStore.bookingStore.changeFlight({
            offer: newOffer as IAlternativeOffer & IOffer,
            priceDiff: priceDifference,
            reloadOffer: true,
            isPriceGraphEventTarget: true,
            board,
            rooms,
            isExt: newOffer.accom.isExt,
            disableLoadAlternativeFlights: true,
        });

        this.rootStore.alternativeFlightsStore.clearSelectedFilters();
        this.resetOriginals();
        this.rootStore.priceGraphStore.rerenderMap();
        this.setShowFlights(settings.AlternativeFlights.FirstPageFlightsNumber);
        this.setIsLoadingOfferForNewDate(false);
    };

    @action resetOriginals = (): void => {
        const flightsToSort = [...this.rootStore.bookingStore.alternativeFlights];
        flightsToSort.sort((leftOffer: IOffer) => {
            const isOriginalFlight =
                this.rootStore.bookingStore.selectedOffer &&
                areRoutesEqual(this.rootStore.bookingStore.selectedOffer, leftOffer);

            return isOriginalFlight ? -1 : 1;
        });

        this.originalFlightsOrdering = flightsToSort.map(offer => getOfferRoutesUniqueId(offer));

        this.setFlights();
    };

    @action setFlights = (): void => {
        this.flightsList =
            this.rootStore.bookingStore.alternativeFlights.length > 0
                ? (this.originalFlightsOrdering
                      .map(id =>
                          this.rootStore.bookingStore.alternativeFlights.find(
                              offer => getOfferRoutesUniqueId(offer) === id,
                          ),
                      )
                      .filter(Boolean) as IAlternativeOffer[])
                : [];

        /** Exclude the first flight from filters, it's shown as a separate flight card */
        this.rootStore.alternativeFlightsStore.setFilterOptionsCounts(this.flightsList.slice(1));
    };
}
