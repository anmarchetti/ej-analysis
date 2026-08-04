import { getGeoPosition } from './geo.utils';

(global.navigator as any).geolocation = {
    getCurrentPosition: jest.fn(),
};

describe('geo utils', () => {
    describe('getGeoPosition', () => {
        it('should resolve with the position when geolocation succeeds', async () => {
            const mockPosition = {
                coords: {
                    latitude: 51.1,
                    longitude: 45.3,
                    accuracy: 10,
                },
                timestamp: 1234567890,
            } as GeolocationPosition;

            jest.spyOn(global.navigator.geolocation, 'getCurrentPosition').mockImplementation(success => {
                success(mockPosition);
            });

            const position = await getGeoPosition();
            expect(position).toEqual(mockPosition);
        });

        it('should reject with an error when geolocation fails', async () => {
            const mockError = {
                code: 1,
                message: 'User denied Geolocation',
            } as GeolocationPositionError;

            jest.spyOn(global.navigator.geolocation, 'getCurrentPosition').mockImplementation((_success, error) => {
                error?.(mockError);
            });

            await expect(getGeoPosition()).rejects.toEqual(mockError);
        });
    });
});
