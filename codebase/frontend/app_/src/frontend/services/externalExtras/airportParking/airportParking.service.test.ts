import { webApiUrls } from 'code/endpoints';
import { ApiError } from 'models/data/ApiError';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';

import { AirportParkingService } from './airportParking.service';

const mockAxiosPost = jest.fn();

jest.mock('axios', () => ({
    create: () => ({
        post: mockAxiosPost,
    }),
    isCancel: () => jest.fn(),
    isAxiosError: jest.fn(),
}));

describe('AirportParkingService', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    const offer = {
        hotel: {
            code: 'test',
        },
    } as IOfferWithoutAltBoards;

    describe('getAirportParking', () => {
        it('should call the api with correct data', async () => {
            mockAxiosPost.mockResolvedValueOnce({ data: 'test' });
            await AirportParkingService.getAirportParkings(offer);

            expect(mockAxiosPost).toHaveBeenCalledWith(
                webApiUrls.getAirportParking(),
                {
                    offer: offer,
                },
                undefined,
            );
        });

        it('should return list of airport parkings in response', async () => {
            const mockedResponse = { data: { airportParkingItems: [{ title: 'A Parking' }] } };
            mockAxiosPost.mockResolvedValueOnce(mockedResponse);
            const airportParkings = await AirportParkingService.getAirportParkings(offer);

            expect(airportParkings).toBe(mockedResponse.data.airportParkingItems);
        });

        it('should throw error when rejected', async () => {
            mockAxiosPost.mockRejectedValueOnce(new ApiError({} as any));

            try {
                await AirportParkingService.getAirportParkings(offer);
            } catch (e) {
                expect(e.message).toBe('');
            }
        });
    });
});
