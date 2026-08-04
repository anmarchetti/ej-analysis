import { CurrencyCode } from 'code/currency';
import { mockHotel } from 'frontend/__mocks__/hotel';
import { IBd4Tracking } from 'models/data/IBd4Tracking';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ILateRoomCheckout } from 'models/data/IExtras';
import { IFeaturedHotelsWithPrice } from 'models/data/IFeaturedHotel';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { ITransfer } from 'models/data/ITransfer';
import { IAmendTransferProduct, IBaseHolidayProduct, ISecondaryHolidayProduct } from 'models/data/tracking/IProduct';
import { GuestType } from 'models/enum/GuestType';
import { SeatType } from 'models/enum/SeatType';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ProductCategories } from 'models/enum/tracking/ProductCategories';

import { mockedTransport } from './transport';

export const mockedIframeABTestInfo = {
    expId: 'expId',
    isPrefilled: 'Yes',
};

export const mockBaseTrackingProduct: IBaseHolidayProduct = {
    brand: 'brand',
    variant: 'variant',
    category: ProductCategories.BaseHoliday,
    coupon: 'coupon',
    currencyCode: CurrencyCode.GBP,
    dimension108: EventTypes.CustomEventPrefix,
    dimension13: 'dimension13',
    dimension15: 13,
    dimension19: 'dimension19',
    dimension21: 'dimension21',
    dimension23: 'dimension23',
    dimension24: 'dimension24',
    dimension25: 'dimension25',
    dimension26: 'dimension26',
    dimension27: 'dimension27',
    dimension28: 'dimension28',
    dimension35: 'dimension35',
    dimension42: 'dimension42',
    dimension47: 15,
    dimension49: 17,
    dimension51: 51,
    dimension52: 52,
    dimension53: 53,
    dimension54: 54,
    dimension56: 'dimension56',
    dimension57: 'dimension57',
    dimension58: 'dimension58',
    dimension63: 'dimension63',
    dimension64: 64,
    dimension65: 'dimension65',
    dimension71: 'dimension71',
    dimension73: 'dimension73',
    dimension78: 78,
    dimension79: 'dimension79',
    id: 'id',
    name: 'name',
    price: 55,
    quantity: 1,
};

export const mockAmendTransferTrackingProduct: IAmendTransferProduct = {
    ...mockBaseTrackingProduct,
    category: 'category',
    dimension108: EventTypes.CustomEventPrefix,
    id: 'id',
    metric6: 13,
    name: 'name',
    price: 15,
};

export const mockedLateRoomCheckout = {
    id: '1',
    autoInclude: false,
    code: 'ABCN0/LCO',
    method: 'PI',
    prom: 'AUCI',
    quantity: 0,
    rateRule: 'DAY',
    name: 'Late Checkout Room',
    price: 76,
    mcMethod: 'PB',
    isHidden: false,
    maxPax: 999,
    minPax: 1,
} as ILateRoomCheckout;

export const mockedTransfer = {
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
    transferInfo: {},
} as ITransfer;

export const mockedLuggageTrackingProductItems = [
    { price: 39.99, quantity: 2, routeId: '1', title: 'Hold Baggage 15kg' },
    { price: 39.99, quantity: 2, routeId: '2', title: 'Hold Baggage 15kg' },
    { price: 45, quantity: 2, routeId: '1', title: 'Bicycle' },
    { price: 45, quantity: 2, routeId: '2', title: 'Bicycle' },
];

export const mockedPaymentInfo = {
    balanceDueAmount: 200,
    depositPrice: 120,
    totalPrice: 1000,
    pricePP: 500,
};

export const mockedNewSeatSelection = [
    {
        seats: [
            {
                paxIndex: 1,
                seatNumber: '6D',
                priceBand: SeatType.UpFront,
                price: 0,
                products: [],
            },
            {
                paxIndex: 2,
                seatNumber: '1D',
                priceBand: SeatType.UpFront,
                price: 0,
                products: [],
            },
        ],
        sectorId: '1',
        flightNumber: 'flight-1',
        isSeatReservationPossible: true,
    },
    {
        seats: [
            {
                paxIndex: 1,
                seatNumber: '5E',
                priceBand: SeatType.Standard,
                price: 30,
                products: [],
            },
            {
                paxIndex: 2,
                seatNumber: '1F',
                priceBand: SeatType.Standard,
                price: 30,
                products: [],
            },
        ],
        sectorId: '2',
        flightNumber: 'flight-2',
        isSeatReservationPossible: true,
    },
] as ISelectedSeat[];

export const mockedPrevSeatSelection = [
    {
        seats: [
            {
                paxIndex: 1,
                seatNumber: '2D',
                priceBand: SeatType.UpFront,
                price: 39.99,
                products: [],
            },
            {
                paxIndex: 2,
                seatNumber: '2E',
                priceBand: SeatType.UpFront,
                price: 39.99,
                products: [],
            },
        ],
        sectorId: '1',
        flightNumber: 'flight-1',
        isSeatReservationPossible: true,
    },
    {
        seats: [
            {
                paxIndex: 1,
                seatNumber: '5E',
                priceBand: SeatType.UpFront,
                price: 30,
                products: [],
            },
            {
                paxIndex: 2,
                seatNumber: '1F',
                priceBand: SeatType.UpFront,
                price: 30,
                products: [],
            },
        ],
        sectorId: '2',
        flightNumber: 'flight-2',
        isSeatReservationPossible: true,
    },
] as ISelectedSeat[];

export const mockedBooking = {
    bookingReference: '123',
    guests: [{ type: GuestType.Adult }, { type: GuestType.Child, age: 5 }, { type: GuestType.Child, age: 6 }],
    package: {
        accom: {
            endDate: '2020-09-12',
            startDate: '2020-09-19',
            code: 'accom_code',
            hotel: mockHotel,
            rooms: [{ code: 'Room-1' }],
        },
        transport: mockedTransport,
    },
    paymentInfo: mockedPaymentInfo,
    prom: 'EUBF',
    seatSelection: mockedNewSeatSelection,
} as IBookingInfo;

export const mockedTimestamp = '2020-20-02';

export const bd4SortTracking: IBd4Tracking = {
    pToken: 'pToken',
    tracking: {
        campaignId: [],
        campaignInfo: [
            {
                action: 'action',
                id: 'sponsored_campaign:ej:X9017210',
                name: 'sponsored_campaign',
                productId: 'ej:X9017210',
            },
        ],
    },
    apiUrl: 'apiUrl',
    recoInfo: 'recoInfo',
};

export const featuredHotelsMock = [
    {
        Name: 'Hotel One',
        Country: 'Country One',
        Region: 'Region One',
        livePrice: { pricePP: 100 },
    },
    {
        Name: 'Hotel Two',
        Country: 'Country Two',
        Region: 'Region Two',
        livePrice: { pricePP: 200 },
    },
] as IFeaturedHotelsWithPrice[];

export const mockSecondaryTrackingProduct: ISecondaryHolidayProduct = {
    category: 'category',
    currencyCode: CurrencyCode.CHF,
    id: 'id',
    name: 'name',
    price: 13,
    quantity: 1,
    metric6: 0,
};
