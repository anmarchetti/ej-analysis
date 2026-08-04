import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';
import { promoBlockItemsMocks } from 'frontend/components/renderings/PromoBlocks/__mocks__/promoBlocksItems';
import { promoBlockParamsMocks } from 'frontend/components/renderings/PromoBlocks/__mocks__/promoBlocksParams';

import { IPromoBlockGroupProps, PromoBlocksGroup } from './PromoBlocksGroup';

const mockMosaicBlocksProps = jest.fn();
jest.mock('../MosaicBlocks/MosaicBlocks', () => ({
    __esModule: true,
    default: props => {
        mockMosaicBlocksProps(props);

        return <div data-tid='mosaic-blocks' />;
    },
}));

const mockIconTextCarouselProps = jest.fn();
jest.mock('frontend/components/renderings/PromoBlocks/components/IconTextCarousel/IconTextCarousel', () => ({
    __esModule: true,
    default: props => {
        mockIconTextCarouselProps(props);

        return <div data-tid='icon-text-carousel' />;
    },
}));

const mockFeaturedDestinationsProps = jest.fn();
jest.mock('frontend/components/renderings/PromoBlocks/components/FeaturedDestinations/FeaturedDestinations', () => ({
    __esModule: true,
    default: props => {
        mockFeaturedDestinationsProps(props);

        return <div data-tid='featured-destinations' />;
    },
}));

const mockIconTextBlocksAltProps = jest.fn();
jest.mock('../IconTextBlocksAlt', () => ({
    __esModule: true,
    default: props => {
        mockIconTextBlocksAltProps(props);

        return <div data-tid='icon-text-blocks-alt' />;
    },
}));

const mockTextAltBlocksProps = jest.fn();
jest.mock('../TextAltBlocks', () => ({
    __esModule: true,
    default: props => {
        mockTextAltBlocksProps(props);

        return <div data-tid='text-alt-blocks' />;
    },
}));

const mockVerticalStripeBlocksProps = jest.fn();
jest.mock('../VerticalStripeBlocks', () => ({
    __esModule: true,
    default: props => {
        mockVerticalStripeBlocksProps(props);

        return <div data-tid='vertical-stripe-blocks' />;
    },
}));

const mockLinkTileWithBorderProps = jest.fn();
jest.mock('../LinkTileWithBorder/LinkTileWithBorder', () => ({
    __esModule: true,
    default: props => {
        mockLinkTileWithBorderProps(props);

        return <div data-tid='link-tile-with-border' />;
    },
}));

const resetProps = (): IPromoBlockGroupProps => ({
    items: promoBlockItemsMocks,
    Link: mockSitecoreField(mockSitecoreLinkField('/test-url', 'Test Link')),
    handleClickItem: jest.fn(),
    displayNumberOfNights: true,
    isMultiRow: false,
    titleClassName: 'titleClassName',
    params: { ...promoBlockParamsMocks },
});

let mockProps: IPromoBlockGroupProps;

describe('PromoBlockGroup', () => {
    beforeEach(() => {
        mockProps = resetProps();
    });

    it('should render MosaicBlocks', () => {
        mockProps.params.Theme = PromoBlocksThemes.Mosaic;
        mockProps.displayNumberOfNights = true;

        render(<PromoBlocksGroup {...mockProps} />);

        expect(screen.getByTestId('mosaic-blocks')).toBeInTheDocument();

        expect(mockMosaicBlocksProps).toHaveBeenCalledWith({
            items: mockProps.items,
            onClickItem: mockProps.handleClickItem,
            link: mockProps.Link,
            displayNumberOfNights: true,
            titleClassName: mockProps.titleClassName,
        });
    });

    it('should pass displayNumberOfNights=false when prop is undefined (Mosaic)', () => {
        mockProps.params.Theme = PromoBlocksThemes.Mosaic;
        mockProps.displayNumberOfNights = undefined;

        render(<PromoBlocksGroup {...mockProps} />);

        expect(mockMosaicBlocksProps).toHaveBeenCalledWith(
            expect.objectContaining({
                displayNumberOfNights: false,
            }),
        );
    });

    it('should render IconTextCarousel when theme is IconTextCarousel', () => {
        mockProps.params.Theme = PromoBlocksThemes.IconTextCarousel;

        render(<PromoBlocksGroup {...mockProps} />);

        expect(screen.getByTestId('icon-text-carousel')).toBeInTheDocument();
        expect(mockIconTextCarouselProps).toHaveBeenCalledWith({
            items: mockProps.items,
            params: mockProps.params,
            titleClassName: mockProps.titleClassName,
        });
    });

    it('should render FeaturedDestinations when theme is FeaturedDestinationsVariant', () => {
        mockProps.params.Theme = PromoBlocksThemes.FeaturedDestinationsVariant;

        render(<PromoBlocksGroup {...mockProps} />);

        expect(screen.getByTestId('featured-destinations')).toBeInTheDocument();
        expect(mockFeaturedDestinationsProps).toHaveBeenCalledWith({
            items: mockProps.items,
            titleClassName: mockProps.titleClassName,
        });
    });

    it('should render IconTextBlocksAlt when theme is IconTextAlt and pass multiRow=true/false', () => {
        mockProps.params.Theme = PromoBlocksThemes.IconTextAlt;
        mockProps.isMultiRow = true;

        render(<PromoBlocksGroup {...mockProps} />);

        expect(screen.getByTestId('icon-text-blocks-alt')).toBeInTheDocument();
        expect(mockIconTextBlocksAltProps).toHaveBeenCalledWith({
            items: mockProps.items,
            multiRow: true,
            titleClassName: mockProps.titleClassName,
        });

        mockProps.params.Theme = PromoBlocksThemes.IconTextAlt;
        mockProps.isMultiRow = false;

        render(<PromoBlocksGroup {...mockProps} />);
        expect(mockIconTextBlocksAltProps).toHaveBeenLastCalledWith({
            items: mockProps.items,
            multiRow: false,
            titleClassName: mockProps.titleClassName,
        });
    });

    it('should render TextBlockAlts when theme is TextAlt', () => {
        mockProps.params.Theme = PromoBlocksThemes.TextAlt;

        render(<PromoBlocksGroup {...mockProps} />);

        expect(screen.getByTestId('text-alt-blocks')).toBeInTheDocument();
        expect(mockTextAltBlocksProps).toHaveBeenCalledWith({
            items: mockProps.items,
            titleClassName: mockProps.titleClassName,
        });
    });

    it('should render VerticalStripeBlocks when theme is VerticalStripe', () => {
        mockProps.params.Theme = PromoBlocksThemes.VerticalStripe;

        render(<PromoBlocksGroup {...mockProps} />);

        expect(screen.getByTestId('vertical-stripe-blocks')).toBeInTheDocument();
        expect(mockVerticalStripeBlocksProps).toHaveBeenCalledWith({
            items: mockProps.items,
            titleClassName: mockProps.titleClassName,
            isButtonOutlined: false,
        });
    });

    it('should render LinkTileWithBorder when theme is LinkTileWithBorder', () => {
        mockProps.params.Theme = PromoBlocksThemes.LinkTileWithBorder;

        render(<PromoBlocksGroup {...mockProps} />);

        expect(screen.getByTestId('link-tile-with-border')).toBeInTheDocument();
        expect(mockLinkTileWithBorderProps).toHaveBeenCalledWith({
            items: mockProps.items,
            titleClassName: mockProps.titleClassName,
        });
    });

    it('should return null for unknown theme', () => {
        mockProps.params.Theme = PromoBlocksThemes.TitleUnderImage;

        const { container } = render(<PromoBlocksGroup {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });
});
