import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { IAltBoard, IOfferWithoutAltBoards } from 'models/data/IOffer';

import AltBoardsSection, { IAltBoardsSectionProps } from './AltBoardsSection';

const mockAltBoardItemComponent = jest.fn();
jest.mock('../AltBoardItem/AltBoardItem', () => ({
    __esModule: true,
    default: props => {
        mockAltBoardItemComponent(props);

        return <button data-tid='alt-board-item' onClick={props.onSelect} />;
    },
}));

describe('<AltBoardsSection/>', () => {
    const resetMocks = () => ({
        items: [{}, {}] as IAltBoard[],
        label: 'label',
        confirmedBoard: { code: '', title: '', content: '', description: '', iconUrl: '' },
        selectedOffer: null,
    });
    let mocks: IAltBoardsSectionProps = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        jest.resetAllMocks();
    });

    it('should standard render', () => {
        render(<AltBoardsSection {...mocks} selectedOffer={{ price: 1, pricePP: 2 } as IOfferWithoutAltBoards} />);

        expect(screen.getByRole('heading')).toHaveTextContent(mocks.label);
        expect(screen.getAllByTestId('alt-board-item').length).toEqual(2);
        expect(mockAltBoardItemComponent).toHaveBeenCalledWith({
            board: {},
            currency: undefined,
            isPricePPShown: true,
            isSelected: false,
            onSelect: expect.any(Function),
            selectedBoardPricePP: 0,
        });
    });

    it('should not render when no items passed', () => {
        render(<AltBoardsSection {...mocks} items={[]} />);
    });

    it('should call onSelect when it is defined', () => {
        mocks.onSelect = jest.fn();
        render(<AltBoardsSection {...mocks} />);

        const altBoardItems = screen.getAllByTestId('alt-board-item');
        fireEvent.click(altBoardItems[0]);

        expect(mocks.onSelect).toHaveBeenCalled;
    });
});
