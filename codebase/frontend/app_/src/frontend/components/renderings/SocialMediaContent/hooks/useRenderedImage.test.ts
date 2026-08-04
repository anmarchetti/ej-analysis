import { act, renderHook } from '@testing-library/react';

import { getImageDataUri } from 'frontend/components/renderings/SocialMediaContent/utils/rendering.utils';

import { useRenderedImage } from './useRenderedImage';

jest.mock('frontend/components/renderings/SocialMediaContent/utils/rendering.utils', () => ({
    getImageDataUri: jest.fn().mockResolvedValue('src'),
}));

describe('useRenderedImage', () => {
    it('should return initial image src as null', () => {
        const { result } = renderHook(() => useRenderedImage(false, false, false));

        expect(result.current[0]).toBeNull();
    });

    it('should return initial image src after renderImage is called', async () => {
        const { result } = renderHook(() => useRenderedImage(false, false, false));
        const renderImage = result.current[1];

        expect(result.current[0]).toBeNull();

        await act(async () => {
            await renderImage({ hasEjLogo: true, hasPriceLabel: true, hasUMLogo: false });
        });

        expect(getImageDataUri).toHaveBeenCalledTimes(1);
        expect(result.current[0]).toBe('src');
    });

    it('should call getImageDataUri 2 times', async () => {
        const { result } = renderHook(() => useRenderedImage(false, false, false));

        const renderImage = result.current[1];

        await act(async () => {
            await renderImage({ hasEjLogo: true, hasPriceLabel: true, hasUMLogo: false });
            await renderImage({ hasEjLogo: true, hasPriceLabel: false, hasUMLogo: false });
        });

        expect(getImageDataUri).toHaveBeenCalledTimes(2);
    });
});
