import { renderHook } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import useCrisisBanner, { IUseCrisisBannerProps } from './useCrisisBanner';

let mockStores;
let mockProps: IUseCrisisBannerProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/airports.utils');

const mockRouteUtil = getRouteByDirection as jest.MockedFn<typeof getRouteByDirection>;
jest.mocked(getRouteByDirection).mockImplementation(routes => ({
    outbound: routes[0],
    inbound: routes[1],
}));

let id = 1;
const createAirportItem = (code: string, name: string) => ({
    id: `${id++}`,
    fields: { Code: { value: code }, Name: { value: name } },
});

const createProps = () => ({
    impactedAirports: [createAirportItem('ACE', 'Lanzarote')],
    alwaysVisible: mockSitecoreField(false),
});

describe('useCrisisBanner', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            viewBookingStore: { booking: mockBooking },
        });
    });

    it('should return booking is impacted when passed impacted airport in current booking', async () => {
        const { result } = renderHook(() => useCrisisBanner(mockProps));

        expect(result.current).toBe(true);
    });

    it('should return booking is impacted when passed multiple impacted airports in current booking', () => {
        mockProps.impactedAirports = [createAirportItem('ACE', 'Lanzarote'), createAirportItem('LGW', 'Luton')];

        const { result } = renderHook(() => useCrisisBanner(mockProps));

        expect(result.current).toBe(true);
    });

    it('should return booking is not impacted when passed multiple impacted airports not in current booking', () => {
        mockProps.impactedAirports = [createAirportItem('WAW', 'Warsaw Chopin'), createAirportItem('LGW', 'Luton')];

        const { result } = renderHook(() => useCrisisBanner(mockProps));

        expect(result.current).toBe(false);
    });

    it('should return booking is not impacted when passed nothing', async () => {
        const { result } = renderHook(() => useCrisisBanner({}));

        expect(result.current).toBe(false);
    });

    it('should return that booking is not impacted when passed empty booking', () => {
        mockStores.viewBookingStore.booking = null;
        const { result } = renderHook(() => useCrisisBanner(mockProps));

        expect(result.current).toBe(false);
    });

    it('should return that booking is impacted when passed alwaysImpacted', () => {
        mockProps.alwaysVisible!.value = true;
        const { result } = renderHook(() => useCrisisBanner(mockProps));

        expect(result.current).toBe(true);
    });

    it('should call getRouteByDirection with [] if no data in booking', () => {
        mockStores.viewBookingStore.booking.package = null;
        renderHook(() => useCrisisBanner(mockProps));

        expect(getRouteByDirection).toHaveBeenCalledWith([]);
    });

    it('should return booking not impacted if no routes in booking', () => {
        mockRouteUtil.mockImplementationOnce(() => ({
            outbound: undefined,
            inbound: undefined,
        }));

        const { result } = renderHook(() => useCrisisBanner(mockProps));

        expect(result.current).toBe(false);
    });
});
