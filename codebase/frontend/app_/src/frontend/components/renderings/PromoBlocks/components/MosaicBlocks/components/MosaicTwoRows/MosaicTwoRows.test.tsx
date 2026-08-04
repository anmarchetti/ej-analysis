import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getMockedPromoBlockItem } from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/components/__mocks__/promoBlockItem';

import { MosaicTwoRows } from './MosaicTwoRows';

const mockMosaicBlocksItem = jest.fn();
jest.mock(
    'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/components/MosaicBlocksItem/MosaicBlocksItem',
    () => ({
        __esModule: true,
        default: ({ onClick, ...props }) => {
            mockMosaicBlocksItem(props);

            return <div onClick={onClick} data-tid='mosaic-blocks-item' />;
        },
    }),
);

const resetMocks = () => ({
    onClickItem: jest.fn(),
    items: Array(4).fill(getMockedPromoBlockItem()),
    displayNumberOfNights: true,
});

let mocks;

describe('<MosaicTwoRows />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standard render', () => {
        render(<MosaicTwoRows {...mocks} />);

        expect(screen.getByTestId('mosaic-two-rows')).toBeInTheDocument();
        expect(screen.getAllByTestId('promo-slide-col')).toHaveLength(3);
        expect(screen.getAllByTestId('mosaic-blocks-item')).toHaveLength(4);
        expect(mockMosaicBlocksItem).toHaveBeenNthCalledWith(1, { item: mocks.items[0], displayNumberOfNights: true });
    });

    describe('onClick action', () => {
        it('should call onClickItem with expected values when click on first MosaicBlocksItem element', async () => {
            render(<MosaicTwoRows {...mocks} />);

            await userEvent.click(screen.getAllByTestId('mosaic-blocks-item')[0]);

            expect(mocks.onClickItem).toHaveBeenCalledWith(mocks.items[0]);
        });

        it('should call onClickItem with expected values when click on second MosaicBlocksItem element', async () => {
            render(<MosaicTwoRows {...mocks} />);

            await userEvent.click(screen.getAllByTestId('mosaic-blocks-item')[1]);

            expect(mocks.onClickItem).toHaveBeenCalledWith(mocks.items[1]);
        });

        it('should call onClickItem with expected values when click on third MosaicBlocksItem element', async () => {
            render(<MosaicTwoRows {...mocks} />);

            await userEvent.click(screen.getAllByTestId('mosaic-blocks-item')[2]);

            expect(mocks.onClickItem).toHaveBeenCalledWith(mocks.items[2]);
        });

        it('should call onClickItem with expected values when click on fourth MosaicBlocksItem element', async () => {
            render(<MosaicTwoRows {...mocks} />);

            await userEvent.click(screen.getAllByTestId('mosaic-blocks-item')[3]);

            expect(mocks.onClickItem).toHaveBeenCalledWith(mocks.items[3]);
        });
    });
});
