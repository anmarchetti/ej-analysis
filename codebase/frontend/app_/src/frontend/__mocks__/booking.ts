import { CurrencyCode } from 'code/currency';
import { mockInboundFlight, mockOutboundFlight } from 'frontend/__mocks__/flights';
import { mockHotel } from 'frontend/__mocks__/hotel';
import { deepClone } from 'frontend/utils/array.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IAmendmentInfo, IBookingAccom, IBookingInfo } from 'models/data/IBookingInfo';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { ITransfer } from 'models/data/ITransfer';
import { GuestType } from 'models/enum/GuestType';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import { SeatType } from 'models/enum/SeatType';
import { TransferType } from 'models/enum/transfer/TransferType';

import { mockAirportParking } from './airportParking';
import { cabinBagsMock, luggageInfoMock, mockDefaultBags } from './extraLuggage';

export const mockInfantGuest = {
    index: '1',
    age: 0,
    firstName: 'Ann',
    isLead: false,
    lastName: 'Brown',
    notBornYet: false,
    sex: 'SEX_FEMALE',
    title: 'Mrs',
    type: GuestType.Infant,
};
export const mockBookingAccom: IBookingAccom = {
    code: 'accom-code',
    isExt: false,
    startDate: '2029-06-19',
    endDate: '2029-07-19',
    hotel: {
        name: 'Hard Rock Hotel Tenerife',
        city: 'Barcelona',
        strapline: 'Stardom at the seaside',
        description: '',
        starRating: '5',
        rating: 4.5,
        numberOfReviews: 6769,
        longitude: '-16.7748',
        latitude: '28.1216',
        images: [],
        facilities: [],
        ecoFacility: {
            name: 'Eco certified',
            tooltip: 'This hotel has a Global Sustainable Tourism Council recognised certification',
        },
        country: {
            code: 'ES',
            name: 'Spain',
            itemName: 'Spain',
        },
        location: {
            code: 'ESTF',
            name: 'Tenerife',
            itemName: 'Tenerife',
        },
        resort: {
            code: 'ESTFPP',
            name: 'Playa Paraiso',
            itemName: 'Playa Paraiso',
        },
        ksp1: 'Specially designed bed sheets and rainfall showers',
        ksp2: 'Legendary restaurants and a bar with live bands',
        type: {
            code: 'BO',
            itemName: 'Handpicked',
            name: 'Handpicked',
            description: 'Great bases in great locations, selected by our experts',
            icon: '/-/jssmedia/a1daa333a4e949bebbd74ffcc10d6497.ashx',
            filledIcon: '/-/jssmedia/874a2b5169f7408ba7548a2a1ca312ca.ashx',
            typeAndThemeTitle: 'Handpicked Hotel',
        },
        tripAdvisorId: '4341700',
        isGreatDeal: false,
        code: 'code',
        roomTypes: [
            {
                code: 'room',
                title: mockSitecoreField('roomTitle'),
                itemName: 'roomType_title',
                content: 'roomContent',
                description: 'roomDescription',

                iconUrl: 'roomIconUrl',

                images: [],

                facilities: [],

                stays: [],
            },
        ],
        boardTypes: [
            {
                code: 'board',
                content: 'boardContent',
                title: 'boardTitle',
                itemName: 'boardType_title',
                description: 'boardDescription',
                iconUrl: 'boardIconUrl',
            },
        ],
        closestFacility: {
            code: 'code',
            groupCode: 'groupCode',
            name: 'name',
            distance: 100,
        },
        keySellingPoint2: 'keySellingPoint2',
        keySellingPoint1: 'keySellingPoint1',
        errataFacilities: [],
        address: 'address',
        theme: {
            code: 'code',
            name: 'name',
            itemName: 'name',
            packageIcons: [
                {
                    key: PackageIconTypes.Hotel,
                    name: 'name',
                    iconUrl: 'iconUrl',
                },
            ],
        },
        fullHotelAddress: {
            city: 'Protaras',
            country: 'Cyprus',
            countryCode: 'CY',
            postalCode: '5295',
            region: 'Larnaca',
            street: 'Pinias Street',
        },
    },
    rooms: [
        {
            isFreeForKids: false,
            code: 'DB01',
            roomType: {
                code: 'DB01',
                itemName: 'roomType_title',
                title: 'Double room',
                description: 'roomDescription',
                content: 'roomContent',
                iconUrl: 'roomIconUrl',
                images: [],
                facilities: [],
                stays: [],
            },
            board: 'HB',
            boardType: {
                code: 'HB',
                description: 'boardTypeDescription',
                title: 'Half board',
                itemName: 'boardType_title',
                content: 'content',
                iconUrl: '/-/jssmedia/ee09ab1161a34c1e93d08579844d9db0.ashx',
            },
            occupation: { adults: 2, children: 0, infants: 0, paxIds: [], childAges: [] },
        },
    ],
};

export const amendmentInfo: IAmendmentInfo = {
    transfer: {
        amendAllow: true,
        downgradeAllow: true,
    },
    isHotelChangeEnabled: true,
    route: true,
    amendBookingStatus: [],
    specialRequest: true,
    changeDates: true,
    roomAndBoard: true,
    booking: true,
    memo: true,
    canBookingCancelled: true,
    pax: { nameChangedTimes: 13, amendAllow: true, amendNameOnly: true },
    seats: true,
};

export const mockBooking: IBookingInfo = {
    amendmentInfo,
    priceBreakdown: [
        { name: 'Promotion', amount: 70, code: 'Promotions', quantity: 1 },
        { name: 'Children', amount: 80, code: 'Adults', quantity: 1 },
        { name: 'ExtraDiscount', amount: -20, code: 'Discount', quantity: 1 },
    ],
    extraPriceBreakdown: [
        {
            name: 'Extras',
            amount: 20,
            code: 'Extras',
            quantity: 1,
            subcategories: [
                { name: 'Promo', amount: 50, code: 'Promotions', quantity: 1 },
                { name: 'Adults', amount: 100, code: 'Adults', quantity: 1 },
                { name: 'Discount', amount: -10, code: 'Discount', quantity: 1 },
            ],
        },
    ],
    extraLuggageInfo: { items: [...mockDefaultBags, ...cabinBagsMock.items, ...luggageInfoMock.items] },
    package: {
        accom: { ...mockBookingAccom },
        transport: {
            routes: [mockOutboundFlight, mockInboundFlight],
        },
        location: {
            city: 'Barcelona',
            country: 'Spain',
            region: 'package-region',
        },
    },
    discountCode: 'discountCode',
    hotel: deepClone(mockHotel),
    bookingStatus: 'ACTUAL',
    paymentInfo: {
        depositPrice: 300,
        pricePP: 1,
        totalPrice: 10,
        allowPayOutstandingBalanceDays: 10,
        paymentHistory: [],
        balanceDueDate: '2023-01-03',
        allowPayBalanceDueDate: '2025-01-12',
        depositDueDate: 'deposite',
        balanceDueAmount: 1,
        agentComission: 1,
        commissionIncludingVat: 1,
        currency: CurrencyCode.GBP,
    },
    guests: [
        {
            index: '1',
            age: 0,
            firstName: 'Ann',
            isLead: false,
            lastName: 'Brown',
            notBornYet: false,
            sex: 'SEX_FEMALE',
            title: 'Mrs',
            type: GuestType.Adult,
        },
        {
            index: '2',
            age: 0,
            firstName: 'Ann',
            isLead: true,
            lastName: 'Brown',
            notBornYet: false,
            sex: 'SEX_FEMALE',
            title: 'Mrs',
            type: GuestType.Adult,
        },
    ],
    bookingReference: 'bookingReference',
    cancellationIsBlocked: false,
    refund: {
        credit: {
            isEligible: true,
            credit: 120,
            cash: 0,
        },

        refund: {
            isEligible: true,
            cash: 100,
            credit: 20,
        },
    },
    isLoggedInAsLeadPassenger: true,
    leadPassenger: {
        address: 'Test address',
        address2: 'Test address 2',
        dateOfBirth: '1995-07-05T00:00:00+03:00',
        email: 'test@test.fr',
        phone: '1234567890',
        postCode: 'd444ff',
        townCity: 'Minsk',
        dialingCode: '+44',
        countryCode: 'GBR',
    },
    marketCode: 'UK',
    sessionId: 'sessionId',
    requestId: 'requestId',
    healthEntryRequirements: [],
    prom: 'prom',
    currency: {
        code: CurrencyCode.GBP,
    },
    tradeAgentPriceBreakdown: [],
    transfers: [
        {
            id: '1',
            autoInclude: false,
            code: 'ABCN0/LCO',
            method: 'PI',
            prom: 'AUCI',
            quantity: 2,
            rateRule: 'DAY',
            startDate: '2023-05-22T00:00:00',
            name: 'Private taxi',
            price: 10,
            pricePP: 5,
            content: 'content',
            iconUrl: 'string',
            isHidden: false,
            transferInfo: { depInstr: 'some dep instr', arrivalInstr: 'some arr instr', duration: 50 },
            type: TransferType.Private,
        } as ITransfer,
    ],
    seatSelection: [
        {
            seats: [
                {
                    paxIndex: 1,
                    seatNumber: '4D',
                    priceBand: SeatType.UpFront,
                    price: 44.99,
                    products: [],
                },
            ],
            sectorId: '1',
            flightNumber: '8609',
            isSeatReservationPossible: true,
        },
        {
            seats: [
                {
                    paxIndex: 1,
                    seatNumber: '5D',
                    priceBand: SeatType.UpFront,
                    price: 42.99,
                    products: [],
                },
            ],
            sectorId: '2',
            flightNumber: '8610',
            isSeatReservationPossible: true,
        },
    ] as ISelectedSeat[],
    airportParking: mockAirportParking,
};

export const paymentInfoMock = {
    depositPrice: 100,
    pricePP: 100,
    totalPrice: 100,
    paymentHistory: [],
    balanceDueDate: '',
    depositDueDate: '',
    balanceDueAmount: 100,
    currency: CurrencyCode.CHF,
};
