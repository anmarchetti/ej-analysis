import { createMockStores } from 'frontend/__mocks__';
import { AmendEventActions } from 'models/data/tracking/AmendEvent';

import { TrackingChangeFeeStore } from './TrackingStore.changeFee';

describe('Tracking Store for Change fees', () => {
    let mockRootStore;
    let trackingChangeFeeStore: TrackingChangeFeeStore;

    beforeEach(() => {
        mockRootStore = createMockStores({
            layoutStore: {
                isAmendTransfersPage: false,
                isAmendFlightsPage: false,
                isAmendDatesSummaryPage: false,
                isAmendRoomAndBoardPage: true,
            },
            trackingStore: {
                buildCoreParamsObject: jest.fn(() => ({
                    coreParams: 'coreParams',
                })),
                generateGenericValuesWithGuests: jest.fn(() => ({
                    customPrams: 'customPrams',
                    genericValue4: 'genericValue4',
                })),
                addToDataLayer: jest.fn(),
            },
        });
        trackingChangeFeeStore = new TrackingChangeFeeStore(mockRootStore);
    });

    describe('changeFeeBannerAppearedAction', () => {
        const mockSetSessionStorage = jest.fn();
        const mockGetSessionStorage = jest.fn();

        Object.defineProperty(window, 'sessionStorage', {
            value: {
                setItem: mockSetSessionStorage,
                getItem: mockGetSessionStorage,
            },
            writable: true,
        });

        it('should call addToDataLayer when feePrice is passed, coreParams and eventAction are determinated and banner was not viewed', () => {
            jest.spyOn(trackingChangeFeeStore, 'getAmendEventAction').mockReturnValueOnce(
                AmendEventActions.ChangeBoard,
            );
            trackingChangeFeeStore.changeFeeBannerAppearedAction(50);

            expect(trackingChangeFeeStore.getAmendEventAction).toHaveBeenCalled();
            expect(mockRootStore.trackingStore.buildCoreParamsObject).toHaveBeenCalled();
            expect(mockGetSessionStorage).toHaveBeenCalledWith('fee_amend_Change Board_genericValue4');
            expect(mockSetSessionStorage).toHaveBeenCalledWith('fee_amend_Change Board_genericValue4', 'TRUE');
            expect(mockRootStore.trackingStore.generateGenericValuesWithGuests).toHaveBeenCalledWith({
                genericValue1: 50,
                genericValue2: null,
                destinationUrl: null,
            });
            expect(mockRootStore.trackingStore.addToDataLayer).toHaveBeenCalledWith({
                event: 'generic_event',
                coreParams: { coreParams: 'coreParams', pageName: 'undefined: undefined' },
                customParams: { customPrams: 'customPrams', genericValue4: 'genericValue4' },
                eventParams: {
                    eventCategory: 'Holidays',
                    eventAction: 'Change Board',
                    eventLabel: 'Change Fees Banner',
                    eventType: 'nonInteraction',
                },
            });
        });

        it('should NOT call addToDataLayer when core parameters in null', () => {
            jest.spyOn(mockRootStore.trackingStore, 'buildCoreParamsObject').mockReturnValueOnce(null);

            trackingChangeFeeStore.changeFeeBannerAppearedAction(50);

            expect(mockRootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled;
        });

        it('should NOT call addToDataLayer when no feePrice', () => {
            trackingChangeFeeStore.changeFeeBannerAppearedAction();

            expect(mockRootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled;
            expect(mockRootStore.trackingStore.buildCoreParamsObject).not.toHaveBeenCalled;
            expect(trackingChangeFeeStore.getAmendEventAction).not.toHaveBeenCalled;
            expect(mockSetSessionStorage).not.toHaveBeenCalled;
            expect(mockGetSessionStorage).not.toHaveBeenCalled;
        });

        it('should NOT call addToDataLayer when no eventAction', () => {
            jest.spyOn(trackingChangeFeeStore, 'getAmendEventAction').mockReturnValueOnce('');

            expect(mockRootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled;
        });

        it('should NOT call addToDataLayer when banner has already been seen', () => {
            mockGetSessionStorage.mockReturnValueOnce('TRUE');

            expect(mockRootStore.trackingStore.addToDataLayer).not.toHaveBeenCalled;
        });
    });

    describe('getAmendEventAction', () => {
        it('should return event for change flights', () => {
            mockRootStore.layoutStore.isAmendFlightsPage = true;

            const result = trackingChangeFeeStore.getAmendEventAction();

            expect(result).toBe(AmendEventActions.ChangeFlight);
        });

        it('should return event for change dates', () => {
            mockRootStore.layoutStore.isAmendDatesSummaryPage = true;

            const result = trackingChangeFeeStore.getAmendEventAction();

            expect(result).toBe(AmendEventActions.ChangeDates);
        });

        it('should return event for change room and boards', () => {
            mockRootStore.layoutStore.isAmendRoomAndBoardPage = true;

            const result = trackingChangeFeeStore.getAmendEventAction();

            expect(result).toBe(AmendEventActions.ChangeBoard);
        });

        it('should return an empty string by default', () => {
            mockRootStore.layoutStore.isAmendRoomAndBoardPage = false;

            const result = trackingChangeFeeStore.getAmendEventAction();

            expect(result).toBe('');
        });
    });
});
