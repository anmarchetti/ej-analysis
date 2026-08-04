import groupBookingService from 'frontend/services/groupBooking.service/groupBooking.service';
import { RoomAllocation } from 'models/RoomAllocation';
import { mockErrorMessages } from 'frontend/components/renderings/TradePortalGroupBooking/__mocks__/errorMessages.mocks';
import { GroupBooking } from 'frontend/components/renderings/TradePortalGroupBooking/data/GroupBooking';

import { GroupBookingStore } from './GroupBookingStore';

const createGroupBookingMock = () =>
    ({
        isValid: true,
        agentName: 'agentName',
        agentEmail: 'agent@email.com',
        agentNumber: 'agentNumber',
        departureAirport: 'LGW',
        isFlexible: true,
        departureDate: '01-01-2100',
        duration: '7',
        boards: [{ value: 'Board 1' }, { value: 'Board 2' }],
        destination: 'Tenerife',
        additionalDetails: 'additionalDetails',
        rooms: [
            { adults: [{}, {}], children: [{ age: 10 }, { age: 13 }], infants: [{}] },
            { adults: [{}], children: [], infants: [] },
        ] as RoomAllocation[],
        adultsQuantity: 3,
        childrenQuantity: 2,
        infantsQuantity: 1,
    } as Partial<GroupBooking>);

let mockGroupBooking = createGroupBookingMock();

jest.mock('frontend/components/renderings/TradePortalGroupBooking/data/GroupBooking', () => ({
    ...jest.requireActual('frontend/components/renderings/TradePortalGroupBooking/data/GroupBooking'),
    GroupBooking: jest.fn(() => mockGroupBooking),
}));

const mockSaveGroupBookingInformation = jest
    .spyOn(groupBookingService, 'saveGroupBookingInformation')
    .mockResolvedValue();

const scrollToSpy = jest.fn();
global.scrollTo = scrollToSpy;

let store: GroupBookingStore;

describe('GroupBooking', () => {
    beforeEach(() => {
        mockGroupBooking = createGroupBookingMock();
        store = new GroupBookingStore(mockErrorMessages);
    });

    it('should check default values', () => {
        expect(store.groupBooking).toBeDefined();
        expect(store.formKey).toBeDefined();
        expect(store.forceErrors).toBe(false);
        expect(store.isSuccess).toBe(false);
    });

    it('should change forceErrors value with toggleForceErrors func', () => {
        expect(store.forceErrors).toBe(false);

        store.toggleForceErrors(true);

        expect(store.forceErrors).toBe(true);

        store.toggleForceErrors(false);

        expect(store.forceErrors).toBe(false);
    });

    describe('submitForm', () => {
        it('should submit when groupBooking is valid', async () => {
            await store.submitForm();

            expect(mockSaveGroupBookingInformation).toHaveBeenCalledWith({
                abtaNumber: 'agentNumber',
                additionalDetails: 'additionalDetails',
                agentName: 'agentName',
                boardBasis: 'Board 1, Board 2',
                departureAirport: {
                    airport: 'LGW',
                    iAmFlexible: true,
                },
                departureDate: '2100-01-01',
                destinationHotelOrRegion: 'Tenerife',
                durationOfHoliday: 7,
                email: 'agent@email.com',
                numberOfRooms: 2,
                rooms: [
                    { adults: 2, childAges: [10, 13], children: 2, infants: 1, roomNumber: 1 },
                    { adults: 1, children: 0, childAges: [], infants: 0, roomNumber: 2 },
                ],
                totalPassengers: { adults: 3, children: 2, infants: 1 },
            });
            expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
            expect(store.isSuccess).toBe(true);
        });

        it('should catch err when groupBooking is valid and saveGroupBookingInformation throws err', async () => {
            mockSaveGroupBookingInformation.mockRejectedValueOnce(new Error());
            store.isSuccess = true;
            await store.submitForm();

            expect(scrollToSpy).not.toHaveBeenCalled();
            expect(store.isSuccess).toBe(false);
        });

        it('should NOT submit when groupBooking is invalid', async () => {
            (mockGroupBooking as any).isValid = false;
            store = new GroupBookingStore(mockErrorMessages);

            await store.submitForm();

            expect(scrollToSpy).not.toHaveBeenCalled();
            expect(store.isSuccess).toBe(false);
        });
    });
});
