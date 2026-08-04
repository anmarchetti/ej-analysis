import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import { useLuxuryInternalFlight, useLuxuryInternalFlightDefaultBagsLabel } from './useLuxuryInternalFlight';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useLuxuryInternalFlight', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('should calculate return value based on bookingStore first', () => {
        mockStores.viewBookingStore.isFlightExternal = false;
        mockStores.payBalanceStore.isFlightExternal = false;

        const { result } = renderHook(() => useLuxuryInternalFlight());

        expect(result.current).toBe(false);
    });

    it('should calculate return value based on viewBookingStore after booking store', () => {
        mockStores.bookingStore.isFlightExternal = false;
        mockStores.payBalanceStore.isFlightExternal = false;
        mockStores.viewBookingStore.isLuxuryPackage = true;

        const { result } = renderHook(() => useLuxuryInternalFlight());

        expect(result.current).toBe(false);
    });

    it('should calculate return value based on payBalanceStore after other stores', () => {
        mockStores.bookingStore.isFlightExternal = false;
        mockStores.viewBookingStore.isFlightExternal = false;
        mockStores.payBalanceStore.isLuxuryPackage = true;

        const { result } = renderHook(() => useLuxuryInternalFlight());

        expect(result.current).toBe(false);
    });

    it('should calculate return value based on holidayCreditStore after other stores', () => {
        mockStores.bookingStore.isFlightExternal = false;
        mockStores.viewBookingStore.isFlightExternal = false;
        mockStores.payBalanceStore.isLuxuryPackage = false;
        mockStores.holidayCreditStore.isLuxuryPackage = true;

        const { result } = renderHook(() => useLuxuryInternalFlight());

        expect(result.current).toBe(false);
    });

    it('should return true when it is internal luxury flight', () => {
        mockStores.bookingStore.isFlightExternal = false;
        mockStores.viewBookingStore.isFlightExternal = false;
        mockStores.payBalanceStore.isFlightExternal = false;
        mockStores.holidayCreditStore.isFlightExternal = false;
        mockStores.payBalanceStore.isLuxuryPackage = true;

        const { result } = renderHook(() => useLuxuryInternalFlight());

        expect(result.current).toBe(true);
    });

    it('should return false when flight is external and not luxury', () => {
        mockStores.bookingStore.isFlightExternal = false;
        mockStores.viewBookingStore.isFlightExternal = false;
        mockStores.payBalanceStore.isFlightExternal = false;
        mockStores.holidayCreditStore.isFlightExternal = false;
        mockStores.payBalanceStore.isLuxuryPackage = false;
        const { result } = renderHook(() => useLuxuryInternalFlight());

        expect(result.current).toBe(false);
    });
});

describe('useLuxuryInternalFlightDefaultBagsLabel', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('should return undefined when not a luxury internal flight', () => {
        const { result } = renderHook(() => useLuxuryInternalFlightDefaultBagsLabel(1));

        expect(result.current).toBeUndefined();
    });

    it('should return luxury bags label for 1 bag', () => {
        mockStores.bookingStore.isFlightExternal = false;
        mockStores.viewBookingStore.isFlightExternal = false;
        mockStores.payBalanceStore.isFlightExternal = false;
        mockStores.holidayCreditStore.isFlightExternal = false;
        mockStores.bookingStore.isLuxuryPackage = true;

        const { result } = renderHook(() => useLuxuryInternalFlightDefaultBagsLabel(1));

        expect(result.current).toBe('1 x Luggage.Labels.26kgHoldBagSingular');
    });

    it('should return luxury bags label for multiple bags', () => {
        mockStores.bookingStore.isFlightExternal = false;
        mockStores.viewBookingStore.isFlightExternal = false;
        mockStores.payBalanceStore.isFlightExternal = false;
        mockStores.holidayCreditStore.isFlightExternal = false;
        mockStores.bookingStore.isLuxuryPackage = true;

        const { result } = renderHook(() => useLuxuryInternalFlightDefaultBagsLabel(3));

        expect(result.current).toBe('3 x Luggage.Labels.26kgHoldBagPlural');
    });
});
