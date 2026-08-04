import React from 'react';
import { render } from '@testing-library/react';

import { PromoBlocksMaxItems } from 'models/enum/PromoBlocksThemes';
import { getMockedPromoBlockItem } from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/components/__mocks__/promoBlockItem';

import { MosaicCarousel } from './MosaicCarousel';

jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='carousel'>{children}</div>,
}));

const mockMosaicOneRow = jest.fn();
jest.mock('../MosaicOneRow/MosaicOneRow', () => ({
    __esModule: true,
    default: props => {
        mockMosaicOneRow(props);

        return <div data-tid='mosaic-one-row' />;
    },
}));

const mockMosaicTwoRows = jest.fn();
jest.mock('../MosaicTwoRows/MosaicTwoRows', () => ({
    __esModule: true,
    default: props => {
        mockMosaicTwoRows(props);

        return <div data-tid='mosaic-two-rows' />;
    },
}));

const createStores = () => ({
    appStore: { isScreenExtraSmall: false },
});

const resetMocks = () => ({
    items: Array(1).fill(getMockedPromoBlockItem()),
    onClickItem: jest.fn(),
    displayNumberOfNights: true,
});

let mocks;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<MosaicCarousel />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render One Row when item count is less than PromoBlocksMaxItems.Mosaic', () => {
        const { queryByTestId } = render(<MosaicCarousel {...mocks} />);

        expect(queryByTestId('carousel')).toBeInTheDocument();
        expect(queryByTestId('mosaic-one-row')).toBeInTheDocument();
        expect(queryByTestId('mosaic-two-rows')).not.toBeInTheDocument();
        expect(mockMosaicOneRow).toHaveBeenCalledWith({
            displayNumberOfNights: true,
            items: mocks.items,
            onClickItem: expect.any(Function),
        });
    });

    it('should render Two Row when item count is equal to PromoBlocksMaxItems.Mosaic', () => {
        mocks.items = Array(PromoBlocksMaxItems.Mosaic).fill(getMockedPromoBlockItem());
        const { queryByTestId } = render(<MosaicCarousel {...mocks} />);

        expect(queryByTestId('carousel')).toBeInTheDocument();
        expect(queryByTestId('mosaic-one-row')).not.toBeInTheDocument();
        expect(queryByTestId('mosaic-two-rows')).toBeInTheDocument();
        expect(mockMosaicTwoRows).toHaveBeenCalledWith({
            displayNumberOfNights: true,
            items: mocks.items,
            onClickItem: expect.any(Function),
        });
    });

    it('should render only One Row components when isScreenExtraSmall is true', () => {
        mockStores.appStore.isScreenExtraSmall = true;
        mocks.items = Array(PromoBlocksMaxItems.Mosaic).fill(getMockedPromoBlockItem());
        const { queryByTestId, queryAllByTestId } = render(<MosaicCarousel {...mocks} />);

        expect(queryByTestId('carousel')).toBeInTheDocument();
        expect(queryAllByTestId('mosaic-one-row').length).toBeTruthy();
        expect(queryByTestId('mosaic-two-rows')).not.toBeInTheDocument();
    });

    it('should render both One and Two Rows  when item count is greater than PromoBlocksMaxItems.Mosaic', () => {
        mocks.items = Array(PromoBlocksMaxItems.Mosaic + 1).fill(getMockedPromoBlockItem());

        const { queryByTestId } = render(<MosaicCarousel {...mocks} />);

        expect(queryByTestId('carousel')).toBeInTheDocument();
        expect(queryByTestId('mosaic-one-row')).toBeInTheDocument();
        expect(queryByTestId('mosaic-two-rows')).toBeInTheDocument();
    });
});
