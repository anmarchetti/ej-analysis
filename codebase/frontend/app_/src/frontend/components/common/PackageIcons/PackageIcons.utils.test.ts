import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import usePackageIcons from './PackageIcons.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/offer.utils', () => ({
    filterPackageIcons: jest.fn(() => [{ name: 'name', iconUrl: 'src' }]),
}));

const mockStores = createMockStores();

describe('usePackageIcons', () => {
    it('should return data when isLuxury is true', () => {
        const { result } = renderHook(() =>
            usePackageIcons({ isLuxury: true, packageIcons: [], transfer: null, extraLuggage: null }),
        );

        expect(result.current).toStrictEqual({
            getPhrase: expect.any(Function),
        });
    });

    it('should return data when isLuxury is false', () => {
        const { result } = renderHook(() =>
            usePackageIcons({ isLuxury: false, packageIcons: [], transfer: null, extraLuggage: null }),
        );

        expect(result.current).toStrictEqual({
            getPhrase: expect.any(Function),
            customItems: [
                {
                    icon: {
                        alt: 'name',
                        src: 'src',
                    },
                    label: 'name',
                },
            ],
        });
    });
});
