import * as React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import { createMockStores } from 'frontend/__mocks__';
import { allBoards, bedBreakfastBoard } from 'frontend/__mocks__/boards';
import { isHolidayStore } from 'frontend/store/holidays';
import { IAltBoard } from 'models/data/IOffer';
import { AmendEventLabels } from 'models/data/tracking/AmendEvent';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import { PostBookingBoardsAndRoomsEventAction } from 'models/enum/tracking/BoardsAndRooms';
import { boardTypesFields } from 'frontend/components/renderings/BoardTypes/components/__mocks__/boardTypesFields';

import BoardTypesWrapper, { IBoardTypesWrapperProps } from './BoardTypesWrapper';

expect.extend(toHaveNoViolations);

jest.mock('scroll-into-view-if-needed', () => jest.fn());

const createProps: () => IBoardTypesWrapperProps = () => ({
    anchor: 'board-types',
    fields: boardTypesFields(),
    allBoardTypes: allBoards,
    selectedBoardType: bedBreakfastBoard as Nullable<IAltBoard>,
    selectBoardTypeError: false,
    offer: null,
    isPostBooking: false,
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
    countryCode: 'ES',
});

let mockStores;
let mockProps;

const mockBoardSectionComponent = jest.fn();

jest.mock('frontend/components/renderings/BoardTypes/components/BoardSection/BoardSection', () => ({
    __esModule: true,
    default: ({ onToggleDrawer, ...props }) => {
        mockBoardSectionComponent(props);

        return (
            <div data-tid='board-section'>
                {onToggleDrawer && <button onClick={onToggleDrawer}>toggleDrawer</button>}
            </div>
        );
    },
}));

const mockBoardTypesDrawerComponent = jest.fn();

jest.mock('frontend/components/renderings/BoardTypes/components/BoardTypesDrawer/BoardTypesDrawer', () => ({
    __esModule: true,
    default: props => {
        mockBoardTypesDrawerComponent(props);

        return (
            <div data-tid='board-types-drawer'>
                <button onClick={props.closePopup}>CloseDrawer</button>
            </div>
        );
    },
}));

jest.mock('frontend/store/holidays');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BoardTypesWrapper />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createMockStores();
        mockProps = createProps();

        jest.mocked(isHolidayStore).mockReturnValue(true);
    });

    it('should standard render', () => {
        render(<BoardTypesWrapper {...mockProps} />);
        const boards = screen.getByTestId('board-types');

        expect(boards).toBeInTheDocument();
        expect(boards.id).toEqual(mockProps.anchor);
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(mockProps.fields!.Title.value);
        expect(mockBoardSectionComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                selectedBoardTypeCode: bedBreakfastBoard.code,
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
            }),
        );
    });

    it('should skip render when no fields set', () => {
        mockProps.fields = undefined;
        const { container } = render(<BoardTypesWrapper {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render heading when Title is empty', () => {
        mockProps.fields!.Title.value = '';
        render(<BoardTypesWrapper {...mockProps} />);

        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });

    it('should render empty selected code when selectedBoardType is null', () => {
        mockProps.selectedBoardType = null;

        render(<BoardTypesWrapper {...mockProps} />);

        expect(mockBoardSectionComponent).toHaveBeenCalledWith(expect.objectContaining({ selectedBoardTypeCode: '' }));
    });

    it('should pass isPostBooking prop to BoardSection component', () => {
        mockProps.isPostBooking = true;

        render(<BoardTypesWrapper {...mockProps} />);

        expect(mockBoardSectionComponent).toHaveBeenCalledWith(expect.objectContaining({ isPostBooking: true }));
    });

    describe('Boards drawer', () => {
        beforeEach(() => {
            mockStores.appStore.isScreenMedium = false;
        });

        it('Should display drawer only on small screens', () => {
            render(<BoardTypesWrapper {...mockProps} />);

            expect(screen.getByTestId('board-types-drawer')).toBeInTheDocument();
            expect(mockBoardTypesDrawerComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                    countryCode: mockProps.countryCode,
                }),
            );
        });

        it('Should set isOpen props to true for the drawer after click on toggleDrawer button in BoardSection component', () => {
            render(<BoardTypesWrapper {...mockProps} />);

            fireEvent.click(within(screen.getByTestId('board-section')).getByRole('button', { name: 'toggleDrawer' }));

            expect(mockBoardTypesDrawerComponent).toHaveBeenCalledWith(expect.objectContaining({ isOpen: true }));
        });

        it('should pass isPostBooking prop to BoardTypesDrawer component', () => {
            mockProps.isPostBooking = true;

            render(<BoardTypesWrapper {...mockProps} />);

            expect(mockBoardTypesDrawerComponent).toHaveBeenCalledWith(
                expect.objectContaining({ isPostBooking: true }),
            );
        });

        describe('Tracking', () => {
            it('Should call trackGenericAmendmentActionWithGuests with relevant action when user open and close drawer on post booking flow', async () => {
                render(<BoardTypesWrapper {...mockProps} isPostBooking />);

                // One click to open
                await userEvent.click(screen.getByRole('button', { name: 'toggleDrawer' }));

                expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).toHaveBeenCalledWith(
                    AmendEventLabels.ChangeRoomAndBoard,
                    PostBookingBoardsAndRoomsEventAction.SeeAllBoardOptions,
                );

                // Another click to close
                await userEvent.click(screen.getByRole('button', { name: 'toggleDrawer' }));

                expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).toHaveBeenCalledWith(
                    AmendEventLabels.ChangeRoomAndBoard,
                    PostBookingBoardsAndRoomsEventAction.HideBoardOptions,
                );
            });

            it('Should NOT call trackGenericAmendmentActionWithGuests if not a Holidays flow', async () => {
                jest.mocked(isHolidayStore).mockReturnValueOnce(false);
                render(<BoardTypesWrapper {...mockProps} isPostBooking />);

                await userEvent.click(screen.getByRole('button', { name: 'toggleDrawer' }));

                expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).not.toHaveBeenCalled();
            });

            it('Should NOT call trackGenericAmendmentActionWithGuests on NOT post booking flow', async () => {
                render(<BoardTypesWrapper {...mockProps} />);

                await userEvent.click(screen.getByRole('button', { name: 'toggleDrawer' }));

                expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).not.toHaveBeenCalled();
            });
        });

        describe('scrollIntoViewIfNeeded', () => {
            it('Should call scrollIntoViewIfNeeded when click on toggleDrawer button after drawer opening', async () => {
                render(<BoardTypesWrapper {...mockProps} />);

                fireEvent.click(
                    within(screen.getByTestId('board-section')).getByRole('button', { name: 'toggleDrawer' }),
                );
                await waitFor(() => expect(scrollIntoViewIfNeeded).not.toBeCalled());

                fireEvent.click(
                    within(screen.getByTestId('board-section')).getByRole('button', { name: 'toggleDrawer' }),
                );
                await waitFor(() => expect(scrollIntoViewIfNeeded).toBeCalled());
            });

            it('Should NOT call scrollIntoViewIfNeeded when click on toggleDrawer button after drawer opening if isScreenMedium is true', async () => {
                mockStores.appStore.isScreenMedium = true;
                render(<BoardTypesWrapper {...mockProps} />);

                fireEvent.click(
                    within(screen.getByTestId('board-section')).getByRole('button', { name: 'toggleDrawer' }),
                );
                await waitFor(() => expect(scrollIntoViewIfNeeded).not.toBeCalled());

                fireEvent.click(
                    within(screen.getByTestId('board-section')).getByRole('button', { name: 'toggleDrawer' }),
                );
                await waitFor(() => expect(scrollIntoViewIfNeeded).not.toBeCalled());
            });
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<BoardTypesWrapper {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });

    it('should render scroll anchor for navigation', () => {
        render(<BoardTypesWrapper {...mockProps} />);

        const scrollAnchor = screen.getByTestId('board-types-scroll-anchor');
        expect(scrollAnchor).toHaveAttribute('id', ScrollAnchorId.BoardTypes);
        expect(scrollAnchor).toHaveAttribute('aria-hidden', 'true');
    });
});
