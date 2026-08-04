import { renderHook } from '@testing-library/react';

import useBasePath from './useBasePath';

const createStores = () => ({
    layoutStore: {
        basePath: '/en/holidays',
        lang: 'en',
        isTradePortal: false,
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('useBasePath', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should return the current base path when lang is not defined', () => {
        const { result } = renderHook(() => useBasePath());

        expect(result.current).toBe(mockStores.layoutStore.basePath);
    });

    it('should return the current base path when lang is the same as the current lang', () => {
        const { result } = renderHook(() => useBasePath(mockStores.layoutStore.lang));

        expect(result.current).toBe(mockStores.layoutStore.basePath);
    });

    it('should return a new base path for the given lang', () => {
        const { result } = renderHook(() => useBasePath('ch-fr'));

        expect(result.current).toBe('/ch-fr/vacances');
    });
});
