import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockUnitRoom } from 'frontend/__mocks__';
import { usePagination } from 'frontend/hooks/usePagination/usePagination';
import { isHolidayStore } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RoomCardListDesktop, { IRoomCardListDesktopProps } from './RoomCardListDesktop';
import MockedFn = jest.MockedFn;
import { AmendEventLabels } from 'models/data/tracking/AmendEvent';
import { PostBookingBoardsAndRoomsEventAction } from 'models/enum/tracking/BoardsAndRooms';

expect.extend(toHaveNoViolations);

const createProps = (): IRoomCardListDesktopProps => ({
    hideMoreCollapsedTitle: 'hideMoreCollapsedTitle',
    onChangeRoom: jest.fn(),
    rooms: [mockUnitRoom, mockUnitRoom],
    showMoreExpandedTitle: 'showMoreExpandedTitle',
    isLoading: false,
    pricePostfix: SitecoreDictionary.GlobalsPriceLabelsTotal,
    showRoomsPart: 3,
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
    countryCode: 'ES',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockShowMoreButton = jest.fn();
jest.mock('frontend/components/common/ShowMoreButton', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockShowMoreButton(props);

        return <div data-tid='show-more-button' onClick={onClick} />;
    },
}));

const mockCardProps = jest.fn();
jest.mock('frontend/components/common/Room/RoomCard/RoomCard', () => ({
    __esModule: true,
    default: ({ onChange, ...props }) => {
        mockCardProps(props);

        return <div data-tid='room-card' onClick={onChange} />;
    },
}));

jest.mock('frontend/hooks/usePagination/usePagination');
jest.mock('frontend/store/holidays');

describe('<RoomCardListDesktop />', () => {
    const mockPagination = {
        itemsToShow: [mockUnitRoom],
        goToNext: jest.fn(),
        goToPage: jest.fn(),
        isLastPage: false,
        page: 0,
    };
    (usePagination as MockedFn<any>).mockReturnValue(mockPagination);

    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
        jest.mocked(isHolidayStore).mockReturnValue(true);
    });

    it('Should render children', () => {
        render(<RoomCardListDesktop {...mockProps} />);

        expect(screen.queryByTestId('room-card')).toBeInTheDocument();
        expect(screen.queryByTestId('show-more-button')).toBeInTheDocument();
        expect(mockCardProps).toHaveBeenCalledWith(
            expect.objectContaining({
                room: mockUnitRoom,
                pricePostfix: mockProps.pricePostfix,
                isLoading: false,
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
            }),
        );
        expect(mockShowMoreButton).toHaveBeenCalledWith(
            expect.objectContaining({
                isChevronUp: false,
                title: 'showMoreExpandedTitle',
                dataTid: 'show-more-rooms-button-desktop',
            }),
        );
    });

    describe('Expand/collapse button', () => {
        it('Should call goToNext', async () => {
            render(<RoomCardListDesktop {...mockProps} />);

            await userEvent.click(screen.getByTestId('show-more-button'));

            expect(mockPagination.goToNext).toHaveBeenCalled();
        });

        describe('Tracking', () => {
            it('Should NOT call generic action with guests event when not a isHolidayStore', async () => {
                jest.mocked(isHolidayStore).mockReturnValueOnce(false);
                render(<RoomCardListDesktop {...mockProps} />);

                await userEvent.click(screen.getByTestId('show-more-button'));

                expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).not.toHaveBeenCalled();
            });

            it('Should call tracking event with see alternative rooms action on NOT last page', async () => {
                render(<RoomCardListDesktop {...mockProps} />);

                await userEvent.click(screen.getByTestId('show-more-button'));

                expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).toHaveBeenCalledWith(
                    AmendEventLabels.ChangeRoomAndBoard,
                    PostBookingBoardsAndRoomsEventAction.SeeAlternativeRooms,
                );
            });

            it('Should call tracking event with hide alternative rooms action on last page', async () => {
                mockPagination.isLastPage = true;
                render(<RoomCardListDesktop {...mockProps} />);

                await userEvent.click(screen.getByTestId('show-more-button'));

                expect(mockStores.trackingStore.trackGenericAmendmentActionWithGuests).toHaveBeenCalledWith(
                    AmendEventLabels.ChangeRoomAndBoard,
                    PostBookingBoardsAndRoomsEventAction.HideAlternativeRooms,
                );
            });
        });

        it('Should NOT be rendered when isLoading', () => {
            mockProps.isLoading = true;
            render(<RoomCardListDesktop {...mockProps} />);

            expect(screen.queryByTestId('show-more-button')).not.toBeInTheDocument();
        });

        it('Should NOT be rendered when rooms count equal the default value', () => {
            mockProps.rooms = [mockUnitRoom];
            render(<RoomCardListDesktop {...mockProps} />);

            expect(screen.queryByTestId('show-more-button')).not.toBeInTheDocument();
        });

        it('Should show be render collapse label', () => {
            mockPagination.isLastPage = true;

            render(<RoomCardListDesktop {...mockProps} />);

            expect(mockShowMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: true,
                    title: 'hideMoreCollapsedTitle',
                }),
            );
        });

        it('Should call goToPage when reach the end of a list', async () => {
            mockPagination.isLastPage = true;
            render(<RoomCardListDesktop {...mockProps} />);

            await userEvent.click(screen.getByTestId('show-more-button'));

            expect(mockPagination.goToPage).toHaveBeenCalledWith(0);
        });
    });

    describe('Render rooms', () => {
        it('Should NOT render fade room when isLoading', () => {
            mockProps.isLoading = true;
            render(<RoomCardListDesktop {...mockProps} />);

            expect(screen.queryAllByTestId('room-card').length).toBe(1);
        });

        it('Should NOT render fade room when all room rendered', () => {
            mockProps.rooms = [mockUnitRoom];
            render(<RoomCardListDesktop {...mockProps} />);

            expect(screen.queryAllByTestId('room-card').length).toBe(1);
        });

        it('Should onChangeRoom prop be called when click on Room', async () => {
            render(<RoomCardListDesktop {...mockProps} />);

            await userEvent.click(screen.queryAllByTestId('room-card')[0]);

            expect(mockProps.onChangeRoom).toHaveBeenCalled();
        });
    });

    it('Should call pagination hook with default rooms value', () => {
        mockProps.showRoomsPart = undefined;
        render(<RoomCardListDesktop {...mockProps} />);

        expect(usePagination).toHaveBeenCalledWith(
            mockProps.rooms,
            expect.objectContaining({
                numberToShow: mockProps.rooms.length,
                defaultToShow: 1,
                continuous: true,
            }),
        );
    });

    it('Should change page to 0 when new rooms were applied', () => {
        mockPagination.page = 1;
        render(<RoomCardListDesktop {...mockProps} />);

        expect(mockPagination.goToPage).toHaveBeenCalledWith(0);
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<RoomCardListDesktop {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
