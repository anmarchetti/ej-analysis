import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import LuxuryImageCarousel, { INewHotelCarouselProps } from './LuxuryImageCarousel';

const mockJSSImageNext = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSImageNext(props);

        return <img data-tid='jss-image-next' alt='img' />;
    },
}));

jest.mock('frontend/components/common/PromoBadge', () => ({
    __esModule: true,
    default: () => <div data-tid='promo-badge' />,
}));

let mockProps: INewHotelCarouselProps;

describe('<LuxuryImageCarousel />', () => {
    beforeEach(() => {
        mockProps = {
            imageSrc: 'https://example.com/image.jpg',
            getPhrase: jest.fn(p => p),
            renderCard: <div data-tid='card' />,
            onExpand: jest.fn(),
            onPlayVideo: jest.fn(),
            promoText: 'promo text',
            renderSocialProofing: jest.fn(),
        };
    });

    it('should render without crashing', () => {
        const { container } = render(
            <LuxuryImageCarousel {...mockProps}>
                <div data-tid='children' />
            </LuxuryImageCarousel>,
        );

        expect(container.querySelectorAll('button')).toHaveLength(2);
        expect(mockJSSImageNext).toHaveBeenNthCalledWith(1, {
            className: 'blur',
            field: {
                value: {
                    src: 'https://example.com/image.jpg',
                },
            },
            fill: true,
            id: 'lux-carousel-blur-img',
        });
        expect(mockJSSImageNext).toHaveBeenNthCalledWith(2, {
            className: 'image',
            field: {
                value: {
                    src: 'https://example.com/image.jpg',
                },
            },
            'data-tid': 'lux-carousel-main-img',
            fill: true,
            id: 'lux-carousel-main-img',
        });
        expect(screen.getByTestId('card')).toBeInTheDocument();
        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('promo-badge')).toBeInTheDocument();
    });

    it('should NOT render play button when onPlayVideo is undefined', () => {
        mockProps.onPlayVideo = undefined;

        render(<LuxuryImageCarousel {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.HotelDetailsLabelsViewGallery)).toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.HotelDetailsLabelsPlayVideo)).not.toBeInTheDocument();
    });

    it('should call renderSocialProofing', () => {
        render(<LuxuryImageCarousel {...mockProps} />);

        expect(mockProps.renderSocialProofing).toHaveBeenCalledWith(true);
    });
});
