import { IOffer, ITransport } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { RouteDirection } from 'models/enum/RouteDirection';

import {
    areRoutesEqual,
    checkForEqualTransports,
    getFlightNumberWithCarNumber,
    getFlightsReferences,
    getOfferRoutesUniqueId,
    getRoute,
    getSingleRoute,
} from './route.utils';

export const transports = [
    {
        amendmentCharges: 226.0,
        routes: [
            {
                id: 'E0852ea5bdfca278c9dfeabc65fea9917',
                cycDate: '2023-05-24',
                depPt: 'LGW',
                depDate: '2023-05-24T12:20:00+00:00',
                depName: 'London Gatwick',
                depLocation: 'London',
                depTime: '1220',
                arrPt: 'ALC',
                arrDate: '2023-05-24T15:55:00+00:00',
                arrName: 'Alicante',
                arrLocation: 'Spain',
                arrTime: '1555',
                routeCd: 'ALCLGW3T',
                avail: 8,
                fltNo: 'EZY8111',
                car: 'EZY',
                direction: 'outbound',
                isExt: true,
                bkgCls: 'Z',
            },
            {
                id: 'E71e41ec2b0984df98929bdae00cb85a0',
                cycDate: '2023-05-27',
                depPt: 'ALC',
                depDate: '2023-05-27T16:30:00+00:00',
                depName: 'Alicante',
                depLocation: 'Spain',
                depTime: '1630',
                arrPt: 'LGW',
                arrDate: '2023-05-27T18:05:00+00:00',
                arrName: 'London Gatwick',
                arrLocation: 'London',
                arrTime: '1805',
                routeCd: 'LGWALC6T',
                avail: 149,
                fltNo: 'EZY8114',
                car: 'EZY',
                direction: 'inbound',
                isExt: true,
                bkgCls: 'Y',
            },
        ],
        errataFlightInfo: [
            'Errata for Kacper',
            '<span>We will <strong>remove</strong> the <em>refund</em> amount from your <u>holiday</u> balance Please confirm your changes. <span>We will remove the refund amount from your holiday balance Please confirm your changes.</span></span>',
        ],
    },
    {
        amendmentCharges: 234.0,
        routes: [
            {
                id: 'E0852ea5bdfca278c9dfeabc65fea9917',
                cycDate: '2023-05-24',
                depPt: 'LGW',
                depDate: '2023-05-24T12:20:00+00:00',
                depName: 'London Gatwick',
                depLocation: 'London',
                depTime: '1220',
                arrPt: 'ALC',
                arrDate: '2023-05-24T15:55:00+00:00',
                arrName: 'Alicante',
                arrLocation: 'Spain',
                arrTime: '1555',
                routeCd: 'ALCLGW3T',
                avail: 8,
                fltNo: 'EZY8111',
                car: 'EZY',
                direction: 'outbound',
                isExt: true,
                bkgCls: 'Z',
            },
            {
                id: 'E9e93479c993bbd9664765bb6ecd37c81',
                cycDate: '2023-05-27',
                depPt: 'ALC',
                depDate: '2023-05-27T13:40:00+00:00',
                depName: 'Alicante',
                depLocation: 'Spain',
                depTime: '1340',
                arrPt: 'LGW',
                arrDate: '2023-05-27T15:20:00+00:00',
                arrName: 'London Gatwick',
                arrLocation: 'London',
                arrTime: '1520',
                routeCd: 'LGWALC6T',
                avail: 145,
                fltNo: 'EZY8112',
                car: 'EZY',
                direction: 'inbound',
                isExt: true,
                bkgCls: 'Y',
            },
        ],
        errataFlightInfo: [
            'Errata for Kacper',
            '<span>We will <strong>remove</strong> the <em>refund</em> amount from your <u>holiday</u> balance Please confirm your changes. <span>We will remove the refund amount from your holiday balance Please confirm your changes.</span></span>',
        ],
    },
];

describe('route.utils', () => {
    describe('getSingleRoute', () => {
        it('should return latest route', () => {
            const route1 = {
                id: 'test1',
            } as IRoute;
            const route2 = {
                id: 'test2',
            } as IRoute;
            const routes = [route1, route2];

            const res = getSingleRoute(routes, true);

            expect(res).toEqual(route2);
        });

        it('should return earliest route', () => {
            const route1 = {
                id: 'test1',
            } as IRoute;
            const route2 = {
                id: 'test2',
            } as IRoute;
            const routes = [route1, route2];

            const res = getSingleRoute(routes, false);

            expect(res).toEqual(route1);
        });

        it('should not return route if no routes pass ', () => {
            const res = getSingleRoute(undefined as any, false);

            expect(res).toEqual(undefined);
        });

        it('should not return route if no routes pass ', () => {
            const res = getSingleRoute([] as any, false);

            expect(res).toEqual(undefined);
        });

        it('should not return route if no routes pass ', () => {
            const res = getSingleRoute(undefined as any, true);

            expect(res).toEqual(undefined);
        });

        it('should not return route if no routes pass ', () => {
            const res = getSingleRoute([] as any, true);

            expect(res).toEqual(undefined);
        });
    });

    describe('getOfferRoutesUniqueId', () => {
        it('should return routes unique id', () => {
            const offer = {
                transport: {
                    routes: [{ id: 'test1' }, { id: 'test2' }],
                },
            } as IOffer;

            const res = getOfferRoutesUniqueId(offer);

            expect(res).toEqual('test1_test2');
        });
    });

    describe('getRoute', () => {
        it('should return route rode by direction', () => {
            const route = {
                direction: RouteDirection.Outbound,
                id: 'test',
            } as IRoute;
            const res = getRoute(
                {
                    transport: {
                        routes: [route],
                    },
                } as IOffer,
                RouteDirection.Outbound,
            );

            expect(res).toEqual(route);
        });
    });

    describe('areRoutesEqual', () => {
        it('should return true if offers routes are equal', () => {
            const offerA = {
                transport: {
                    routes: [
                        {
                            direction: RouteDirection.Outbound,
                            id: 'otest',
                        },
                        {
                            direction: RouteDirection.Inbound,
                            id: 'itest',
                        },
                    ],
                },
            } as IOffer;
            const offerB = {
                transport: {
                    routes: [
                        {
                            direction: RouteDirection.Outbound,
                            id: 'otest',
                        },
                        {
                            direction: RouteDirection.Inbound,
                            id: 'itest',
                        },
                    ],
                },
            } as IOffer;
            const res = areRoutesEqual(offerA, offerB);

            expect(res).toBeTruthy();
        });

        it('should return false if offers routes are bot equal', () => {
            const offerA = {
                transport: {
                    routes: [
                        {
                            direction: RouteDirection.Outbound,
                            id: 'Aotest',
                        },
                        {
                            direction: RouteDirection.Inbound,
                            id: 'Aitest',
                        },
                    ],
                },
            } as IOffer;
            const offerB = {
                transport: {
                    routes: [
                        {
                            direction: RouteDirection.Outbound,
                            id: 'Botest',
                        },
                        {
                            direction: RouteDirection.Inbound,
                            id: 'Bitest',
                        },
                    ],
                },
            } as IOffer;
            const res = areRoutesEqual(offerA, offerB);

            expect(res).toBeFalsy();
        });
    });

    describe('getFlightsReferences', () => {
        it('should return route rode by direction', () => {
            const routes = [
                { extRefId: 'ref-1', paxs: [{ paxId: '1' }, { paxId: '3' }], direction: RouteDirection.Outbound },
                { extRefId: 'ref-1', paxs: [{ paxId: '1' }, { paxId: '3' }], direction: RouteDirection.Inbound },
                { extRefId: 'ref-2', paxs: [{ paxId: '2' }], direction: RouteDirection.Outbound },
                { extRefId: 'ref-2', paxs: [{ paxId: '2' }], direction: RouteDirection.Inbound },
                { paxs: [{ paxId: '4', externalPNR: 'ref-external' }], direction: RouteDirection.Outbound },
                { paxs: [{ paxId: '5' }], direction: RouteDirection.Outbound },
            ] as IRoute[];
            const res = getFlightsReferences(routes);

            expect(res).toEqual(['ref-1', 'ref-2', 'ref-external', null]);
        });
    });

    describe('checkForEqualTransports', () => {
        it('should return true', () => {
            const isEqual = checkForEqualTransports(transports[0] as ITransport, transports[0] as ITransport);
            expect(isEqual).toBe(true);
        });

        it('should return false', () => {
            const isEqual = checkForEqualTransports(transports[0] as ITransport, transports[1] as ITransport);
            const isEqualWithEmpty = checkForEqualTransports(transports[0] as ITransport, undefined);

            expect(isEqual).toBe(false);
            expect(isEqualWithEmpty).toBe(false);
        });
    });

    describe('getFlightNumberWithCarNumber', () => {
        it('should return flight number if car number in the flight', () => {
            expect(getFlightNumberWithCarNumber({ car: 'EZY', fltNo: 'EZY12345' } as any)).toBe('EZY12345');
        });

        it('should not return flight number if car number is not in the flight', () => {
            expect(getFlightNumberWithCarNumber({ car: 'EZY', fltNo: '12345' } as any)).toBe('EZY12345');
        });

        it('should return flight number if no car number', () => {
            expect(getFlightNumberWithCarNumber({ car: '', fltNo: '12345' } as any)).toBe('12345');
        });

        it('should return empty string if no data', () => {
            expect(getFlightNumberWithCarNumber()).toBe('');
        });
    });
});
