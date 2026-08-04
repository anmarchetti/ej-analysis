import { IFlattenedSpecialRequest } from 'models/data/SpecialRequest';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';

import { SpecialRequestsTrackingStore } from './SpecialRequestsTrackingStore';

const specialRequests = [
    {
        code: 'SR1',
        displayName: 'SR1',
        name: 'Name1',
        groupCode: 'groupCode1',
    },
    {
        code: 'SR2',
        displayName: 'SR2',
        name: 'Name2',
        groupCode: 'groupCode2',
    },
];
const flattenedRequests: IFlattenedSpecialRequest[] = [
    { ...specialRequests[0], name: specialRequests[0].displayName, isSelected: true },
    { ...specialRequests[1], name: specialRequests[1].displayName, isSelected: true },
];

let store;

describe('SpecialRequestsTrackingStore', () => {
    beforeEach(() => {
        store = new SpecialRequestsTrackingStore({
            addToDataLayer: jest.fn(),
            buildCoreParamsObject: jest.fn(),
        } as any);
        store.pushSRToDataLayer = jest.fn();
    });

    it('buildBaseDimensions', () => {
        const baseParams = store.buildBaseDimensions('bookingRef', specialRequests);

        expect(JSON.stringify(baseParams)).toBe(
            JSON.stringify({
                customParams: {
                    genericValue1: 'SR1 | SR2',
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: 'bookingRef',
                },
                eventParams: {
                    eventCategory: EventCategories.SpecialServiceRequest,
                    eventAction: EventActions.RequestSpecialService,
                    eventType: EventTypes.Interaction,
                },
            }),
        );
    });

    it('pushSRToDataLayer', () => {
        const mockAddToDataLayer = jest.fn();
        const store = new SpecialRequestsTrackingStore({
            addToDataLayer: mockAddToDataLayer,
            buildCoreParamsObject: jest.fn(() => ({})),
        } as any);
        store.openSpecialRequests('bookingID');

        expect(mockAddToDataLayer).toHaveBeenCalledWith({
            event: EventTypes.GenericEvent,
            coreParams: {},
            customParams: {
                genericValue1: 'NONE',
                genericValue4: 'bookingID',
                genericValue2: null,
                genericValue3: null,
            },
            eventParams: {
                eventCategory: EventCategories.SpecialServiceRequest,
                eventAction: EventActions.RequestSpecialService,
                eventLabel: 'Amend',
                eventType: EventTypes.Interaction,
            },
        });
    });

    it('openEmptySpecialRequests', () => {
        store.openSpecialRequests('bookingID');

        expect(store.pushSRToDataLayer).toHaveBeenCalledWith(
            {
                genericValue1: 'NONE',
                genericValue4: 'bookingID',
                genericValue2: null,
                genericValue3: null,
            },
            {
                eventCategory: EventCategories.SpecialServiceRequest,
                eventAction: EventActions.RequestSpecialService,
                eventLabel: 'Amend',
                eventType: EventTypes.Interaction,
            },
        );
    });

    it('addNewSRToEmptySpecialRequests', () => {
        store.toggleClickSRToSpecialRequests('bookingID', [], 'specialRequest');

        expect(store.pushSRToDataLayer).toHaveBeenCalledWith(
            {
                genericValue1: 'NONE',
                genericValue4: 'bookingID',
                genericValue2: 'specialRequest',
                genericValue3: null,
            },
            {
                eventAction: EventActions.SpecialServiceRequest,
                eventCategory: EventCategories.Holidays,
                eventLabel: 'Add',
                eventType: EventTypes.Interaction,
            },
        );
    });

    it('openHasSpecialRequests', () => {
        store.openSpecialRequests('', specialRequests);
        expect(store.pushSRToDataLayer).toHaveBeenCalledTimes(0);

        store.openSpecialRequests('bookingID', specialRequests);

        expect(store.pushSRToDataLayer).toHaveBeenCalledWith(
            {
                genericValue1: 'SR1 | SR2',
                genericValue4: 'bookingID',
                genericValue2: null,
                genericValue3: null,
            },
            {
                eventCategory: EventCategories.SpecialServiceRequest,
                eventAction: EventActions.RequestSpecialService,
                eventLabel: 'Amend',
                eventType: EventTypes.Interaction,
            },
        );
    });

    it('addNewSRToHasSpecialRequests', () => {
        store.toggleClickSRToSpecialRequests('bookingID', specialRequests, 'SR3');

        expect(store.pushSRToDataLayer).toHaveBeenCalledWith(
            {
                genericValue1: 'SR1 | SR2',
                genericValue4: 'bookingID',
                genericValue2: 'SR3',
                genericValue3: null,
            },
            {
                eventAction: EventActions.SpecialServiceRequest,
                eventCategory: EventCategories.Holidays,
                eventLabel: 'Add',
                eventType: EventTypes.Interaction,
            },
        );
    });

    it('removeSRInHasSpecialRequests', () => {
        store.removeSRInHasSpecialRequests('');
        expect(store.pushSRToDataLayer).toHaveBeenCalledTimes(0);

        store.removeSRInHasSpecialRequests('bookingID', specialRequests, 'SR3');

        expect(store.pushSRToDataLayer).toHaveBeenCalledWith(
            {
                genericValue1: 'SR1 | SR2',
                genericValue4: 'bookingID',
                genericValue3: 'SR3',
                genericValue2: null,
            },
            {
                eventAction: EventActions.SpecialServiceRequest,
                eventCategory: EventCategories.Holidays,
                eventLabel: 'Removed',
                eventType: EventTypes.Interaction,
            },
        );
    });

    it('contradictionToggleSpecialRequests', () => {
        store.contradictionToggleSpecialRequests('');
        expect(store.pushSRToDataLayer).toHaveBeenCalledTimes(0);

        store.toggleClickSRToSpecialRequests = jest.fn();
        store.contradictionSRHandle = jest.fn();
        store.removeSRInHasSpecialRequests = jest.fn();

        store.contradictionToggleSpecialRequests('bookingID', specialRequests, 'SR1', 'SR2', 'GetNew');

        expect(store.toggleClickSRToSpecialRequests).toHaveBeenCalledTimes(1);
        expect(store.contradictionSRHandle).toHaveBeenCalledWith('bookingID', 'Contradiction: Continue with New');
        expect(store.removeSRInHasSpecialRequests).toHaveBeenCalledWith('bookingID', specialRequests, 'SR2');
    });

    it('clickTrackingSRCTA', () => {
        store.clickTrackingSRCTA('');
        expect(store.pushSRToDataLayer).toHaveBeenCalledTimes(0);

        store.clickTrackingSRCTA('bookingID');

        expect(store.pushSRToDataLayer).toHaveBeenCalledWith(
            {
                genericValue4: 'bookingID',
                genericValue1: null,
                genericValue2: null,
                genericValue3: null,
            },
            {
                eventCategory: EventCategories.Holidays,
                eventAction: EventActions.ViewBooking,
                eventLabel: 'Edit Special Requests',
                eventType: EventTypes.Interaction,
            },
        );
    });

    it('submitSpecialRequests', () => {
        store.submitSpecialRequests('', specialRequests);
        expect(store.pushSRToDataLayer).toHaveBeenCalledTimes(0);

        store.submitSpecialRequests('bookingID', flattenedRequests);

        expect(store.pushSRToDataLayer).toHaveBeenCalledWith(
            {
                genericValue1: 'SR1 | SR2',
                genericValue4: 'bookingID',
                genericValue2: null,
                genericValue3: null,
            },
            {
                eventCategory: EventCategories.SpecialServiceRequest,
                eventAction: EventActions.SubmitRequest,
                eventLabel: 'SSR Updated',
                eventType: EventTypes.Interaction,
            },
        );

        store.submitSpecialRequests('bookingID', []);

        expect(store.pushSRToDataLayer).toHaveBeenCalledWith(
            {
                genericValue1: 'NONE',
                genericValue4: 'bookingID',
                genericValue2: null,
                genericValue3: null,
            },
            {
                eventCategory: EventCategories.SpecialServiceRequest,
                eventAction: EventActions.SubmitRequest,
                eventLabel: 'SSR Updated',
                eventType: EventTypes.Interaction,
            },
        );
    });

    describe('handleClickSpecialRequestItem', () => {
        beforeEach(() => {
            store.toggleClickSRToSpecialRequests = jest.fn();
            store.removeSRInHasSpecialRequests = jest.fn();
        });

        it('handleClickSpecialRequestItem - nullable handling', () => {
            store.handleClickSpecialRequestItem('', [], flattenedRequests[0]);
            expect(store.toggleClickSRToSpecialRequests).toHaveBeenCalledTimes(0);
            expect(store.removeSRInHasSpecialRequests).toHaveBeenCalledTimes(0);
        });

        it('handleClickSpecialRequestItem - addNewSRToEmptySpecialRequests', () => {
            store.handleClickSpecialRequestItem('bookingReference', [], flattenedRequests[0]);
            expect(store.toggleClickSRToSpecialRequests).toHaveBeenCalled();
            expect(store.removeSRInHasSpecialRequests).toHaveBeenCalledTimes(0);
        });

        it('handleClickSpecialRequestItem - removeSRInHasSpecialRequests', () => {
            store.handleClickSpecialRequestItem('bookingReference', specialRequests, {
                ...flattenedRequests[0],
                isSelected: false,
            });
            expect(store.toggleClickSRToSpecialRequests).toHaveBeenCalledTimes(0);
            expect(store.removeSRInHasSpecialRequests).toHaveBeenCalled();
        });
    });
});
