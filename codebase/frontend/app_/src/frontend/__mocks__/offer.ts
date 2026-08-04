import { mockTransfer } from 'frontend/__mocks__/transfer';
import { IOffer, IUnit } from 'models/data/IOffer';

import { mockHotel } from './hotel';
import { mockTouristTax } from './touristTax';
import { mockedTransport } from './transport';

export const mockedUnit: IUnit = {
    code: 'SUI.CV-LX!NOR.BAR - RO',
    price: 746.0,
    pricePP: 249.0,
    discount: 0.0,
    discountPP: 0.0,
    avail: 2,
    isFreeForKids: false,
    roomType: {
        code: 'SUI.CV-LX',
        title: 'SUITE LUXURY CITY VIEW',
        description: '',
        content: '',
        iconUrl: '/-/jssmedia/73F6DE5C3C584314569650FFE8646E1C1C.ashx',
        images: [
            {
                small: 'https://photos.hotelbeds.com/giata/43/431179/431179a_hb_ro_003.jpg',
                medium: 'https://photos.hotelbeds.com/giata/bigger/43/431179/431179a_hb_ro_003.jpg',
                large: 'https://photos.hotelbeds.com/giata/xl/43/431179/431179a_hb_ro_003.jpg',
            },
        ],
        facilities: [
            {
                name: 'Alarm clock',
                code: '273',
                number: '',
                disclaimerMessage: '',
            },
        ],
        stays: [
            {
                stayType: 'BED',
                description: 'Bed room',
                facilities: [
                    {
                        name: 'King-size bed',
                        code: '155',
                        number: '1',
                    },
                ],
            },
        ],
    },
    board: 'RO',
    boardType: {
        code: 'RO',
        title: 'Room only',
        content: '',
        description: '',
        iconUrl: '/-/jssmedia/48AFA2C9659B41358DD864EFDC4E1999.ashx',
    },
    occupation: {
        adults: 2,
        children: 1,
        infants: 0,
        paxIds: [1, 2, 3],
        childAges: [4],
    },
    requireBoardAlteration: '',
};

export const mockedUnit2: IUnit = {
    code: 'APT.B1!NOR.OPAQUE',
    price: 0.0,
    pricePP: 0.0,
    avail: 0,
    isFreeForKids: false,
    isExt: true,
    roomType: {
        code: 'APT.B1',
        title: 'APARTMENT ONE BEDROOM',
        description: '',
        content: '',
        iconUrl: '/-/jssmedia/73F6DE5C3C5843169650FFE8646E1C1C.ashx',
        images: [
            {
                small: 'https://photos.hotelbeds.com/giata/13/133509/133509a_hb_ro_007.jpg',
                medium: 'https://photos.hotelbeds.com/giata/bigger/13/133509/133509a_hb_ro_007.jpg',
                large: 'https://photos.hotelbeds.com/giata/xl/13/133509/133509a_hb_ro_007.jpg',
            },
        ],
        facilities: [
            {
                name: 'Balcony',
                code: '230',
                number: '',
                disclaimerMessage: '',
            },
        ],
        stays: [
            {
                stayType: 'BED',
                description: 'Bed room',
                facilities: [
                    {
                        name: 'Single bed',
                        code: '1',
                        number: '2',
                    },
                ],
            },
        ],
    },
    board: 'SC',
    boardType: {
        code: 'SC',
        title: 'Self catering',
        content: '',
        description: '',
        iconUrl: '/-/jssmedia/73F6DE5C3C5843169650FFE8646E1C1C.ashx',
    },
    occupation: {
        adults: 2,
        children: 2,
        infants: 1,
        childAges: [3, 2],
        paxIds: [1, 2, 3],
    },
    requireBoardAlteration: '',
};

export const mockedOffer = {
    accom: {
        id: 'X9017210',
        code: 'CODE:X9017210',
        theme: { code: 'B', name: 'Beach' },
        prom: 'EUBF',
        unit: [
            {
                code: 'ROOM',
                boardType: { code: 'BOARD', title: 'Bed and Breakfast' },
                roomType: {
                    code: 'ROOM',
                },
                isFreeForKids: true,
                occupation: { adults: 2, children: 2, infants: 0 },
            },
        ],
        type: {
            code: 'TT001',
            name: 'Resort',
            itemName: 'Resort',
            description: 'A luxurious resort destination',
            icon: 'resort_icon_url',
            filledIcon: 'filled_resort_icon_url',
            typeAndThemeTitle: 'Resort Themes',
        },
    },
    hotel: mockHotel,
    transport: mockedTransport,
    stay: 7,
    date: '2029-12-10T00:00:00',
    transfers: [mockTransfer],
    promoCollections: undefined,
    hasFreeBoardUpdate: true,
    hasDiscountedBoardUpgrade: false,
    ...mockTouristTax,
} as IOffer;
