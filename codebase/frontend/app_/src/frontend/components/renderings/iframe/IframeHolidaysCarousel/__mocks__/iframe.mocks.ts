import { luggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { mockTouristTax } from 'frontend/__mocks__/touristTax';
import { IOffer } from 'models/data/IOffer';

export const mockIframeOffer = {
    id: '0',
    date: '2023-08-06T00:00:00',
    stay: 7,
    price: 1000,
    pricePP: 500,
    deposit: 120,
    accom: {
        date: '2023-08-06T00:00:00',
        stay: 7,
        id: 'ESDO0007',
        packageId: '2196668721/2/2043/7',
        code: 'ESDO0007',
        unit: [
            {
                code: 'TW01',
                price: 1028,
                pricePP: 514,
                discount: 84.6,
                discountPP: 42.3,
                isFreeForKids: false,
                roomType: {
                    code: 'TW01',
                    title: 'Twin room',
                    stays: [],
                },
                boardType: { code: 'HB', title: 'Half Board' },
                occupation: { adults: 2, children: 0, infants: 0 },
            },
        ],
        isExt: false,
        theme: {
            packageIcons: [
                { key: 'Bags', iconUrl: 'test', name: 'Bags' },
                { key: 'Flight', iconUrl: 'test', name: 'Flight' },
            ],
        },
    },
    transport: {
        routes: [
            {
                id: 'E09a1d1a8d6023321ff1788da397a461d',
                depPt: 'LGW',
                depDate: '2023-08-06T16:45:00+00:00',
                depName: 'London Gatwick',
                arrPt: 'BCN',
                arrDate: '2023-08-06T19:55:00+00:00',
                arrName: 'Barcelona',
                direction: 'outbound',
            },
            {
                id: 'Ec73866f17d0c95ef899d77b05b9c28cf',
                depPt: 'BCN',
                depDate: '2023-08-13T07:40:00+00:00',
                depName: 'Barcelona',
                arrPt: 'LGW',
                arrDate: '2023-08-13T09:10:00+00:00',
                arrName: 'London Gatwick',
                direction: 'inbound',
            },
        ],
    },
    transfers: [{ type: 'SHARED', name: 'Shared Transfer', isHidden: false }],
    hotel: {
        name: 'Hotel 1',
        starRating: '4',
        rating: 4,
        numberOfReviews: 100,
        images: [],
        airports: ['BCN', 'REU'],
        country: { code: 'ES', name: 'Spain' },
        location: { code: 'ESDO', name: 'Costa Dorada' },
        resort: { code: 'ESDOSA', name: 'Salou' },
    },
    hasDistressedFlights: true,
    extraLuggageInfo: luggageInfoMock,
    ...mockTouristTax,
} as unknown as IOffer;
