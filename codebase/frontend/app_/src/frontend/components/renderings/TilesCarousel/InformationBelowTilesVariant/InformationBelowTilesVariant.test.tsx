import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as mediaQueryUtils from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import * as utils from 'frontend/components/renderings/TilesCarousel/InformationBelowTilesVariant/InformationBelowTilesVariant.utils';
import {
    ICarouselTile,
    ITilesCarouselWithClassNamesProps,
    TilesCarouselVariant,
} from 'frontend/components/renderings/TilesCarousel/TilesCarouselInterfaces';

import InformationBelowTilesVariant, { CAROUSEL_RESPONSIVE } from './InformationBelowTilesVariant';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='text'>{field.value}</div>,
}));

const mockDescriptionContainer = jest.fn();
jest.mock(
    'frontend/components/renderings/TilesCarousel/InformationBelowTilesVariant/components/DescriptionContainer',
    () => ({
        __esModule: true,
        default: props => {
            mockDescriptionContainer(props);

            return <div data-tid='description-container' />;
        },
    }),
);

const mockCarouselWrapper = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children, customButtonGroup, afterChange, ...props }) => {
        mockCarouselWrapper(props);

        return (
            <button data-tid='carousel' onClick={afterChange} onKeyDown={jest.fn()}>
                {children}
                {customButtonGroup}
            </button>
        );
    },
}));

jest.mock('frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup', () => ({
    __esModule: true,
    default: () => <div data-tid='carousel-buttons-group' />,
}));

jest.mock(
    'frontend/components/renderings/TilesCarousel/InformationBelowTilesVariant/components/InformationBelowVariantTile',
    () => ({
        __esModule: true,
        default: ({ onClick }) => (
            <button onClick={onClick} onKeyDown={jest.fn()} data-tid='information-below-variant-tile' />
        ),
    }),
);

let mockProps: ITilesCarouselWithClassNamesProps;
const buildTileFields = (index: number): ISitecoreCompositeField<ICarouselTile> => ({
    fields: {
        Image: mockSitecoreField(mockSitecoreImageField(`Image${index}`)),
        Description: mockSitecoreField(`Description${index}`),
        Title: mockSitecoreField(`Tile Title${index}`),
        Subtitle: mockSitecoreField(`Tile Subtitle${index}`),
    },
    id: `tile-${index}`,
});

const mockUseMediaQuery = jest.spyOn(mediaQueryUtils, 'useMediaQuery');
const mockGetNewSelectedIndexOnSlide = jest.spyOn(utils, 'getNewSelectedIndexOnSlide');

describe('<InformationBelowTilesVariant />', () => {
    beforeEach(() => {
        mockGetNewSelectedIndexOnSlide.mockReturnValue(2);
        mockProps = {
            Title: mockSitecoreField('Title'),
            Tiles: [buildTileFields(1), buildTileFields(2), buildTileFields(3), buildTileFields(4)],
            titleClassName: 'title-class',
            wrapperClassName: 'wrapper-class',
            titleTag: 'h2',
            IsLuxuryExclusive: mockSitecoreField(false),
            Variant: mockSitecoreField(TilesCarouselVariant.InformationBelowTiles),
            UseHotelTiles: mockSitecoreField(false),
        };
    });

    describe('Desktop', () => {
        beforeEach(() => {
            mockUseMediaQuery.mockReturnValue(false);
        });

        it('should render title, CarouselWrapper, InformationBelowVariantTile, CarouselButtonsGroup and DescriptionContainer', () => {
            const { container } = render(<InformationBelowTilesVariant {...mockProps} />);

            expect(screen.getByTestId('text')).toHaveTextContent('Title');
            expect(screen.getByTestId('carousel')).toBeInTheDocument();
            expect(screen.getAllByTestId('information-below-variant-tile')).toHaveLength(4);
            expect(screen.getByTestId('carousel-buttons-group')).toBeInTheDocument();

            expect(screen.getAllByTestId('description-container')).toHaveLength(4);
            expect(container.querySelectorAll('.hidden')).toHaveLength(3);

            expect(mockCarouselWrapper).toHaveBeenCalledWith({
                arrows: false,
                dotListClass: 'carouselDotList',
                infinite: false,
                partialVisible: false,
                responsive: CAROUSEL_RESPONSIVE,
                showDots: true,
            });
        });

        it('should select new tile on handleSlideChange', async () => {
            render(<InformationBelowTilesVariant {...mockProps} />);

            expect(mockDescriptionContainer).toHaveBeenCalledWith({
                Description: mockSitecoreField('Description1'),
                Subtitle: mockSitecoreField('Tile Subtitle1'),
                selectedIndex: 0,
            });

            await userEvent.click(screen.getByTestId('carousel'));

            expect(mockGetNewSelectedIndexOnSlide).toHaveBeenCalled();
            expect(mockDescriptionContainer).toHaveBeenCalledWith({
                Description: mockSitecoreField('Description3'),
                Subtitle: mockSitecoreField('Tile Subtitle3'),
                selectedIndex: 2,
            });
        });

        it('should select new tile on tile click', async () => {
            render(<InformationBelowTilesVariant {...mockProps} />);

            expect(mockDescriptionContainer).toHaveBeenCalledWith({
                Description: mockSitecoreField('Description1'),
                Subtitle: mockSitecoreField('Tile Subtitle1'),
                selectedIndex: 0,
            });

            await userEvent.click(screen.getAllByTestId('information-below-variant-tile')[2]);

            expect(mockGetNewSelectedIndexOnSlide).toHaveBeenCalled();
            expect(mockDescriptionContainer).toHaveBeenCalledWith({
                Description: mockSitecoreField('Description3'),
                Subtitle: mockSitecoreField('Tile Subtitle3'),
                selectedIndex: 2,
            });
        });

        it('should render without carousel when isCarousel is false', () => {
            mockProps.Tiles = [buildTileFields(1)];

            render(<InformationBelowTilesVariant {...mockProps} />);

            expect(screen.getByTestId('text-on-image-carousel-wrapper')).toHaveClass('carouselWrapper wrapper');
            expect(mockCarouselWrapper).toHaveBeenCalledWith({
                arrows: false,
                dotListClass: 'carouselDotList',
                infinite: false,
                partialVisible: false,
                responsive: CAROUSEL_RESPONSIVE,
                showDots: false,
            });
        });
    });

    describe('Tablet', () => {
        beforeEach(() => {
            mockUseMediaQuery.mockReturnValueOnce(false).mockReturnValueOnce(true);
        });

        it('should render carousel when Tiles.length > 2', () => {
            mockProps.Tiles = [buildTileFields(1), buildTileFields(2), buildTileFields(3)];

            render(<InformationBelowTilesVariant {...mockProps} />);

            expect(screen.getByTestId('text-on-image-carousel-wrapper')).toHaveClass('carouselWrapper');
            expect(mockCarouselWrapper).toHaveBeenCalledWith({
                arrows: false,
                dotListClass: 'carouselDotList',
                infinite: false,
                partialVisible: false,
                responsive: CAROUSEL_RESPONSIVE,
                showDots: true,
            });
        });

        it('should NOT render carousel when Tiles.length < 2', () => {
            mockProps.Tiles = [buildTileFields(1)];

            render(<InformationBelowTilesVariant {...mockProps} />);

            expect(screen.getByTestId('text-on-image-carousel-wrapper')).toHaveClass('carouselWrapper wrapper');
            expect(mockCarouselWrapper).toHaveBeenCalledWith({
                arrows: false,
                dotListClass: 'carouselDotList',
                infinite: false,
                partialVisible: false,
                responsive: CAROUSEL_RESPONSIVE,
                showDots: false,
            });
        });
    });

    describe('Mobile', () => {
        beforeEach(() => {
            mockUseMediaQuery.mockReturnValueOnce(true).mockReturnValueOnce(true);
        });

        it('should render carousel when Tiles.length > 1', () => {
            mockProps.Tiles = [buildTileFields(1), buildTileFields(2)];

            render(<InformationBelowTilesVariant {...mockProps} />);

            expect(screen.getByTestId('text-on-image-carousel-wrapper')).toHaveClass('carouselWrapper');
            expect(mockCarouselWrapper).toHaveBeenCalledWith({
                arrows: false,
                dotListClass: 'carouselDotList',
                infinite: false,
                partialVisible: true,
                responsive: CAROUSEL_RESPONSIVE,
                showDots: true,
            });
        });

        it('should NOT render carousel when Tiles.length = 1', () => {
            mockProps.Tiles = [buildTileFields(1)];

            render(<InformationBelowTilesVariant {...mockProps} />);

            expect(screen.getByTestId('text-on-image-carousel-wrapper')).toHaveClass('carouselWrapper wrapper');
            expect(mockCarouselWrapper).toHaveBeenCalledWith({
                arrows: false,
                dotListClass: 'carouselDotList',
                infinite: false,
                partialVisible: false,
                responsive: CAROUSEL_RESPONSIVE,
                showDots: false,
            });
        });
    });
});
