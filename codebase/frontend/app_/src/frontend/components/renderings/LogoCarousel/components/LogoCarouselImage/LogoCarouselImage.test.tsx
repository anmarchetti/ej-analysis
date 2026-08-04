import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import LogoCarouselImage, { TLogoCarouselImageProps } from './LogoCarouselImage';

const createProps = (): TLogoCarouselImageProps => ({
    image: mockSitecoreField(mockSitecoreImageField('image', 'imageDescription')),
    isActive: false,
});

const mockJSSImageComponent = jest.fn();
let props;

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageComponent(props);

        return <div data-tid='image' />;
    },
}));

describe('<LogoCarouselImage />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should standard render', () => {
        render(<LogoCarouselImage {...props} />);

        expect(
            screen.getByTestId('logo-carousel-image-wrapper').getAttribute('data-item-active'),
        ).not.toBeInTheDocument();
        expect(mockJSSImageComponent).toBeCalledWith(
            expect.objectContaining({
                field: {
                    value: {
                        alt: 'imageDescription',
                        src: 'image',
                    },
                },
            }),
        );
    });

    it('should not render the image when it is undefined in sitecore', () => {
        props.image = undefined;

        render(<LogoCarouselImage {...props} />);

        expect(mockJSSImageComponent).not.toBeCalled();
    });

    it('should not render the image when src is undefined', () => {
        props.image.value.src = undefined;

        render(<LogoCarouselImage {...props} />);

        expect(mockJSSImageComponent).not.toBeCalled();
    });

    it('should contain active attribute when isActive prop is true', () => {
        props.isActive = true;

        render(<LogoCarouselImage {...props} />);

        expect(screen.getByTestId('logo-carousel-image-wrapper').getAttribute('data-item-active')).toBe('active');
    });

    it('should contain data-slide-index attribute when dataSlideIndex prop is defined', () => {
        props.dataSlideIndex = 4;

        render(<LogoCarouselImage {...props} />);

        expect(screen.getByTestId('logo-carousel-image-wrapper').getAttribute('data-slide-index')).toBe(
            `${props.dataSlideIndex}`,
        );
    });
});
