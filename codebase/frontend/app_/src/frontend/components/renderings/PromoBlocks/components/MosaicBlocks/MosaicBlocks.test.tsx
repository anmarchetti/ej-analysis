import * as React from 'react';
import { render, screen, within } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { PromoBlocksMaxItems } from 'models/enum/PromoBlocksThemes';
import { getMockedPromoBlockItem } from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/components/__mocks__/promoBlockItem';

import MosaicBlocks from './MosaicBlocks';

const mockMosaicCarousel = jest.fn();
jest.mock('./components/MosaicCarousel/MosaicCarousel', () => ({
    __esModule: true,
    default: props => {
        mockMosaicCarousel(props);

        return <div data-tid='mosaic-carousel' />;
    },
}));

const mockMosaicOneRow = jest.fn();
jest.mock('./components/MosaicOneRow/MosaicOneRow', () => ({
    __esModule: true,
    default: props => {
        mockMosaicOneRow(props);

        return <div data-tid='mosaic-one-row' />;
    },
}));

const mockMosaicTwoRows = jest.fn();
jest.mock('./components/MosaicTwoRows/MosaicTwoRows', () => ({
    __esModule: true,
    default: props => {
        mockMosaicTwoRows(props);

        return <div data-tid='mosaic-two-rows' />;
    },
}));

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, dataId, ...mocks }) => (
        <div data-tid={dataId} {...mocks}>
            RouterLink.{children}
        </div>
    ),
}));

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children }) => <div data-tid='tax-tooltip'>{children}</div>,
}));

let mockUseXSMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useXSMobileViewport: () => mockUseXSMobileViewport,
}));

const createStores = () =>
    createMockStores({
        layoutStore: { isTouristTaxEnabled: true, isMosaicComponentLivePriceEnabled: true },
    });

const createMocks = () => ({
    items: Array(1).fill({ ...getMockedPromoBlockItem(), isLivePriceValid: true }),
    onClickItem: jest.fn(),
    displayNumberOfNights: true,
});

let mockStores;
let mocks;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<MosaicBlocks />', () => {
    beforeEach(() => {
        mocks = createMocks();
        mockStores = createStores();

        mockUseXSMobileViewport = false;
    });

    it('should NOT render when no items', () => {
        mocks.items = [];
        const { container } = render(<MosaicBlocks {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render One Row when item count is less than PromoBlocksMaxItems.Mosaic', () => {
        const { getByTestId } = render(<MosaicBlocks {...mocks} />);

        expect(getByTestId('mosaic-one-row')).toBeInTheDocument();
        expect(mockMosaicOneRow).toHaveBeenCalledWith({
            displayNumberOfNights: true,
            items: mocks.items,
            onClickItem: expect.any(Function),
        });
    });

    it('should render Two Row when item count is equal to PromoBlocksMaxItems.Mosaic', () => {
        mocks.items = Array(PromoBlocksMaxItems.Mosaic).fill(getMockedPromoBlockItem());
        const { getByTestId } = render(<MosaicBlocks {...mocks} />);

        expect(getByTestId('mosaic-two-rows')).toBeInTheDocument();
        expect(mockMosaicTwoRows).toHaveBeenCalledWith({
            displayNumberOfNights: true,
            items: mocks.items,
            onClickItem: expect.any(Function),
        });
    });

    describe('mosaic carousel view', () => {
        it('should render MosaicCarousel when item count is greater than PromoBlocksMaxItems.Mosaic', () => {
            mocks.items = Array(PromoBlocksMaxItems.Mosaic + 1).fill(getMockedPromoBlockItem());
            const { getByTestId } = render(<MosaicBlocks {...mocks} />);

            expect(getByTestId('mosaic-carousel')).toBeInTheDocument();
            expect(mockMosaicCarousel).toHaveBeenCalledWith({
                displayNumberOfNights: true,
                items: mocks.items,
                onClickItem: expect.any(Function),
            });
        });

        it('should render MosaicCarousel when item count is greater than PromoBlocksMaxItems.MobileView and isXSMobileViewport is true', () => {
            mocks.items = Array(PromoBlocksMaxItems.MobileView + 1).fill(getMockedPromoBlockItem());
            mockUseXSMobileViewport = true;
            const { getByTestId } = render(<MosaicBlocks {...mocks} />);

            expect(getByTestId('mosaic-carousel')).toBeInTheDocument();
        });
    });

    describe('link', () => {
        it('should render link when link prop is defined', () => {
            mocks.link = { value: { href: '/link', text: 'Link to', linktype: 'external' } };
            const { getByTestId } = render(<MosaicBlocks {...mocks} />);
            const { getByText } = within(getByTestId('link-block'));

            expect(getByText(`RouterLink.${mocks.link.value.text}`)).toHaveClass('btn btn--outlined btnLink');
            expect(getByTestId('mosaic-block-link')).toBeInTheDocument();
        });

        it('should NOT render link when link prop is not defined', () => {
            const { queryByTestId } = render(<MosaicBlocks {...mocks} />);

            expect(queryByTestId('link-block')).toBeInTheDocument();
            expect(queryByTestId('link')).not.toBeInTheDocument();
        });
    });

    it('should render tax info when isTouristTaxEnabled and isMosaicComponentLivePriceEnabled are true', () => {
        render(<MosaicBlocks {...mocks} />);

        expect(screen.getByTestId('tax-tooltip')).toBeInTheDocument();
    });

    it('should NOT render tax info when isTouristTaxEnabled is false', () => {
        mockStores.layoutStore.isTouristTaxEnabled = false;
        render(<MosaicBlocks {...mocks} />);

        expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
    });

    it('should NOT render tax info when isMosaicComponentLivePriceEnabled is false', () => {
        mockStores.layoutStore.isMosaicComponentLivePriceEnabled = false;
        render(<MosaicBlocks {...mocks} />);

        expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
    });
});
