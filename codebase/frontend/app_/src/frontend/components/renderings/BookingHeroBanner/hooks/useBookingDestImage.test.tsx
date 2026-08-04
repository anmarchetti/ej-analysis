import { waitFor } from '@testing-library/dom';
import { renderHook } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';

import useBookingDestImage from './useBookingDestImage';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/services/booking.service');
const mockLoadDestImage = bookingService.loadDestinationImage as jest.MockedFn<
    typeof bookingService.loadDestinationImage
>;

describe('useBookingDestImage', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createMockStores();
    });

    it('should return correct url', async () => {
        mockLoadDestImage.mockResolvedValue('dest.jpg');
        const { result } = renderHook(() => useBookingDestImage(mockBooking));

        await waitFor(() =>
            expect(bookingService.loadDestinationImage).toHaveBeenCalledWith(mockBooking.hotel?.location.code),
        );

        await waitFor(() => expect(result.current).toEqual('url("dest.jpg"), url("HotelFallbackImage")'));
    });

    it('should return fallback image url if request rejected', async () => {
        mockLoadDestImage.mockRejectedValue('Error');
        const { result } = renderHook(() => useBookingDestImage(mockBooking));

        await waitFor(() =>
            expect(bookingService.loadDestinationImage).toHaveBeenCalledWith(mockBooking.hotel?.location.code),
        );

        await waitFor(() => expect(result.current).toEqual('url("HotelFallbackImage")'));
    });

    it('should return undefined if no booking', () => {
        const { result } = renderHook(() => useBookingDestImage(null));

        expect(bookingService.loadDestinationImage).not.toHaveBeenCalled();

        expect(result.current).toBeUndefined();
    });
});
