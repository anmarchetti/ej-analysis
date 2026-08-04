import { CurrencyCode } from 'code/currency';
import { mockGuests, mockOutboundFlight, mockRoom } from 'frontend/__mocks__';
import { altOffer } from 'frontend/__mocks__/altOffer';
import { getDaysDifference } from 'frontend/utils/date.utils';
import { checkDestinationTypeExists } from 'frontend/utils/destinations.utils';
import {
    getChildrenAge,
    getDepartureAirportsNames,
    getDepartureDateFlexibility,
    getDestinationCodes,
    getDestinationLevels,
    getDestinationNames,
    getFirstPositionOnPage,
    getOffersDestinationAirportsCodes,
    getOffersDestinationAirportsNames,
    getPassengerConfig,
    getSeason,
    getTimestamp,
} from 'frontend/utils/tracking/tracking.utils';
import { ISearchDependenciesData } from 'models/data/tracking/ISearch';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { getAdultsQuantity, getChildrenQuantity, getInfantsQuantity } from 'models/RoomAllocation.utils';

import { getSearchDetailObject, getSearchDetailsForBooking } from './trackingList.utils';

jest.mock('models/RoomAllocation.utils');
jest.mock('frontend/utils/destinations.utils');
jest.mock('frontend/utils/tracking/tracking.utils');
jest.mock('frontend/utils/date.utils');

describe('TrackingStore.searchList', () => {
    beforeEach(() => {
        jest.mocked(getAdultsQuantity).mockReturnValue(2);
        jest.mocked(getChildrenQuantity).mockReturnValue(1);
        jest.mocked(getInfantsQuantity).mockReturnValue(1);

        jest.mocked(checkDestinationTypeExists).mockReturnValue(true);

        jest.mocked(getChildrenAge).mockReturnValue('12');
        jest.mocked(getDepartureAirportsNames).mockReturnValue('Gatwick');
        jest.mocked(getDepartureDateFlexibility).mockReturnValue('Flex');
        jest.mocked(getDestinationCodes).mockReturnValue('GTW');
        jest.mocked(getDestinationLevels).mockReturnValue('Level');
        jest.mocked(getDestinationNames).mockReturnValue('London');
        jest.mocked(getFirstPositionOnPage).mockReturnValue(1);
        jest.mocked(getOffersDestinationAirportsCodes).mockReturnValue('AIR');
        jest.mocked(getOffersDestinationAirportsNames).mockReturnValue('SanPaolo');
        jest.mocked(getPassengerConfig).mockReturnValue('A:2, C:1, I:1');
        jest.mocked(getSeason).mockReturnValue('Spring');
        jest.mocked(getTimestamp).mockReturnValue('2020-11-10');

        jest.mocked(getDaysDifference).mockReturnValue(123);
    });

    describe('getSearchDetailObject', () => {
        const mockSearchParams: ISearchDependenciesData = {
            origins: ['GTW', 'LDN'],
            originsWithNames: [],
            selectedDestinations: [],
            flexDays: 3,
            isFlexible: true,
            to: new Date('2020-10-11'),
            from: new Date('2020-09-11'),
            roomsAllocation: [],
            roomsAllocationLength: 0,
            page: 1,
            take: 10,
            filteredDestinations: [],
            currencyCode: CurrencyCode.GBP,
        };

        it('should be called with all params and return the search object', () => {
            const searchObject = getSearchDetailObject([altOffer], EventTypes.StayInTheLoop, mockSearchParams);

            expect(getAdultsQuantity).toHaveBeenCalledWith(mockSearchParams.roomsAllocation);
            expect(getChildrenQuantity).toHaveBeenCalledWith(mockSearchParams.roomsAllocation);
            expect(getChildrenQuantity).toHaveBeenCalledWith(mockSearchParams.roomsAllocation);
            expect(getInfantsQuantity).toHaveBeenCalledWith(mockSearchParams.roomsAllocation);

            expect(checkDestinationTypeExists).toHaveBeenCalledWith(
                mockSearchParams.selectedDestinations,
                'VirtualRegion',
            );

            expect(getDestinationLevels).toHaveBeenCalledWith(mockSearchParams.filteredDestinations);

            expect(getTimestamp).toHaveBeenCalled();

            expect(getDepartureAirportsNames).toHaveBeenCalledWith(
                mockSearchParams.origins,
                mockSearchParams.originsWithNames,
            );
            expect(getDepartureDateFlexibility).toHaveBeenCalledWith(
                mockSearchParams.flexDays,
                mockSearchParams.isFlexible,
            );

            expect(getSeason).toHaveBeenCalledWith(mockSearchParams.from);
            expect(getSeason).toHaveBeenCalledWith(mockSearchParams.to);

            expect(getDaysDifference).toHaveBeenCalledWith(mockSearchParams.to, mockSearchParams.from);

            expect(getPassengerConfig).toHaveBeenCalledWith(2, 1, 1);

            expect(getFirstPositionOnPage).toHaveBeenCalledWith(mockSearchParams.page, mockSearchParams.take);

            expect(getChildrenAge).toHaveBeenCalledWith(mockSearchParams.roomsAllocation);

            expect(searchObject).toStrictEqual({
                dimension108: 'stay_in_the_loop',
                currencyCode: CurrencyCode.GBP,
                dimension13: '2020-11-10',
                dimension18: 'Gatwick',
                dimension19: 'GTW|LDN',
                dimension20: 'SanPaolo',
                dimension21: 'AIR',
                dimension22: 'Level',
                dimension23: 'London',
                dimension24: 'GTW',
                dimension25: 'London',
                dimension26: 'GTW',
                dimension27: 'London',
                dimension28: 'GTW',
                dimension29: 'Yes',
                dimension30: 2,
                dimension31: 'No',
                dimension32: 0,
                dimension33: 'Exact',
                dimension34: 'Flex',
                dimension35: undefined,
                dimension36: undefined,
                dimension37: 'Spring',
                dimension40: 123,
                dimension41: 'Exact',
                dimension42: undefined,
                dimension43: undefined,
                dimension44: 'Spring',
                dimension47: 123,
                dimension49: 3,
                dimension50: 'A:2, C:1, I:1',
                dimension51: 2,
                dimension52: 1,
                dimension53: 1,
                dimension54: 0,
                dimension62: 1,
                dimension79: '12',
            });
        });
    });

    describe('getSearchDetailsForBooking', () => {
        it('should return correct search object for booking', () => {
            const result = getSearchDetailsForBooking([mockOutboundFlight], mockGuests, mockRoom, 3, CurrencyCode.GBP);

            expect(result).toStrictEqual({
                origins: ['LGW'],
                originsWithNames: [],
                selectedDestinations: [],
                flexDays: 0,
                isFlexible: false,
                to: new Date('2023-05-11T12:10:00.000Z'),
                from: new Date('2023-05-11T12:10:00.000Z'),
                roomsAllocation: [
                    {
                        adults: [mockGuests[0], mockGuests[1]],
                        children: [],
                        infants: [mockGuests[2]],
                        roomCode: 'roomType_code',
                    },
                ],
                roomsAllocationLength: 1,
                page: 3,
                take: 10,
                filteredDestinations: null,
                currencyCode: CurrencyCode.GBP,
            });
        });
    });
});
