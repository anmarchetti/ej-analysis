import { renderHook } from '@testing-library/react';
import { toJS } from 'mobx';

import { mockTransfers } from 'frontend/__mocks__';

import useTransfers, { useSelectedTransfers } from './useTransfers';

jest.mock('mobx', () => ({
    ...jest.requireActual('mobx'),
    toJS: jest.fn(value => value),
}));

describe('useTransfers', () => {
    it('should return all the transfers with "NoTransfer" type at the end and currently selected transfer code', () => {
        const { result } = renderHook(() => useTransfers([mockTransfers[0]], mockTransfers, 2));
        expect(toJS).toHaveBeenCalledWith(mockTransfers[0]);

        const [transfers, selectedTransferCode] = result.current;

        expect(transfers).toEqual([
            { ...mockTransfers[1], price: -30, pricePP: -15 },
            { ...mockTransfers[0], price: 0, pricePP: 0, smallSeSurcharge: 20, largeSeSurcharge: 50 },
            { ...mockTransfers[2], price: -20, pricePP: -10 },
        ]);

        expect(selectedTransferCode).toBe('TRANSFER_CODE');
    });

    it('should remove NO_TRANSFER from transfers when isFreeKids and at least 1 child', () => {
        const { result } = renderHook(() => useTransfers([mockTransfers[0]], mockTransfers, 2, true, true));
        expect(toJS).toHaveBeenCalledWith(mockTransfers[0]);

        const [transfers] = result.current;

        expect(transfers).toEqual([
            { ...mockTransfers[1], price: -30, pricePP: -15 },
            { ...mockTransfers[0], price: 0, pricePP: 0, smallSeSurcharge: 20, largeSeSurcharge: 50 },
        ]);
    });
});

describe('useSelectedTransfers', () => {
    it('should return only one selected transfers', () => {
        const { result } = renderHook(() => useSelectedTransfers([mockTransfers[0]], mockTransfers, 2));

        expect(result.current).toEqual([{ ...mockTransfers[1], price: -30, pricePP: -15 }]);
    });
});
