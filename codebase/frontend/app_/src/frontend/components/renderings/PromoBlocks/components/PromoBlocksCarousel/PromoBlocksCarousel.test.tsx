import React from 'react';
import { render, screen } from '@testing-library/react';

import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';

import PromoBlocksCarousel from './PromoBlocksCarousel';

const mockShouldHidePromoBlock = jest.fn();
const mockGetPromoBlocksResponsiveByTheme = jest.fn();

jest.mock('frontend/components/renderings/PromoBlocks/PromoBlocks.utils', () => ({
    ...jest.requireActual('frontend/components/renderings/PromoBlocks/PromoBlocks.utils'),
    shouldHidePromoBlock: (...args) => mockShouldHidePromoBlock(...args),
    getPromoBlocksResponsiveByTheme: (...args) => mockGetPromoBlocksResponsiveByTheme(...args),
}));

const mockCarouselWrapperProps = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: props => {
        mockCarouselWrapperProps(props);

        return <div data-tid='carousel-wrapper'>{props.children}</div>;
    },
}));

jest.mock('frontend/components/common/SliderButtonsGroup', () => ({
    __esModule: true,
    default: () => <div data-tid='slider-buttons' />,
}));

const mockPromoBlockSingleItemProps = jest.fn();
jest.mock('frontend/components/renderings/PromoBlocks/components/PromoBlocksSingleItem/PromoBlocksSingleItem', () => ({
    __esModule: true,
    PromoBlocksSingleItem: props => {
        mockPromoBlockSingleItemProps(props);

        return <div data-tid='promo-block-single-item' data-id={props.fields?.id} onClick={props.onClick} />;
    },
}));

const mockPromoBlocksCarouselItemsProps = jest.fn();
jest.mock('./components/PromoBlocksCarouselItems/PromoBlocksCarouselItems', () => ({
    __esModule: true,
    PromoBlocksCarouselItems: props => {
        mockPromoBlocksCarouselItemsProps(props);
        console.log({ mockPromoBlocksCarouselItemsProps: props });

        return <div data-tid='promo-items' />;
    },
}));

const mockUseXSMobileViewport = jest.fn();
const mockUseMoreThenTabletViewport = jest.fn();
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useXSMobileViewport: () => mockUseXSMobileViewport(),
    useMoreThenTabletViewport: () => mockUseMoreThenTabletViewport(),
}));

const item = (id: string): IPromoBlockFields => ({ id } as IPromoBlockFields);

let mockProps;

describe('PromoBlocksCarousel', () => {
    beforeEach(() => {
        mockGetPromoBlocksResponsiveByTheme.mockReturnValue({
            desktop: { breakpoint: { max: 9999, min: 1024 }, items: 3 },
            tablet: { breakpoint: { max: 1024, min: 768 }, items: 2 },
            mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
        });

        mockUseXSMobileViewport.mockReturnValue(false);
        mockUseMoreThenTabletViewport.mockReturnValue(true);

        mockProps = {
            theme: PromoBlocksThemes.Big,
            blockFields: [item('a'), [item('b'), item('c')]],
            handleClickItem: jest.fn(),
            shouldShowShard: true,
            withDarkOverlay: true,
        };
    });

    it('should compute totalItemsCount with nested arrays and call getIsPromoBlockToBeShown with correct args', () => {
        mockShouldHidePromoBlock.mockReturnValue(true);

        render(<PromoBlocksCarousel {...mockProps} />);

        expect(mockShouldHidePromoBlock).toHaveBeenCalledWith(PromoBlocksThemes.Big, 3, false, true);

        const root = screen.getByTestId('promo-blocks-slider');

        expect(root).toHaveClass('promo-blocks-slider show');
    });

    it('should set container class mobile-show when haveToBeShown=false', () => {
        mockProps.blockFields = [item('a'), item('b')];
        mockProps.shouldShowShard = false;
        mockShouldHidePromoBlock.mockReturnValue(false);

        render(<PromoBlocksCarousel {...mockProps} />);

        const root = screen.getByTestId('promo-blocks-slider');
        expect(root).toHaveClass('promo-blocks-slider mobile-show');
    });

    it('should call getPromoBlocksResponsiveByTheme(theme) and pass responsive to CarouselWrapper', () => {
        mockShouldHidePromoBlock.mockReturnValue(true);
        mockProps.blockFields = [item('a')];
        mockProps.shouldShowShard = false;
        mockProps.theme = PromoBlocksThemes.Small;

        render(<PromoBlocksCarousel {...mockProps} />);

        expect(mockGetPromoBlocksResponsiveByTheme).toHaveBeenCalledWith(PromoBlocksThemes.Small);

        expect(mockCarouselWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({
                responsive: expect.any(Object),
                arrows: false,
                containerClass: 'carousel-container',
                customButtonGroup: expect.any(Object),
            }),
        );
    });

    it('should set infinite/showDots=true when blockFields.length > 1', () => {
        mockShouldHidePromoBlock.mockReturnValue(true);
        mockProps.blockFields = [item('a'), item('b')];
        mockProps.shouldShowShard = false;

        render(<PromoBlocksCarousel {...mockProps} />);

        expect(mockCarouselWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({
                infinite: true,
                showDots: true,
            }),
        );
    });

    it('should set infinite/showDots=false when blockFields.length <= 1', () => {
        mockShouldHidePromoBlock.mockReturnValue(true);

        mockProps.blockFields = [item('a')];
        mockProps.shouldShowShard = false;

        render(<PromoBlocksCarousel {...mockProps} />);

        expect(mockCarouselWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({
                infinite: false,
                showDots: false,
            }),
        );
    });

    it('should render PromoBlockSingleItem for each block when isSmall=false and click calls handleClickItem(i, item)', () => {
        mockShouldHidePromoBlock.mockReturnValue(true);
        mockProps.blockFields = [item('a'), item('b'), item('c')];

        render(<PromoBlocksCarousel {...mockProps} />);

        expect(screen.getAllByTestId('promo-items')).toHaveLength(3);
        expect(mockPromoBlocksCarouselItemsProps).toHaveBeenCalledWith({
            items: { id: 'c' },
            baseIndex: 2,
            handleClickItem: mockProps.handleClickItem,
            theme: PromoBlocksThemes.Big,
            shouldShowShard: true,
            withDarkOverlay: true,
            pillAlignment: undefined,
            titlePlacement: undefined,
        });
    });

    it('should update haveToBeShown when store flags change (extraSmall/large affect getIsPromoBlockToBeShown args)', () => {
        mockShouldHidePromoBlock.mockReturnValue(true);

        mockProps.blockFields = [item('a'), item('b')];
        mockProps.shouldShowShard = undefined;
        mockProps.wasRerendered = false;
        mockProps.withDarkOverlay = undefined;

        const { rerender } = render(<PromoBlocksCarousel {...mockProps} />);

        expect(mockShouldHidePromoBlock).toHaveBeenLastCalledWith(PromoBlocksThemes.Big, 2, false, true);

        mockUseXSMobileViewport.mockReturnValue(true);
        mockUseMoreThenTabletViewport.mockReturnValue(false);

        mockProps.blockFields = [item('a'), item('b')];
        mockProps.shouldShowShard = undefined;
        mockProps.wasRerendered = false;
        mockProps.withDarkOverlay = undefined;

        rerender(<PromoBlocksCarousel {...mockProps} />);

        expect(mockShouldHidePromoBlock).toHaveBeenLastCalledWith(PromoBlocksThemes.Big, 2, true, false);
    });
});
