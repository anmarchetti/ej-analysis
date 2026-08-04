import { CancelTokenSource } from 'axios';
import { action, makeObservable, observable } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import { getAmendmentItemsFromAlternativeOffers } from 'frontend/store/holidays/amend/amendDates/AmendDatesStore.utils';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { checkForEqualTransports } from 'frontend/utils/route.utils';
import { IAmendDatesResponseItem } from 'models/data/bookingAmendment/AmendDates';
import { IAmendTransport } from 'models/data/IAmendBookingFlights';
import { IOffer } from 'models/data/IOffer';

class AmendDatesFlights {
    @observable flightOffers: IAmendDatesResponseItem[] = [];
    @observable noAvailableFlightOffers: boolean = false;
    protected validatedFlightOffers: IAmendDatesResponseItem[] = [];

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    protected updateValidatedFlightOffers = (validatedOffers: IAmendDatesResponseItem[]): void => {
        const previouslyValidatedOffers = this.validatedFlightOffers.filter(
            amendDatesOffer =>
                !validatedOffers.find(offer =>
                    checkForEqualTransports(amendDatesOffer.offer.transport, offer.offer.transport),
                ),
        );

        this.validatedFlightOffers = [...previouslyValidatedOffers, ...validatedOffers];
    };

    @action getValidatedFlightsAndUpdateOffers = async (
        flightsToValidate: IOffer[],
        cancelSource?: CancelTokenSource,
    ): Promise<IAmendTransport[]> => {
        const flightsToValidateWithAmendPrices = getAmendmentItemsFromAlternativeOffers(
            flightsToValidate,
            this.flightOffers,
        );
        const amendDatesOffers = await bookingService.getAmendDatesValidatedFlights(
            flightsToValidateWithAmendPrices,
            cancelSource,
        );

        // Save validated offers to amend dates flight store to use in submission of flight change
        this.updateValidatedFlightOffers(amendDatesOffers);

        // Map back to alternative flights shape
        return this.getAlternativeFlightsFromAmendDatesOffers(amendDatesOffers);
    };

    @action getAlternativeFlightsFromAmendDatesOffers = (offers: IAmendDatesResponseItem[]): IAmendTransport[] =>
        offers.map(offer => this.getAlternativeFlightFromAmendDatesOffer(offer));

    getAlternativeFlightFromAmendDatesOffer = (offer: IAmendDatesResponseItem): IAmendTransport => ({
        amendmentCharges: offer.amendmentFlowCharges,
        routes: offer.offer.transport.routes,
        packagePrice: offer.offer.price,
        packagePricePP: offer.offer.pricePP,
        promoCodeBreakDown: offer.promoCodeBreakDown,
        errataFlightInfo: offer.offer.transport.errataFlightInfo,
    });

    @action getChangeDateAmendFlightsOffers = async (): Promise<IOffer[]> => {
        if (!this.rootStore.amendDatesStore.booking || !this.rootStore.amendDatesStore.offerWithPrices) {
            return [];
        }

        const response = await bookingService.getAmendDatesFlightsOptions(
            this.rootStore.amendDatesStore.offerWithPrices,
        );

        //Backend could send empty responce with successful status
        if (!response?.length) {
            return [];
        }

        // Store amend dates offers as we need the data for /validate call later
        this.flightOffers = response;

        return response.map(({ offer }) => offer);
    };

    @action submitFlightChangeSelection = (selectedFlight: IAmendTransport): void => {
        const { haveChosenSeatsBeenDropped } = this.rootStore.amendFlightsStore;

        if (haveChosenSeatsBeenDropped) {
            return;
        }

        const selectedOffer = this.validatedFlightOffers.find(amendDatesOffer =>
            checkForEqualTransports(amendDatesOffer.offer.transport, selectedFlight),
        );

        if (selectedOffer) {
            this.rootStore.amendDatesStore.offerWithPrices = selectedOffer;

            this.rootStore.routerStore.redirectToAmendDatesSummaryPage();
        }
    };

    @action setNoAvailableFlightOffers = (state: boolean): void => {
        this.noAvailableFlightOffers = state;
    };

    @action clearStore = (): void => {
        this.validatedFlightOffers = [];
        this.flightOffers = [];
        this.setNoAvailableFlightOffers(false);
    };
}

export default AmendDatesFlights;
