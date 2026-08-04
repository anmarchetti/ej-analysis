import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';

import { IPromoBlockSingleItemProps, PromoBlocksSingleItem } from './PromoBlocksSingleItem';

const mockGenerateImageSizes = jest.fn();
jest.mock('frontend/components/renderings/PromoBlocks/PromoBlocks.utils', () => ({
    ...jest.requireActual('frontend/components/renderings/PromoBlocks/PromoBlocks.utils'),
    generateImageSizes: (...args) => mockGenerateImageSizes(...args),
    PROMO_BLOCK_DEFAULT_RESPONSIVE: {
        desktop: { breakpoint: { max: 9999, min: 1024 }, items: 3 },
        tablet: { breakpoint: { max: 1024, min: 768 }, items: 2 },
        mobile: { breakpoint: { max: 768, min: 0 }, items: 1 },
    },
}));

const mockPromoBlockItemBigProps = jest.fn();
jest.mock(
    'frontend/components/renderings/PromoBlocks/components/PromoBlocksSingleItem/components/PromoBlockItemBig/PromoBlockItemBig',
    () => ({
        __esModule: true,
        default: props => {
            mockPromoBlockItemBigProps(props);

            return <div data-tid='promo-block-item-big' className={props.itemClass} onClick={props.onClick} />;
        },
    }),
);

const mockPromoBlockItemSmallProps = jest.fn();
jest.mock('./components/PromoBlockItemSmall/PromoBlockItemSmall', () => ({
    __esModule: true,
    default: props => {
        mockPromoBlockItemSmallProps(props);

        return <div data-tid='promo-block-item-small' className={props.itemClass} onClick={props.onClick} />;
    },
}));

const mockFeaturedFacilityProps = jest.fn();
jest.mock('frontend/components/renderings/PromoBlocks/components/FeaturedFacility', () => ({
    __esModule: true,
    FeaturedFacility: props => {
        mockFeaturedFacilityProps(props);

        return <div data-tid='featured-facility' className={props.itemClass} />;
    },
}));

const mockTitleUnderImageBlockProps = jest.fn();
jest.mock('frontend/components/renderings/PromoBlocks/components/TitleUnderImageBlock', () => ({
    __esModule: true,
    TitleUnderImageBlock: props => {
        mockTitleUnderImageBlockProps(props);

        return <div data-tid='title-under-image-block' className={props.itemClass} />;
    },
}));

const fieldsMock = { id: 'id-1' } as IPromoBlockFields;

const resetMocks = (): IPromoBlockSingleItemProps => ({
    theme: PromoBlocksThemes.Big,
    fields: fieldsMock,
    onClick: jest.fn(),
    shouldShowShard: true,
    withDarkOverlay: true,
    titleClassName: 'titleClassName',
});

let props: IPromoBlockSingleItemProps;

describe('PromoBlockSingleItem', () => {
    beforeEach(() => {
        props = resetMocks();
        mockGenerateImageSizes.mockReturnValue('sizes-mock');
    });

    it('should render PromoBlocksItemBig with showPillLabel and correct classes + imageSizes', () => {
        render(<PromoBlocksSingleItem {...props} />);

        const promoBlockItem = screen.getByTestId('promo-block-item-big');

        expect(promoBlockItem).toBeInTheDocument();
        expect(mockPromoBlockItemBigProps).toHaveBeenCalledWith({
            item: fieldsMock,
            showPillLabel: true,
            onClick: props.onClick,
            imageSizes: 'sizes-mock',
            itemClass: undefined,
            shouldShowShard: true,
            withDarkOverlay: true,
            titleClassName: props.titleClassName,
        });

        expect(mockGenerateImageSizes).toHaveBeenCalledWith(
            expect.objectContaining({
                desktop: expect.any(Object),
                tablet: expect.any(Object),
                mobile: expect.any(Object),
            }),
        );

        fireEvent.click(promoBlockItem);

        expect(props.onClick).toHaveBeenCalled();
    });

    it('should NOT include shard/dark-overlay classes when flags are false', () => {
        props.shouldShowShard = false;
        props.withDarkOverlay = false;
        render(<PromoBlocksSingleItem {...props} />);

        expect(mockGenerateImageSizes).toHaveBeenCalledWith(
            expect.objectContaining({
                desktop: expect.any(Object),
                tablet: expect.any(Object),
                mobile: expect.any(Object),
            }),
        );
    });

    it('should render PromoBlockItemSmall WITHOUT showPillLabel and with correct classes + imageSizes', () => {
        props.theme = PromoBlocksThemes.Small;
        render(<PromoBlocksSingleItem {...props} />);

        expect(screen.getByTestId('promo-block-item-small')).toBeInTheDocument();
        expect(mockPromoBlockItemSmallProps).toHaveBeenCalledWith(
            expect.not.objectContaining({
                showPillLabel: true,
            }),
        );
        expect(mockPromoBlockItemSmallProps).toHaveBeenCalledWith({
            item: fieldsMock,
            onClick: props.onClick,
            imageSizes: 'sizes-mock',
            itemClass: undefined,
            shouldShowShard: true,
            withDarkOverlay: true,
            titleClassName: props.titleClassName,
        });
    });

    it('should render FeaturedFacility with correct classes and dark overlay', () => {
        props.theme = PromoBlocksThemes.FeaturedFacilities;
        render(<PromoBlocksSingleItem {...props} />);

        const featuredFacilityItem = screen.getByTestId('featured-facility');

        expect(featuredFacilityItem).toBeInTheDocument();
        expect(featuredFacilityItem).toHaveClass(
            'promo-block-card title-under-image-block promo-block--featured-facilities promo-block--dark-overlay',
        );

        expect(mockFeaturedFacilityProps).toHaveBeenCalledWith(
            expect.objectContaining({
                item: fieldsMock,
                titleClassName: props.titleClassName,
            }),
        );
    });

    it('should render TitleUnderImageBlock with fixed itemClass', () => {
        props.theme = PromoBlocksThemes.TitleUnderImage;
        render(<PromoBlocksSingleItem {...props} />);

        expect(screen.getByTestId('title-under-image-block')).toBeInTheDocument();

        expect(mockTitleUnderImageBlockProps).toHaveBeenCalledWith({
            item: fieldsMock,
            itemClass: 'promo-block-card title-under-image-block',
            titleClassName: props.titleClassName,
        });
    });
});
