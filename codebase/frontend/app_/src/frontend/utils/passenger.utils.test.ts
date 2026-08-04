import { mockBooking, mockSeats } from 'frontend/__mocks__';
import { IPassengerFlights } from 'models/data/AncillariesInfo';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IGuestPassenger, ILeadPassenger } from 'models/data/ILeadPassenger';
import { IRoute } from 'models/data/IRoute';
import { IPassengerSeat } from 'models/data/ISeatMapStore';
import { GuestType } from 'models/enum/GuestType';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import {
    extractPassengerSeats,
    getFullPassengerName,
    getGuestsAmount,
    getLeadPassengerAddress,
    getPassengersByPaxIndexes,
    groupPassengersByFlightRefs,
} from './passenger.utils';

const getPhraseMocked = jest.fn(p => p);

describe('passenger.utils', () => {
    const passengers = [
        { index: '1', firstName: 'Ann', lastName: 'Brown', title: 'Mrs', type: GuestType.Adult },
        { index: '2', firstName: 'Nik', lastName: 'Child', title: 'Mr', type: GuestType.Child },
        { index: '3', firstName: 'Guest 3', lastName: 'Brown', title: 'Mr', type: GuestType.Adult },
        { index: '4', firstName: 'Guest 4', type: GuestType.Adult },
        { index: '5', firstName: 'Guest 5', type: GuestType.Adult },
    ] as IGuestPassenger[];

    describe('getFullPassengerName', () => {
        it('should return name with title for Adult', () => {
            const result = getFullPassengerName(passengers[0], getPhraseMocked);

            expect(result).toEqual(`${SitecoreDictionary.GlobalsLabelsTitlesMrs} Ann Brown`);
        });

        it('should return name WITHOUT title for Child', () => {
            const result = getFullPassengerName(passengers[1], getPhraseMocked);

            expect(result).toEqual('Nik Child');
        });
    });

    describe('getLeadPassengerAddress', () => {
        it('should return only one address', () => {
            const result = getLeadPassengerAddress({
                address: 'address-1',
            } as ILeadPassenger);

            expect(result).toEqual('address-1');
        });

        it('should return two addresses', () => {
            const result = getLeadPassengerAddress({ address: 'address-1', address2: 'address-2' } as ILeadPassenger);

            expect(result).toEqual('address-1, address-2');
        });
    });

    describe('groupPassengersByFlightRefs', () => {
        const routes = [
            { extRefId: 'ref-1', paxs: [{ paxId: '1' }, { paxId: '3' }], direction: RouteDirection.Outbound },
            { extRefId: 'ref-1', paxs: [{ paxId: '1' }, { paxId: '3' }], direction: RouteDirection.Inbound },
            { extRefId: 'ref-2', paxs: [{ paxId: '2' }], direction: RouteDirection.Outbound },
            { extRefId: 'ref-2', paxs: [{ paxId: '2' }], direction: RouteDirection.Inbound },
            { paxs: [{ paxId: '4', externalPNR: 'ref-external' }], direction: RouteDirection.Outbound },
            { paxs: [{ paxId: '5' }], direction: RouteDirection.Outbound },
        ] as IRoute[];

        it('Should group passengers by flight refs', () => {
            const result = groupPassengersByFlightRefs(passengers, routes);
            expect(result.size).toEqual(4);
            expect(result.get('ref-1')).toEqual([passengers[0], passengers[2]]);
            expect(result.get('ref-2')).toEqual([passengers[1]]);
            expect(result.get('ref-external')).toEqual([passengers[3]]);
            expect(result.get(null)).toEqual([passengers[4]]);
        });

        it('Should return empty map if no paxs info', () => {
            const result = groupPassengersByFlightRefs(passengers, [
                { extRefId: 'ref-1', direction: RouteDirection.Outbound },
            ] as IRoute[]);
            expect(result.size).toEqual(0);
        });

        it('Should return empty map if no routes', () => {
            const result = groupPassengersByFlightRefs([], []);
            expect(result.size).toEqual(0);
        });
    });

    describe('getPassengersByPaxIndexes', () => {
        it('Should return passenger for each pax index', () => {
            const result = getPassengersByPaxIndexes(['1', '4'], passengers);
            expect(result).toEqual([passengers[0], passengers[3]]);
        });

        it('Should not return anything if no passenger with such index', () => {
            const result = getPassengersByPaxIndexes(['100'], passengers);
            expect(result).toEqual([]);
        });
    });

    describe('getGuestsAmount', () => {
        it('should return correct configuration of guests in booking with only adults', () => {
            mockBooking.guests = mockBooking.guests.splice(0, 2);
            expect(getGuestsAmount(mockBooking.guests)).toEqual({ adults: 2, children: 0, infants: 0 });
        });

        it('should return correct configuration of guests in booking when there are children and infants', () => {
            const booking = {
                ...mockBooking,
                guests: [...mockBooking.guests, { type: GuestType.Child }, { type: GuestType.Infant }],
            } as IBookingInfo;

            expect(getGuestsAmount(booking.guests)).toEqual({ adults: 2, children: 1, infants: 1 });
        });
    });

    describe('extractPassengerSeats', () => {
        const seats = mockSeats as IPassengerSeat[];

        it('should correctly extract inbound and outbound seats', () => {
            const passengersByQueue: IPassengerFlights[] = [
                {
                    inboundPassenger: { seat: seats[0] },
                    outboundPassenger: { seat: seats[1] },
                },
                {
                    inboundPassenger: { seat: seats[1] },
                    outboundPassenger: { seat: seats[0] },
                },
            ];

            const result = extractPassengerSeats(passengersByQueue);

            expect(result).toEqual({
                inboundSeats: [seats[0], seats[1]],
                outboundSeats: [seats[1], seats[0]],
            });
        });

        it('should handle empty input array', () => {
            const passengersByQueue = [];

            const result = extractPassengerSeats(passengersByQueue);

            expect(result).toEqual({
                inboundSeats: [],
                outboundSeats: [],
            });
        });
    });
});
