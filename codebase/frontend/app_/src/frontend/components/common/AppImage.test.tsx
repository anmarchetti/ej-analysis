import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import useStore from 'frontend/hooks/useStore';
import { FALLBACK_IMAGE_URL } from 'frontend/utils/image.utils';

import AppImage from './AppImage';

jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const mockImage = jest.fn();
jest.mock('next/image', () => (props: any) => {
    mockImage(props?.loader(props.src));

    return <img {...props} data-tid='next-image' alt='test-alt' />;
});

describe('<Image />', () => {
    const testSrc = 'test/image.jpg';

    const createStores = (editMode = false, previewMode = false) => ({
        layoutStore: {
            isEditMode: editMode,
            isPreviewMode: previewMode,
        },
    });

    beforeEach(() => {
        (useStore as jest.Mock).mockImplementation(selector => selector(createStores()));
    });

    it('should render the image with correct src when no error', () => {
        const { getByTestId } = render(<AppImage src={testSrc} alt='Test image' />);

        const image = getByTestId('next-image');

        expect(image).toHaveAttribute('src', testSrc);
    });

    it('should render the fallback image when there is an error', () => {
        const { getByTestId } = render(<AppImage src={testSrc} alt='Test image' />);

        const image = getByTestId('next-image');

        fireEvent.error(image);

        expect(image).toHaveAttribute('src', FALLBACK_IMAGE_URL);
    });

    it('should use custom fallback image when provided', () => {
        const testFallbackImage = 'test/fallback.jpg';

        const { getByTestId } = render(<AppImage src={testSrc} fallbackImage={testFallbackImage} alt='Test image' />);

        const image = getByTestId('next-image');

        fireEvent.error(image);

        expect(image).toHaveAttribute('src', testFallbackImage);
    });

    it('should set loader from src if in preview mode', () => {
        (useStore as jest.Mock).mockImplementation(selector => selector(createStores(false, true)));

        render(<AppImage src={testSrc} alt='Test image' />);

        expect(mockImage).toHaveBeenCalledWith(testSrc);
    });

    it('should set loader from src if in edit mode', () => {
        (useStore as jest.Mock).mockImplementation(selector => selector(createStores(true)));

        render(<AppImage src={testSrc} alt='Test image' />);

        expect(mockImage).toHaveBeenCalledWith(testSrc);
    });

    it('should set loader from custom loader if not in edit or preview mode', () => {
        render(<AppImage src={testSrc} alt='Test image' />);

        expect(mockImage).not.toHaveBeenCalledWith(testSrc);
    });

    it('should return null if src is not provided', () => {
        const { container } = render(<AppImage src='' alt='Test image' />);

        expect(container.firstChild).toBeNull();
    });
});
