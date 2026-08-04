import { IBookingAccom } from 'models/data/IBookingInfo';
import { IAccomData, IUnit } from 'models/data/IOffer';

import { mockBoardType, mockHotel, mockTheme, mockThemeType } from './hotel';
import { mockRoom, roomTypeMock } from './room';

export const bookingAccomMock: IBookingAccom = {
    hotel: mockHotel,
    startDate: new Date(2023, 5, 20).toISOString(),
    endDate: new Date(2023, 6, 25).toISOString(),
    rooms: [mockRoom],
    code: 'FC0315',
    isExt: false,
};

export const mockAccomData: IAccomData<IUnit> = {
    date: '2023-03-15',
    stay: 7,
    id: 'abcd',
    packageId: 'package123',
    code: 'hotel123',
    unit: [
        {
            isExt: false,
            code: 'unit1',
            originalCode: 'unit1',
            boardType: mockBoardType,
            board: 'AI',
            roomType: roomTypeMock,
            occupation: {
                adults: 2,
                children: 1,
                infants: 0,
                paxIds: [1, 2, 3],
                childAges: [5],
            },
            price: 1000,
            pricePP: 250,
            discount: 0,
            isFreeForKids: false,
            itemId: 'item123',
            avail: 5,
        },
        {
            isExt: false,
            code: 'unit2',
            originalCode: 'unit2',
            boardType: {
                ...mockBoardType,
                code: 'AI',
                name: 'All Inclusive',
            },
            board: 'AI',
            roomType: {
                ...roomTypeMock,
                code: 'suite',
                name: 'Suite',
            },
            occupation: {
                adults: 2,
                children: 0,
                infants: 0,
                paxIds: [4, 5],
                childAges: [],
            },
            price: 1200,
            pricePP: 300,
            discount: 100,
            isFreeForKids: true,
            itemId: 'item456',
            freeNights: {
                freeNightsIncluded: 1,
                freeNightsPromo: [
                    {
                        minStay: 7,
                        currentStay: 7,
                        currentFree: 1,
                        travelStartDate: '2023-03-15',
                        travelEndDate: '2023-12-31',
                    },
                ],
            },
            avail: 3,
        },
        {
            isExt: false,
            code: 'unit3',
            originalCode: 'unit3',
            boardType: {
                ...mockBoardType,
                code: 'BB',
                name: 'Bed and Breakfast',
            },
            board: 'BB',
            roomType: {
                ...roomTypeMock,
                code: 'deluxe',
                name: 'Deluxe Room',
            },
            occupation: {
                adults: 1,
                children: 0,
                infants: 0,
                paxIds: [6],
                childAges: [],
            },
            price: 800,
            pricePP: 800,
            discount: 50,
            isFreeForKids: false,
            itemId: 'item789',
            avail: 10,
        },
    ],
    prom: 'promo123',
    isExt: false,
    type: mockThemeType,
    theme: mockTheme,
    latitude: 123.456,
    longitude: 789.012,
};
