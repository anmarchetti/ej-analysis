import { mockAmendDatesOfferWithPrice, mockBooking, mockSelectedSeats } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { IAmendDatesResponseItem } from 'models/data/bookingAmendment/AmendDates';

import AmendDatesSeats from './AmendDates.seats';
import { clearSeatSelectionFromOffer } from './AmendDatesStore.utils';

jest.mock('frontend/services/booking.service');

let amendDatesSeatsStore: AmendDatesSeats;
let rootStore: HolidaysRootStore;

jest.mock('frontend/utils/observerablePromise/observerablePromise.utils', () => ({
    observableFromPromise: jest.fn(cb => cb()),
}));

jest.mock('frontend/store/holidays/amend/amendDates/AmendDatesStore.utils');

describe('AmendDatesStore.seats', () => {
    beforeEach(() => {
        rootStore = {
            amendDatesStore: {
                booking: mockBooking,
                offerWithPrices: mockAmendDatesOfferWithPrice,
            },
            flightsPassengersStore: {
                setPassengersStore: jest.fn(),
            },
            seatMapStore: {
                fetchSeatMap: jest.fn(),
                clearValidatedSeats: jest.fn(),
            },
            amendPaymentStore: {
                isLoadingData: false,
            },
        } as unknown as HolidaysRootStore;

        amendDatesSeatsStore = new AmendDatesSeats(rootStore);
    });

    describe('checkForSeatsAvailability', () => {
        it('Should call all required methods inside', async () => {
            await amendDatesSeatsStore.checkForSeatsAvailability();

            expect(rootStore.flightsPassengersStore.setPassengersStore).toHaveBeenCalledWith({
                ...mockBooking,
                seatSelection: mockAmendDatesOfferWithPrice.offer.seatSelection,
            });
            expect(rootStore.seatMapStore.fetchSeatMap).toHaveBeenCalledWith(
                mockAmendDatesOfferWithPrice.offer!.transport.routes,
                mockAmendDatesOfferWithPrice.offer!.accom.prom,
            );
        });

        it('Should call fetchSeatMap with an empty array if no offerWithPrices routes available', async () => {
            rootStore.amendDatesStore.offerWithPrices = undefined;
            jest.spyOn(amendDatesSeatsStore, 'isDisabledBySitecore', 'get').mockReturnValueOnce(false);
            await amendDatesSeatsStore.checkForSeatsAvailability();

            expect(rootStore.seatMapStore.fetchSeatMap).toHaveBeenCalledWith([], undefined);
        });

        it('Should NOT be called when no booking assigned', async () => {
            rootStore.amendDatesStore.booking = undefined;

            await amendDatesSeatsStore.checkForSeatsAvailability();

            expect(rootStore.flightsPassengersStore.setPassengersStore).not.toHaveBeenCalled();
            expect(rootStore.seatMapStore.fetchSeatMap).not.toHaveBeenCalled();
        });

        it('Should NOT be called when amendment disabled by sitecore', async () => {
            jest.spyOn(amendDatesSeatsStore, 'isDisabledBySitecore', 'get').mockReturnValueOnce(true);

            await amendDatesSeatsStore.checkForSeatsAvailability();

            expect(rootStore.flightsPassengersStore.setPassengersStore).not.toHaveBeenCalled();
            expect(rootStore.seatMapStore.fetchSeatMap).not.toHaveBeenCalled();
        });
    });

    describe('setIsSeatMapShown', () => {
        it('Should set isSeatMapShown  to true', () => {
            expect(amendDatesSeatsStore.isSeatMapShown).toBe(false);

            amendDatesSeatsStore.setIsSeatMapShown(true);

            expect(amendDatesSeatsStore.isSeatMapShown).toBe(true);
        });
    });

    it('setIsSeatNoLongerAvailable should set isSeatNoLongerAvailable to true', () => {
        expect(amendDatesSeatsStore.isSeatNoLongerAvailable).toBe(false);

        amendDatesSeatsStore.setIsSeatNoLongerAvailable(true);

        expect(amendDatesSeatsStore.isSeatNoLongerAvailable).toBe(true);
    });

    it('setHasSeatsPriceChanged should set hasSeatsPriceChanged to true', () => {
        expect(amendDatesSeatsStore.hasSeatsPriceChanged).toBe(false);

        amendDatesSeatsStore.setHasSeatsPriceChanged(true);

        expect(amendDatesSeatsStore.hasSeatsPriceChanged).toBe(true);
    });

    describe('amendCTAState', () => {
        it('Should return isVisible as true', () => {
            expect(amendDatesSeatsStore.amendCTAState.isVisible).toBe(true);
        });

        it('Should return isVisible as false when the booking is disabled by sitecore', () => {
            jest.spyOn(amendDatesSeatsStore, 'isDisabledBySitecore', 'get').mockImplementationOnce(() => true);

            expect(amendDatesSeatsStore.amendCTAState.isVisible).toBe(false);
            expect(amendDatesSeatsStore.amendCTAState.isDisabled).toBe(false);
        });

        it('Should return isVisible as false when the seats reservation is disabled', () => {
            jest.spyOn(amendDatesSeatsStore, 'isDisabledBySitecore', 'get').mockImplementationOnce(() => false);
            rootStore.amendDatesStore.offerWithPrices!.offer.seatSelection![0].isSeatReservationPossible = false;

            expect(amendDatesSeatsStore.amendCTAState.isVisible).toBe(false);
        });

        it('Should return isVisible as false when seatMapStore.isSeatMapFailed is true', () => {
            rootStore.seatMapStore.isSeatMapFailed = true;

            expect(amendDatesSeatsStore.amendCTAState.isVisible).toBe(false);
        });
    });

    describe('isAmendCTAVisible', () => {
        it('Should return true', () => {
            jest.spyOn(amendDatesSeatsStore, 'amendCTAState', 'get').mockReturnValueOnce({ isVisible: true });
            expect(amendDatesSeatsStore.isAmendCTAVisible).toBe(true);
        });

        it('Should return false', () => {
            jest.spyOn(amendDatesSeatsStore, 'amendCTAState', 'get').mockReturnValueOnce({ isVisible: false });
            expect(amendDatesSeatsStore.isAmendCTAVisible).toBe(false);
        });
    });

    describe('clearStore', () => {
        it('Should call everything inside', () => {
            amendDatesSeatsStore.rootStore.seatMapStore.isSeatMapFailed = true;
            amendDatesSeatsStore.setIsSeatMapShown = jest.fn();
            amendDatesSeatsStore.setIsSeatNoLongerAvailable = jest.fn();

            amendDatesSeatsStore.clearStore();

            expect(amendDatesSeatsStore.setIsSeatMapShown).toHaveBeenCalledWith(false);
            expect(amendDatesSeatsStore.rootStore.seatMapStore.isSeatMapFailed).toBe(false);
            expect(amendDatesSeatsStore.setIsSeatNoLongerAvailable).toHaveBeenCalledWith(false);
        });
    });

    describe('isDisabledBySitecore', () => {
        it('Should return true', () => {
            rootStore.amendDatesStore.offerWithPrices!.seatsChangeEnabled = false;

            expect(amendDatesSeatsStore.isDisabledBySitecore).toBe(true);
        });

        it('Should return false', () => {
            rootStore.amendDatesStore.offerWithPrices!.seatsChangeEnabled = true;

            expect(amendDatesSeatsStore.isDisabledBySitecore).toBe(false);
        });
    });

    describe('handleSelectSeats', () => {
        beforeEach(() => {
            amendDatesSeatsStore.setIsSeatMapShown = jest.fn();
            window.SeatsMapWidget = { clearAllSeats: jest.fn() };
        });

        it('Should call bookingService.getAmendDatesValidatedOffer, handle isSeatMapShown prop and call setPassengersStore', async () => {
            const mockedOffer = {
                ...rootStore.amendDatesStore.offerWithPrices,
                offer: { ...rootStore.amendDatesStore.offerWithPrices!.offer, seatSelection: mockSelectedSeats },
            };
            jest.mocked(bookingService.getAmendDatesValidatedOffer).mockResolvedValue(
                mockedOffer as IAmendDatesResponseItem,
            );
            amendDatesSeatsStore.isSeatMapShown = true;

            await amendDatesSeatsStore.handleSelectSeats(mockSelectedSeats, jest.fn());

            expect(bookingService.getAmendDatesValidatedOffer).toHaveBeenCalledWith(
                rootStore.amendDatesStore.offerWithPrices,
            );
            expect(rootStore.amendDatesStore.offerWithPrices).toStrictEqual(mockedOffer);
            expect(rootStore.flightsPassengersStore.setPassengersStore).toHaveBeenCalledWith({
                ...rootStore.amendDatesStore.booking,
                seatSelection: mockSelectedSeats,
            });
            expect(amendDatesSeatsStore.setIsSeatMapShown).toHaveBeenCalledWith(false);
        });

        it('Should NOT call bookingService.getAmendDatesValidatedOffer and set isSeatMapShown to false when no offerWithPrices', async () => {
            rootStore.amendDatesStore.offerWithPrices = undefined;

            await amendDatesSeatsStore.handleSelectSeats(mockSelectedSeats, jest.fn());

            expect(bookingService.getAmendDatesValidatedOffer).not.toHaveBeenCalled();
        });

        it('Should set iSeatNoLongerAvailable and clear seats when isSeatsUnavailable', async () => {
            jest.mocked(bookingService.getAmendDatesValidatedOffer).mockResolvedValue({
                ...rootStore.amendDatesStore.offerWithPrices,
                isSeatsUnavailable: true,
            } as IAmendDatesResponseItem);

            await amendDatesSeatsStore.handleSelectSeats(mockSelectedSeats, jest.fn());

            expect(amendDatesSeatsStore.isSeatNoLongerAvailable).toBe(true);
            expect(window.SeatsMapWidget.clearAllSeats).toHaveBeenCalled();
            expect(amendDatesSeatsStore.rootStore.seatMapStore.clearValidatedSeats).toHaveBeenCalled();
            expect(rootStore.flightsPassengersStore.setPassengersStore).not.toHaveBeenCalled();
            expect(amendDatesSeatsStore.setIsSeatMapShown).not.toHaveBeenCalled();
        });

        it('Should set hasSeatsPriceChanged and clear seats when isSeatsPriceChanged', async () => {
            jest.mocked(bookingService.getAmendDatesValidatedOffer).mockResolvedValue({
                ...rootStore.amendDatesStore.offerWithPrices,
                isSeatsPriceChanged: true,
            } as IAmendDatesResponseItem);

            await amendDatesSeatsStore.handleSelectSeats(mockSelectedSeats, jest.fn());

            expect(amendDatesSeatsStore.hasSeatsPriceChanged).toBe(true);
            expect(window.SeatsMapWidget.clearAllSeats).toHaveBeenCalled();
            expect(amendDatesSeatsStore.rootStore.seatMapStore.clearValidatedSeats).toHaveBeenCalled();
            expect(rootStore.flightsPassengersStore.setPassengersStore).not.toHaveBeenCalled();
            expect(amendDatesSeatsStore.setIsSeatMapShown).not.toHaveBeenCalled();
        });

        it('Should call handleError when error', async () => {
            const error = new Error('message');
            jest.mocked(bookingService.getAmendDatesValidatedOffer).mockRejectedValue(error);
            const handleError = jest.fn();

            await amendDatesSeatsStore.handleSelectSeats(mockSelectedSeats, handleError);

            expect(handleError).toHaveBeenCalledWith(error);
        });
    });

    describe('handleContinueWithoutSeats', () => {
        it('Should call clearSelectionFromOffer and set isSeatNoLongerAvailable to false, and revalidate offer without seats', async () => {
            const offerWithoutSeats = {
                ...mockAmendDatesOfferWithPrice,
                offer: { ...mockAmendDatesOfferWithPrice.offer, seatSelection: [] },
            };
            amendDatesSeatsStore.rootStore.amendDatesStore.offerWithPrices = mockAmendDatesOfferWithPrice;
            jest.mocked(clearSeatSelectionFromOffer).mockReturnValue(offerWithoutSeats);
            jest.mocked(bookingService.getAmendDatesValidatedOffer).mockResolvedValue(offerWithoutSeats);

            await amendDatesSeatsStore.handleContinueWithoutSeats();

            expect(amendDatesSeatsStore.isSeatNoLongerAvailable).toBe(false);
            expect(clearSeatSelectionFromOffer).toHaveBeenCalledWith(mockAmendDatesOfferWithPrice);
            expect(bookingService.getAmendDatesValidatedOffer).toHaveBeenCalledWith(offerWithoutSeats);
            expect(amendDatesSeatsStore.rootStore.amendDatesStore.offerWithPrices).toStrictEqual(offerWithoutSeats);
            expect(amendDatesSeatsStore.rootStore.amendPaymentStore.isLoadingData).toBe(false);
        });
    });
});
