import React from 'react';
import { render, screen } from '@testing-library/react';

import * as viewportUtils from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import {
    ICarouselTile,
    ITilesCarouselWithClassNamesProps,
    TilesCarouselVariant,
} from 'frontend/components/renderings/TilesCarousel/TilesCarouselInterfaces';

import TextOnImageVariant, { CAROUSEL_RESPONSIVE } from './TextOnImageVariant';

const createProps = (): ITilesCarouselWithClassNamesProps => ({
    IsLuxuryExclusive: mockSitecoreField(false),
    Tiles: [{}, {}, {}, {}] as ISitecoreCompositeField<ICarouselTile>[],
    Title: mockSitecoreField('test'),
    Variant: mockSitecoreField(TilesCarouselVariant.TextOnImage),
    titleClassName: '',
    wrapperClassName: '',
    titleTag: 'p',
    UseHotelTiles: mockSitecoreField(false),
});

let mockProps: ITilesCarouselWithClassNamesProps;

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextComponent(props);

        return <div data-tid='text' />;
    },
}));

const mockCarouselWrapper = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children, customButtonGroup, ...props }) => {
        mockCarouselWrapper(props);

        return (
            <div data-tid='carousel'>
                {children}
                {customButtonGroup}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup', () => ({
    __esModule: true,
    default: () => <div data-tid='carousel-buttons-group' />,
}));

jest.mock('frontend/components/renderings/TilesCarousel/TextOnImageVariant/components/TextOnImageTile', () => ({
    __esModule: true,
    default: () => <div data-tid='text-on-image-tile' />,
}));

const mockUseMobileViewport = jest.spyOn(viewportUtils, 'useMobileViewport');

describe('<TextOnImageVariant />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockUseMobileViewport.mockReturnValue(false);
    });

    it('should render desktop carousel when isMobile is false and isCarousel is true', () => {
        render(<TextOnImageVariant {...mockProps} />);

        expect(screen.getByTestId('tiles-carousel-text-on-image-wrapper')).not.toHaveClass('padding-16');
        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(screen.getByTestId('text-on-image-carousel-wrapper')).not.toHaveClass('wrapper');
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getAllByTestId('text-on-image-tile')).toHaveLength(4);
        expect(screen.getByTestId('carousel-buttons-group')).toBeInTheDocument();

        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.Title,
            className: 'title',
            tag: 'p',
            'data-tid': 'text-on-image-title',
        });
        expect(mockCarouselWrapper).toHaveBeenCalledWith({
            responsive: CAROUSEL_RESPONSIVE,
            infinite: false,
            arrows: false,
            showDots: true,
            partialVisible: false,
            dotListClass: 'carouselDotList',
        });
    });

    it('should render with params from props', () => {
        mockProps.titleTag = 'h1';
        mockProps.wrapperClassName = 'test-wrapper';
        mockProps.titleClassName = 'test-title';

        render(<TextOnImageVariant {...mockProps} />);

        expect(screen.getByTestId('tiles-carousel-text-on-image-wrapper')).toHaveClass('test-wrapper');

        expect(mockTextComponent).toHaveBeenCalledWith({
            field: mockProps.Title,
            className: 'title test-title',
            tag: 'h1',
            'data-tid': 'text-on-image-title',
        });
    });

    it('should render desktop carousel without dots when isMobile is false and isCarousel is false', () => {
        mockProps.Tiles = [{}, {}] as ISitecoreCompositeField<ICarouselTile>[];

        render(<TextOnImageVariant {...mockProps} />);

        expect(screen.getByTestId('text-on-image-carousel-wrapper')).toHaveClass('wrapper');
        expect(screen.getAllByTestId('text-on-image-tile')).toHaveLength(2);

        expect(mockCarouselWrapper).toHaveBeenCalledWith({
            responsive: CAROUSEL_RESPONSIVE,
            infinite: false,
            arrows: false,
            showDots: false,
            partialVisible: false,
            dotListClass: 'carouselDotList',
        });
    });

    it('should render mobile carousel when isMobile is true and isCarousel is true', () => {
        mockUseMobileViewport.mockReturnValue(true);

        render(<TextOnImageVariant {...mockProps} />);

        expect(screen.queryByTestId('carousel-buttons-group')).not.toBeInTheDocument();
        expect(mockCarouselWrapper).toHaveBeenCalledWith({
            responsive: CAROUSEL_RESPONSIVE,
            infinite: false,
            arrows: false,
            showDots: true,
            partialVisible: true,
            dotListClass: 'carouselDotList',
        });
    });

    it('should render mobile carousel without dots and partialVisible when isMobile is true and isCarousel is false', () => {
        mockUseMobileViewport.mockReturnValue(true);
        mockProps.Tiles = [{}] as ISitecoreCompositeField<ICarouselTile>[];

        render(<TextOnImageVariant {...mockProps} />);

        expect(screen.queryByTestId('carousel-buttons-group')).not.toBeInTheDocument();
        expect(mockCarouselWrapper).toHaveBeenCalledWith({
            responsive: CAROUSEL_RESPONSIVE,
            infinite: false,
            arrows: false,
            showDots: false,
            partialVisible: false,
            dotListClass: 'carouselDotList',
        });
    });
});
