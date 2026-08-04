import React from 'react';
import { render, screen } from '@testing-library/react';

import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';

import OtherBoardsSplit, { IOtherBoardsSplitProps } from './OtherBoardsSplit';

const mockAltBoardsSectionComponent = jest.fn();
jest.mock('../AltBoardsSection/AltBoardsSection', () => ({
    __esModule: true,
    default: props => {
        mockAltBoardsSectionComponent(props);

        return <div />;
    },
}));

describe('<OtherBoardsSplit />', () => {
    const mockedAltBoard: IAltBoard = {
        price: 6,
        pricePP: 3,
        priceExcludingTouristTax: 2,
        pricePPExcludingTouristTax: 1,
        isExt: false,
        code: '',
        roomAlterations: {},
        title: '',
        content: '',
        description: '',
        iconUrl: '',
    };
    const resetMocks = (): IOtherBoardsSplitProps => ({
        selectedOffer: { accom: { unit: [{ code: '01', isFreeForKids: true }] } } as IOfferWithoutAltBoards,
        altBoards: [
            { ...mockedAltBoard, roomAlterations: { '01': '02' } },
            { ...mockedAltBoard, roomAlterations: { '01': null } }, // null - for cases when no roomAlteration is provided
            { ...mockedAltBoard, roomAlterations: { '01': null } },
        ],
        altRooms: [[{ code: '02', isFreeForKids: false }]] as IUnit[][],
        confirmedBoard: {} as IBoardType,
        withFreeChildLabel: 'withFreeChildLabel',
        withoutFreeChildLabel: 'withoutFreeChildLabel',
        onSelect: jest.fn(),
    });
    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        jest.resetAllMocks();
    });

    it('should standard render', () => {
        render(<OtherBoardsSplit {...mocks} />);
        expect(screen.getByTestId('additional-board-items-block-split')).toBeInTheDocument();
    });

    it('should not render when no selected offer', () => {
        render(<OtherBoardsSplit {...mocks} selectedOffer={null} />);
        expect(screen.queryByTestId('additional-board-items-block-split')).not.toBeInTheDocument();
    });

    it('should split alt boards', () => {
        render(<OtherBoardsSplit {...mocks} />);

        expect(mockAltBoardsSectionComponent).toBeCalledTimes(2);
        expect(mockAltBoardsSectionComponent).toBeCalledWith({
            confirmedBoard: {},
            items: [
                {
                    code: '',
                    content: '',
                    description: '',
                    iconUrl: '',
                    isExt: false,
                    price: 6,
                    pricePP: 3,
                    priceExcludingTouristTax: 2,
                    pricePPExcludingTouristTax: 1,
                    roomAlterations: { '01': null },
                    title: '',
                },
                {
                    code: '',
                    content: '',
                    description: '',
                    iconUrl: '',
                    isExt: false,
                    price: 6,
                    pricePP: 3,
                    priceExcludingTouristTax: 2,
                    pricePPExcludingTouristTax: 1,
                    roomAlterations: { '01': null },
                    title: '',
                },
            ],
            label: 'withFreeChildLabel',
            onSelect: expect.any(Function),
            selectedOffer: { accom: { unit: [{ code: '01', isFreeForKids: true }] } },
        });
        expect(mockAltBoardsSectionComponent).toBeCalledWith({
            confirmedBoard: {},
            items: [
                {
                    code: '',
                    content: '',
                    description: '',
                    iconUrl: '',
                    isExt: false,
                    price: 6,
                    pricePP: 3,
                    priceExcludingTouristTax: 2,
                    pricePPExcludingTouristTax: 1,
                    roomAlterations: { '01': '02' },
                    title: '',
                },
            ],
            label: 'withoutFreeChildLabel',
            onSelect: expect.any(Function),
            selectedOffer: { accom: { unit: [{ code: '01', isFreeForKids: true }] } },
        });
    });
});
