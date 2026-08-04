import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockUnitRoom } from 'frontend/__mocks__';
import { isHolidayStore } from 'frontend/store/holidays';
import { AmendEventLabels } from 'models/data/tracking/AmendEvent';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { PostBookingBoardsAndRoomsEventAction } from 'models/enum/tracking/BoardsAndRooms';

import RoomCardListMobile, { IRoomCardListMobileProps } from './RoomCardListMobile';

expect.extend(toHaveNoViolations);

const createProps = (): IRoomCardListMobileProps => ({
    onChangeRoom: jest.fn(),
    rooms: [mockUnitRoom, mockUnitRoom],
    isLoading: false,
    pricePostfix: SitecoreDictionary.GlobalsPriceLabelsTotal,
    showMoreLabel: 'showMoreLabel',
    showRoomsPart: 1,
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
    countryCode: 'ES',
    rendering: 'rendering',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockRoomProps = jest.fn();
jest.mock('frontend/components/common/Room/RoomCard/RoomCard', () => ({
    __esModule: true,
    default: props => {
        mockRoomProps(props);

        return <div data-tid='room' />;
    },
}));

const mockDrawerProps = jest.fn();
jest.mock('frontend/components/common/Room/RoomCardsList/component/RoomsCardListDrawer/RoomsCardListDrawer', () => ({
    __esModule: true,
    default: props => {
        mockDrawerProps(props);

        return (
            <div data-tid='drawer' onClick={props.onCollapse}>
                <button onClick={props.onChangeRoom}>onChangeRoom</button>
                <button onClick={props.onCollapse}>onCollapse</button>
            </div>
        );
    },
}));

const mockActionProps = jest.fn();
jest.mock('./components/ShowMoreAction/ShowMoreAction', () => ({
    __esModule: true,
    default: props => {
        mockActionProps(props);

        return <div data-tid='action' />;
    },
}));

jest.mock('frontend/store/holidays');

describe('<RoomCardListMobile />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
        jest.mocked(isHolidayStore).mockReturnValue(true);
    });

    it('Should render children', () => {
        render(<RoomCardListMobile {...mockProps} />);

        expect(screen.getByTestId('action')).toBeInTheDocument();
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
        expect(screen.getAllByTestId('room').length).toBe(1);
        expect(mockActionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                label: 'showMoreLabel',
                onClick: expect.any(Function),
            }),
        );
        expect(mockDrawerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                rooms: [mockUnitRoom],
                pricePostfix: 'Globals.PriceLabels.Total',
                showMoreLabel: 'showMoreLabel',
                showRoomsPart: 1,
                isOpen: false,
                isLoading: false,
                onCollapse: expect.any(Function),
                onChangeRoom: expect.any(Function),
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
                rendering: mockProps.rendering,
            }),
        );
        expect(mockRoomProps).toHaveBeenCalledWith(
            expect.objectContaining({
                room: mockUnitRoom,
                pricePostfix: SitecoreDictionary.GlobalsPriceLabelsTotal,
                isLoading: false,
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
            }),
        );
    });

    describe('Tracking', () => {
        it('Should NOT call track event when not a isHolidayStore', async () => {
            jest.mocked(isHolidayStore).mockReturnValueOnce(false);
            render(<RoomCardListMobile {...mockProps} />);

            await userEvent.click(screen.getByRole('button', { name: 'onChangeRoom' }));

            expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).not.toHaveBeenCalled();
        });

        it('Should call tracking event with see alternative rooms action when drawer is closed', async () => {
            render(<RoomCardListMobile {...mockProps} />);

            await userEvent.click(screen.getByRole('button', { name: 'onChangeRoom' }));

            expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).toHaveBeenCalledWith(
                AmendEventLabels.ChangeRoomAndBoard,
                PostBookingBoardsAndRoomsEventAction.SeeAlternativeRooms,
            );

            await userEvent.click(screen.getByRole('button', { name: 'onChangeRoom' }));
        });

        it('Should call tracking event with hide alternative rooms action when drawer is opened', async () => {
            render(<RoomCardListMobile {...mockProps} />);

            // Two clicks need to change state when the user hide the list
            await userEvent.click(screen.getByRole('button', { name: 'onCollapse' }));
            await userEvent.click(screen.getByRole('button', { name: 'onCollapse' }));

            expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).toHaveBeenCalledWith(
                AmendEventLabels.ChangeRoomAndBoard,
                PostBookingBoardsAndRoomsEventAction.HideAlternativeRooms,
            );
        });
    });

    it('Should change isOpen state', async () => {
        render(<RoomCardListMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('drawer'));

        expect(mockDrawerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOpen: true,
            }),
        );
    });

    it('Click on choose room cta in drawer', async () => {
        render(<RoomCardListMobile {...mockProps} />);

        await userEvent.click(screen.getByRole('button', { name: 'onChangeRoom' }));

        expect(mockProps.onChangeRoom).toHaveBeenCalled();
    });

    describe('ShowMoreAction', () => {
        it('Should ShowMoreAction be not visible when rooms == 1', () => {
            mockProps.rooms = [mockUnitRoom];
            render(<RoomCardListMobile {...mockProps} />);

            expect(screen.queryByTestId('action')).not.toBeInTheDocument();
        });

        it('Should ShowMoreAction be not visible when isLoading', () => {
            mockProps.isLoading = true;
            render(<RoomCardListMobile {...mockProps} />);

            expect(screen.queryByTestId('action')).not.toBeInTheDocument();
        });

        it('Should ShowMoreAction be rendered with default label', () => {
            mockProps.showMoreLabel = undefined;
            render(<RoomCardListMobile {...mockProps} />);

            expect(mockActionProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'Globals.Labels.ShowMore',
                }),
            );
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<RoomCardListMobile {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
