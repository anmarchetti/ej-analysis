import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';

import { AmendPassengersTrackingStore } from './AmendPassengersTrackingStore';

jest.mock('frontend/utils/tracking/tracking.utils', () => ({
    __esModule: true,
    getTimestamp: () => '2023-05-18_13:30:46',
}));

const trackingMockStore = new AmendPassengersTrackingStore({
    addToDataLayer: jest.fn(),
    buildCoreParamsObject: jest.fn(() => ({
        coreParams: 'coreParams',
    })) as any,
    getPageLoadObject: jest.fn(() => ({
        pageName: 'pageName',
    })) as any,
    getCurrentPageName: jest.fn(() => 'currentPage'),
} as any) as any;

describe('AmendPassengersTrackingStore', () => {
    it('clickToAmendPassengerPageLink', () => {
        trackingMockStore.clickToAmendPassengerPageLink('123456');

        expect(trackingMockStore.addToDataLayer).toHaveBeenCalledWith({
            event: EventTypes.GenericEvent,
            coreParams: { coreParams: 'coreParams' },
            customParams: {
                genericValue1: null,
                genericValue2: null,
                genericValue3: null,
                genericValue4: '123456',
            },
            eventParams: {
                eventCategory: EventCategories.Holidays,
                eventAction: EventActions.ViewBooking,
                eventType: EventTypes.Interaction,
                eventLabel: 'Edit Passenger Details',
            },
        });
    });

    it('clickToEditPassenger', () => {
        trackingMockStore.clickToEditPassenger('456789');
        expect(trackingMockStore.addToDataLayer).toHaveBeenCalledWith({
            event: EventTypes.GenericEvent,
            coreParams: { coreParams: 'coreParams' },
            customParams: {
                genericValue1: null,
                genericValue2: null,
                genericValue3: null,
                genericValue4: '456789',
            },
            eventParams: {
                eventCategory: EventCategories.Holidays,
                eventAction: EventActions.ViewBooking,
                eventType: EventTypes.Interaction,
                eventLabel: 'Edit Passenger Details',
            },
        });
    });

    it('onSavePassengerDetails', () => {
        trackingMockStore.onSavePassengerDetails('456789', 3);
        expect(trackingMockStore.addToDataLayer).toHaveBeenCalledWith({
            event: EventTypes.GenericEvent,
            coreParams: { coreParams: 'coreParams' },
            customParams: {
                genericValue1: '3 Characters',
                genericValue2: 'Free',
                genericValue3: null,
                genericValue4: '456789',
            },
            eventParams: {
                eventCategory: EventCategories.Holidays,
                eventAction: EventActions.ViewBooking,
                eventType: EventTypes.Interaction,
                eventLabel: 'Save Passenger Details',
            },
        });
    });

    it('onShowExceedCharactersCountError', () => {
        trackingMockStore.onShowExceedCharactersCountError('Error message');
        expect(trackingMockStore.addToDataLayer).toHaveBeenCalledWith({
            event: EventTypes.ValidationMessage,
            dimension13: '2023-05-18_13:30:46',
            dimension93: 'Change Name: Character Limited Exceeded',
            dimension94: 'Error message',
            dimension136: 'pageName',
        });
    });

    it('onCommitPassengersNameChangeError', () => {
        trackingMockStore.onCommitPassengersNameChangeError('Error message', 400);
        expect(trackingMockStore.addToDataLayer).toHaveBeenCalledWith({
            event: EventTypes.ErrorMessage,
            dimension13: '2023-05-18_13:30:46',
            dimension86: 400,
            dimension87: 'Error message',
            dimension136: 'pageName',
        });
    });

    it('onUnSavedPassengerNotify', () => {
        trackingMockStore.onUnSavedPassengerNotify('Error message');
        expect(trackingMockStore.addToDataLayer).toHaveBeenCalledWith({
            event: EventTypes.ErrorMessage,
            dimension13: '2023-05-18_13:30:46',
            dimension86: null,
            dimension87: 'Error message',
            dimension136: 'pageName',
        });
    });
});
