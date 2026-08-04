import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { imageMock } from 'frontend/__mocks__';
import { getFallbackImage, getImage, getNextImageSrc } from 'frontend/utils/image.utils';
import { ImageSize } from 'models/enum/ImageSize';

import HotelImage, { IHotelImageProps } from './HotelImage';

expect.extend(toHaveNoViolations);

jest.mock('frontend/utils/image.utils');

const mockImageProps = jest.fn();
jest.mock('frontend/components/common/AppImage', () => ({
    __esModule: true,
    default: props => {
        mockImageProps(props);

        return <div data-tid='image' onClick={props.onError} />;
    },
}));

let mockProps: IHotelImageProps;

describe('<HotelImage />', () => {
    beforeEach(() => {
        mockProps = {
            image: imageMock,
            className: 'className',
            defaultSize: ImageSize.Medium,
            fallbackImage: 'fallbackImage',
            notRenderEmptyImage: true,
        };

        jest.mocked(getImage).mockReturnValue('image-url');
        jest.mocked(getNextImageSrc).mockImplementation(image => image);
    });

    it('Should render component', () => {
        const { container } = render(<HotelImage {...mockProps} />);

        expect(screen.getByTestId('image')).toBeInTheDocument();
        expect(mockImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                src: 'image-url',
                fallbackImage: 'fallbackImage',
                style: { objectPosition: 'center center', objectFit: 'cover' },
                fill: true,
                onError: expect.any(Function),
                alt: '',
            }),
        );

        expect(container.querySelector('.container.className')).toBeInTheDocument();
        expect(container.querySelector('.container.className')).toHaveAttribute(
            'style',
            'background-image: url(fallbackImage);',
        );

        expect(getImage).toHaveBeenCalledWith(mockProps.image, mockProps.defaultSize);
    });

    it('Should render Image if no url, fallbackImage exists, and notRenderEmptyImage props is true', () => {
        jest.mocked(getImage).mockReturnValueOnce('');

        render(<HotelImage {...mockProps} />);

        expect(screen.getByTestId('image')).toBeInTheDocument();
        expect(mockImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                src: '',
                fallbackImage: 'fallbackImage',
                style: { objectPosition: 'center center', objectFit: 'cover' },
                fill: true,
                onError: expect.any(Function),
                alt: '',
            }),
        );
    });

    it('Should render Image if url exists, but fallbackImage is not exist, and notRenderEmptyImage props is true', () => {
        mockProps.fallbackImage = undefined;

        render(<HotelImage {...mockProps} />);

        expect(screen.getByTestId('image')).toBeInTheDocument();
        expect(mockImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                src: 'image-url',
                fallbackImage: undefined,
                style: { objectPosition: 'center center', objectFit: 'cover' },
                fill: true,
                onError: expect.any(Function),
                alt: '',
            }),
        );
    });

    it('Should render Image if url not exists, fallbackImage is not exist, and notRenderEmptyImage props is false', () => {
        mockProps.notRenderEmptyImage = false;
        mockProps.fallbackImage = undefined;
        jest.mocked(getImage).mockReturnValueOnce('');

        render(<HotelImage {...mockProps} />);

        expect(screen.getByTestId('image')).toBeInTheDocument();
        expect(mockImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                src: '',
                fallbackImage: undefined,
                style: { objectPosition: 'center center', objectFit: 'cover' },
                fill: true,
                onError: expect.any(Function),
                alt: '',
            }),
        );
    });

    it('Should NOT be rendered if no url and fallbackImage, and notRenderEmptyImage props is true', () => {
        jest.mocked(getImage).mockReturnValue('');
        mockProps.fallbackImage = undefined;

        const { container } = render(<HotelImage {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should call onError handler in case when error happened', async () => {
        jest.mocked(getFallbackImage).mockReturnValue('error-image');

        render(<HotelImage {...mockProps} />);

        const image = screen.getByTestId('image');

        await userEvent.click(image);

        expect(getFallbackImage).toHaveBeenCalledWith(mockProps.image, mockProps.defaultSize, mockProps.fallbackImage);
        expect(mockImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                src: 'error-image',
                fallbackImage: 'fallbackImage',
                style: { objectPosition: 'center center', objectFit: 'cover' },
                fill: true,
                onError: expect.any(Function),
                alt: '',
            }),
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<HotelImage {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
