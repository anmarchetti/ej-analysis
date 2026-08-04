import { logger } from 'frontend/services/logging';
import { ApiError } from 'models/data/ApiError';
import { IGroupBookingInfo } from 'frontend/components/renderings/TradePortalGroupBooking/data/models';

import groupBookingService from './groupBooking.service';

const mockAxiosPost = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        post: mockAxiosPost,
    }),
    isCancel: () => jest.fn(),
}));
jest.mock('../logging');

describe('groupBooking.service', () => {
    describe('saveGroupBookingInformation', () => {
        it('should save group booking data', async () => {
            const booking = {
                abtaNumber: 'abtaNumber',
                additionalDetails: 'additionalDetails',
                agentName: 'agentName',
                boardBasis: 'boardBasis',
            } as IGroupBookingInfo;

            await groupBookingService.saveGroupBookingInformation(booking);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                'http://test/api/v1.0/trade-portal/group-booking',
                booking,
                undefined,
            );
        });

        it('should log group booking error', async () => {
            mockAxiosPost.mockRejectedValueOnce(
                new ApiError({
                    response: {
                        data: {
                            code: 'API-ERR-000002',
                            error: 'some message',
                        },
                    },
                } as any),
            );

            try {
                await groupBookingService.saveGroupBookingInformation({} as IGroupBookingInfo);
            } catch (e) {
                expect(logger.error).toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: 'Failed to save group booking',
                    }),
                );
            }
        });
    });
});
