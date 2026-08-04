import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import { mockSummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/mocks';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';

import { SummaryRoomAndBoardDetails } from './SummaryRoomAndBoardDetails';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockSummaryEditButton = jest.fn();
jest.mock('frontend/components/renderings/SummaryBar/SummaryEditButton/SummaryEditButton', () => ({
    __esModule: true,
    default: ({ dataTid, scrollAnchorId, onClick, isHidden }) => {
        mockSummaryEditButton(isHidden);

        return (
            <button data-tid={dataTid} data-scroll-anchor-id={scrollAnchorId} onClick={onClick}>
                Edit
            </button>
        );
    },
}));

const createStores = (
    allAlternativeRooms = [{ code: 'room1' }, { code: 'room2' }],
    allBoardTypes = [{ code: 'board1' }, { code: 'board2' }],
) => {
    const alternativeRooms = allAlternativeRooms.length > 0 ? [allAlternativeRooms] : [];
    const alternativeBoards = allBoardTypes;

    return createMockStores({
        bookingStore: {
            selectedOffer: {
                accom: {
                    unit: [
                        {
                            roomType: { title: 'Standard Double Room', code: '0' },
                            boardType: { title: 'All Inclusive', code: '1' },
                        },
                        {
                            roomType: { title: 'Standard Double Room', code: '0' },
                            boardType: { title: 'All Inclusive', code: '1' },
                        },
                        {
                            roomType: { title: 'Family Suite', code: '1' },
                            boardType: { title: 'All Inclusive', code: '1' },
                        },
                    ],
                },
            },
            packageInfo: {
                paymentInfo: {
                    currency: CurrencyCode.GBP,
                },
            },
            allAlternativeRooms,
            allBoardTypes,
            alternativeRooms,
            alternativeBoards,
        },
        marketStore: {
            formatMoney: jest.fn((value: number) => value.toString()),
        },
    });
};
const createProps = (): ISummaryBarSitecoreFields => ({
    ...mockSummaryBarSitecoreFields,
});

let mockStores;
let mockProps;

describe('SummaryRoomAndBoardDetails', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockSummaryEditButton.mockClear();
    });

    it('should render the title', () => {
        render(<SummaryRoomAndBoardDetails {...mockProps} />);
        expect(screen.getByTestId('summary-room-and-board-title')).toHaveTextContent('RoomAndBoardSectionTitle');
    });

    it('should render the selected rooms', () => {
        render(<SummaryRoomAndBoardDetails {...mockProps} />);
        const roomsContainer = screen.getByTestId('summary-room-and-board-rooms');
        expect(roomsContainer.children).toHaveLength(2);
        expect(roomsContainer.children[0]).toHaveTextContent('2 x Standard Double Room');
        expect(roomsContainer.children[1]).toHaveTextContent('1 x Family Suite');
    });

    it('should render the selected board', () => {
        render(<SummaryRoomAndBoardDetails {...mockProps} />);
        const boardsContainer = screen.getByTestId('summary-room-and-board-board');
        expect(boardsContainer.children).toHaveLength(1);
        expect(boardsContainer.children[0]).toHaveTextContent('All Inclusive');
    });

    it('should NOT render the selected board if none', () => {
        mockStores.bookingStore.selectedOffer.accom.unit = [];
        render(<SummaryRoomAndBoardDetails {...mockProps} />);
        const boardsContainer = screen.getByTestId('summary-room-and-board-board');
        expect(boardsContainer.children).toHaveLength(0);
    });

    it('should render edit button with correct scroll anchor', () => {
        render(<SummaryRoomAndBoardDetails {...mockProps} />);

        expect(screen.getByTestId('room-and-board-edit')).toHaveAttribute(
            'data-scroll-anchor-id',
            ScrollAnchorId.BoardTypes,
        );
    });

    it('should pass onEditClick to edit button', () => {
        const mockOnEditClick = jest.fn();

        render(<SummaryRoomAndBoardDetails {...mockProps} onEditClick={mockOnEditClick} />);

        const editButton = screen.getByTestId('room-and-board-edit');
        editButton.click();

        expect(mockOnEditClick).toHaveBeenCalledTimes(1);
    });

    describe('Edit button visibility based on alternatives', () => {
        it('should hide edit button when no room or board alternatives', () => {
            mockStores = createStores([], []);

            render(<SummaryRoomAndBoardDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(true);
        });

        it('should hide edit button when only one room and no boards', () => {
            mockStores = createStores([{ code: 'room1' }], []);

            render(<SummaryRoomAndBoardDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(true);
        });

        it('should show edit button when room alternatives exist', () => {
            mockStores = createStores([{ code: 'room1' }, { code: 'room2' }], []);

            render(<SummaryRoomAndBoardDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(false);
        });

        it('should show edit button when board alternatives exist', () => {
            mockStores = createStores([], [{ code: 'board1' }, { code: 'board2' }]);

            render(<SummaryRoomAndBoardDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(false);
        });

        it('should hide edit button when EnableEditButtons is false', () => {
            mockProps.EnableEditButtons = mockSitecoreField(false);
            mockStores = createStores([{ code: 'room1' }, { code: 'room2' }], [{ code: 'board1' }, { code: 'board2' }]);

            render(<SummaryRoomAndBoardDetails {...mockProps} />);

            expect(mockSummaryEditButton).toHaveBeenCalledWith(true);
        });
    });
});
