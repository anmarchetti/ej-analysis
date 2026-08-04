import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { RouteDirection } from 'models/enum/RouteDirection';

import { mockBooking } from './booking';
import { extraLuggageInfoMock } from './extraLuggage';
import { mockUnitRoom } from './room';
import { mockedTransport } from './transport';

const commonRouteProps = {
    arrLocation: 'arrLocation',
    arrName: 'arrName',
    car: 'car',
    depLocation: 'depLocation',
    depName: 'depName',
    isExt: false,
};
const commonAltOfferProps = {
    accom: {
        code: 'code',
        date: '2022-05-14T16:30:00',
        id: 'id',
        isExt: false,
        packageId: 'packageId',
        prom: 'prom',
        stay: 2,
        unit: [],
    },
    date: '2022-05-14T16:30:00',
    hasDistressedFlights: false,
    id: 'id',
    pricePP: 600,
    stay: 2,
    transfers: [],
    touristTax: 0,
    touristTaxPP: 0,
    pricePPExcludingTouristTax: 600,
};

export const mockOfferWithoutAltBoards: IOfferWithoutAltBoards = {
    hotel: mockBooking.hotel,
    accom: {
        code: 'code',
        date: '2020-11-10',
        id: 'id',
        isExt: false,
        packageId: 'packageId',
        prom: 'prom',
        stay: 1,
        unit: [mockUnitRoom],
    },
    date: '',
    extraLuggageInfo: extraLuggageInfoMock,
    hasDistressedFlights: false,
    id: '',
    price: 21,
    pricePP: 21,
    totalPrice: 50,
    stay: 0,
    transfers: [],
    transport: mockedTransport,
    touristTax: 0,
    touristTaxPP: 0,
    hasDiscountedBoardUpgrade: true,
    priceExcludingTouristTax: 21,
    pricePPExcludingTouristTax: 21,
};

export const altOffer: IAlternativeOffer = {
    ...commonAltOfferProps,
    price: 1200,
    transport: {
        routes: [
            {
                ...commonRouteProps,
                id: 'E6484b33783e9ccf133f8a9f846b6f584',
                direction: RouteDirection.Outbound,
                fltNo: 'EZY791',
                arrPt: 'ALC',
                arrDate: '2022-05-14T20:30:00',
                depPt: 'LGW',
                depDate: '2022-05-14T16:30:00',
            },
            {
                ...commonRouteProps,
                id: 'E2b98204cde1146241aa1112dcb249ee0',
                direction: RouteDirection.Inbound,
                fltNo: 'EZY791',
                arrPt: 'LGW',
                arrDate: '2022-05-21T12:40:00',
                depPt: 'ALC',
                depDate: '2022-05-21T10:40:00',
            },
        ],
    },
};

export const altOffers: IAlternativeOffer[] = [
    altOffer,
    {
        ...commonAltOfferProps,
        price: 1000,
        transport: {
            routes: [
                {
                    ...commonRouteProps,
                    id: 'E6484b33783e9ccf133f8a9f846b6f584',
                    direction: RouteDirection.Outbound,
                    fltNo: 'EZY791',
                    arrPt: 'ALC',
                    arrDate: '2022-05-14T20:00:00',
                    depPt: 'LTN',
                    depDate: '2022-05-14T18:00:00',
                },
                {
                    ...commonRouteProps,
                    id: 'E2b98204cde1146241aa1112dcb249ee0',
                    direction: RouteDirection.Inbound,
                    fltNo: 'EZY791',
                    arrPt: 'LTN',
                    arrDate: '2022-05-21T18:40:00',
                    depPt: 'ALC',
                    depDate: '2022-05-21T16:40:00',
                },
            ],
        },
    },
    {
        ...commonAltOfferProps,
        price: 1400,
        transport: {
            routes: [
                {
                    ...commonRouteProps,
                    id: 'E6484b33783e9ccf133f8a9f846b6f584',
                    direction: RouteDirection.Outbound,
                    fltNo: 'EZY791',
                    arrPt: 'ALC',
                    arrDate: '2022-05-14T08:00:00',
                    depPt: 'LGW',
                    depDate: '2022-05-14T05:00:00',
                },
                {
                    ...commonRouteProps,
                    id: 'E2b98204cde1146241aa1112dcb249ee0',
                    direction: RouteDirection.Inbound,
                    fltNo: 'EZY791',
                    arrPt: 'LGW',
                    arrDate: '2022-05-21T23:00:00',
                    depPt: 'ALC',
                    depDate: '2022-05-21T21:00:00',
                },
            ],
        },
    },
];
