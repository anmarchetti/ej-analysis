import { mockBooking, mockInboundFlight } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { logger } from 'frontend/services/logging';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { IRoute } from 'models/data/IRoute';

import { fetchErrataOfferMessages } from './AmendPageServiceMessages.utils';

jest.mock('frontend/services/booking.service');

jest.mock('frontend/services/logging', () => ({
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('frontend/utils/airports.utils', () => ({
    getRouteByDirection: jest.fn().mockReturnValue({ inbound: { depPt: mockInboundFlight.depPt } }),
}));

describe('AmendPageServiceMessages.utils', () => {
    it('Should return empty array if booking is not provided', async () => {
        const result = await fetchErrataOfferMessages(null);
        expect(result).toEqual([]);
    });

    it('Should call getHotelErrataMessages when called with booking parameters', async () => {
        (bookingService.getHotelErrataMessages as jest.MockedFn<any>).mockResolvedValue(['message 1', 'message 2']);

        const result = await fetchErrataOfferMessages(mockBooking);

        expect(bookingService.getHotelErrataMessages).toHaveBeenCalledWith(
            expect.objectContaining({
                codes: [mockBooking.package.accom.code, mockInboundFlight.depPt],
                offerDate: mockBooking.package.accom.startDate,
            }),
        );
        expect(result[0]).toBe('message 1');
        expect(result[1]).toBe('message 2');
    });

    it('Should call getHotelErrataMessages with overrides when provided', async () => {
        (bookingService.getHotelErrataMessages as jest.MockedFn<any>).mockResolvedValue(['message 1', 'message 2']);

        const accomCodeOverride = 'test';
        const dateOverride = '2024-11-01';

        const result = await fetchErrataOfferMessages(mockBooking, {
            accomCode: accomCodeOverride,
            date: dateOverride,
        });

        expect(bookingService.getHotelErrataMessages).toHaveBeenCalledWith(
            expect.objectContaining({
                codes: [accomCodeOverride, mockInboundFlight.depPt],
                offerDate: dateOverride,
            }),
        );
        expect(result[0]).toBe('message 1');
        expect(result[1]).toBe('message 2');
    });

    it('Should getHotelErrataMessages be called with empty inbound flight', async () => {
        (getRouteByDirection as jest.MockedFn<typeof getRouteByDirection>).mockReturnValueOnce({
            inbound: { depPt: '' } as IRoute,
            outbound: { depPt: '' } as IRoute,
        });

        await fetchErrataOfferMessages(mockBooking);

        expect(bookingService.getHotelErrataMessages).toHaveBeenCalledWith(
            expect.objectContaining({
                codes: [mockBooking.package.accom.code, ''],
                offerDate: mockBooking.package.accom.startDate,
            }),
        );
    });

    it('Should return errata messages with booking parameter', async () => {
        (bookingService.getHotelErrataMessages as jest.MockedFn<any>).mockResolvedValue(['message 1', 'message 2']);

        const result = await fetchErrataOfferMessages(mockBooking);

        expect(bookingService.getHotelErrataMessages).toHaveBeenCalledWith(
            expect.objectContaining({
                codes: [mockBooking.package.accom.code, mockInboundFlight.depPt],
                offerDate: mockBooking.package.accom.startDate,
            }),
        );
        expect(result[0]).toBe('message 1');
        expect(result[1]).toBe('message 2');
    });

    it('Return an empty array if an error was caught', async () => {
        (bookingService.getHotelErrataMessages as jest.MockedFn<any>).mockRejectedValue(new Error('test'));

        const result = await fetchErrataOfferMessages(mockBooking);

        expect(result).toEqual([]);
        expect(logger.error).toHaveBeenCalled();
    });
});
