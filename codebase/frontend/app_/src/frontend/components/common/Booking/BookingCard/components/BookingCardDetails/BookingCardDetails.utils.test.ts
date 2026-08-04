import { mockBooking } from 'frontend/__mocks__/booking';
import { generateLuggageInfoItemMock } from 'frontend/__mocks__/extraLuggage';
import { GuestType } from 'models/enum/GuestType';

import { usePreparedBookingDetailsData } from './BookingCardDetails.utils';
import { mockPreparedBookingDetailsData } from './preparedBookingDetailsData.mock';

const createStores = () => ({
    layoutStore: {
        largeCabinBagCode: 'SCB1',
    },
});

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseLuxuryInternalFlight = false;
jest.mock('frontend/hooks/useLuxuryInternalFlight', () => ({
    useLuxuryInternalFlight: jest.fn(() => mockUseLuxuryInternalFlight),
}));

jest.mock('frontend/utils/luggage.utils', () => ({
    __esModule: true,
    getGuestsAmountByType: jest.fn(() => ({
        adults: 4,
        children: 3,
        infants: 1,
    })),
}));

describe('usePreparedBookingDetailsData', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should return correct details', () => {
        mockBooking.guests.push({
            index: '3',
            age: 0,
            firstName: 'Bob',
            isLead: false,
            lastName: 'Brown',
            notBornYet: false,
            sex: 'SEX_FEMALE',
            title: 'Mrs',
            type: GuestType.Infant,
        });
        mockBooking.extraLuggageInfo.items = [
            ...mockBooking.extraLuggageInfo.items,
            generateLuggageInfoItemMock('1', '1', 'LUG', 'BAGE', 2, 40, false, '23kg Extra Hold Bag'),
            generateLuggageInfoItemMock('2', '1', 'LUG', 'BAGE', 2, 40, false, '23kg Extra Hold Bag'),
        ];

        const details = usePreparedBookingDetailsData(mockBooking);

        expect(details).toEqual({
            details: mockPreparedBookingDetailsData,
            isCanceled: false,
            isFlightDetailsDisplayed: true,
        });
    });

    it('should return correct hold luggage amount for luxury internal booking', () => {
        mockUseLuxuryInternalFlight = true;

        const details = usePreparedBookingDetailsData(mockBooking);

        expect(details).toEqual({
            details: { ...mockPreparedBookingDetailsData, luggageCount: 8 },
            isCanceled: false,
            isFlightDetailsDisplayed: true,
        });
    });
});
