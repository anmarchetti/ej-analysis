import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getMockedPromoBlockItem } from 'frontend/components/renderings/PromoBlocks/components/MosaicBlocks/components/__mocks__/promoBlockItem';

import { MosaicOneRow } from './MosaicOneRow';

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
    items: Array(1).fill(getMockedPromoBlockItem()),
    onClickItem: jest.fn(),
    displayNumberOfNights: true,
});

let mocks;

describe('<MosaicOneRow />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standard render', () => {
        render(<MosaicOneRow {...mocks} />);

        expect(screen.getByTestId('mosaic-one-row')).toBeInTheDocument();
        expect(screen.getAllByTestId('promo-slide-col')).toHaveLength(1);
        expect(screen.getByTestId('mosaic-blocks-item')).toBeInTheDocument();
        expect(mockMosaicBlocksItem).toHaveBeenCalledWith({
            item: mocks.items[0],
            displayNumberOfNights: true,
            className: 'oneItem',
        });
        expect(screen.getAllByTestId('promo-slide-col')[0]).toHaveClass('singleColumn');
    });

    it('should Not apply promo-slide--one-item classname when item count is not equal to 1', () => {
        mocks.items = Array.from(Array(2), (_, index) => getMockedPromoBlockItem(index));
        const { container } = render(<MosaicOneRow {...mocks} />);

        expect(container.querySelector('.promo-slide--one-item')).not.toBeInTheDocument();
    });

    it('should call onClickItem with expected values when click on first MosaicBlocksItem element', async () => {
        render(<MosaicOneRow {...mocks} />);

        await userEvent.click(screen.getByTestId('mosaic-blocks-item'));

        expect(mocks.onClickItem).toHaveBeenCalledWith(mocks.items[0]);
    });
});
