import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockAmendRoomAndBoardLocalStore } from 'frontend/__mocks__';
import {
    allBoards as mockedAllBoards,
    bedBreakfastBoard as mockedBedBreakfastBoard,
    halfBoard as mockedHalfBoard,
} from 'frontend/__mocks__/boards';
import { isHolidayStore } from 'frontend/store/holidays';
import * as boardsAndRoomsUtils from 'frontend/utils/tracking/boardsAndRooms.utils';
import { IOffer } from 'models/data/IOffer';
import { BoardsAndRoomsEventAction, BoardsAndRoomsEventCategory } from 'models/enum/tracking/BoardsAndRooms';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import * as roomAndBoardLocalStore from 'frontend/components/renderings/AmendRoomAndBoardPopup/store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore';
import { boardTypesFields } from 'frontend/components/renderings/BoardTypes/components/__mocks__/boardTypesFields';

import BoardSection, { IBoardSectionProps } from './BoardSection';

let mockBoardTypesToShow;
let mockNewAlternativeRooms;

jest.mock('frontend/components/renderings/BoardTypes/components/BoardSection/BoardSection.utils', () => ({
    getBoardTypesToShow: jest.fn(() => mockBoardTypesToShow),
    getNewAlternativeRooms: jest.fn(() => mockNewAlternativeRooms),
}));

const mockLocalStore = mockAmendRoomAndBoardLocalStore();

const mockBoardCardComponent = jest.fn();

jest.mock('frontend/components/renderings/BoardTypes/components/BoardCard/BoardCard', () => ({
    __esModule: true,
    default: props => {
        mockBoardCardComponent(props);

        return <div data-tid='board-card' />;
    },
}));

const mockBoardListComponent = jest.fn();
const mockedPriceDiff = 15;

jest.mock('./components/BoardList/BoardList', () => ({
    __esModule: true,
    default: ({ onChangeBoard, ...props }) => {
        mockBoardListComponent(props);
        const selectedMockedBoard = mockedAllBoards.find(el => el.code === props.selectedBoardTypeCode);

        return (
            <div data-tid='board-list'>
                {onChangeBoard && (
                    <button onClick={() => onChangeBoard(selectedMockedBoard, mockedPriceDiff)}>changeBoard</button>
                )}
            </div>
        );
    },
}));
const mockBoardSectionButtonComponent = jest.fn();

jest.mock('./components/BoardSectionButton/BoardSectionButton', () => ({
    __esModule: true,
    default: ({ handleShowMore, ...props }) => {
        mockBoardSectionButtonComponent(props);

        return (
            <div data-tid='board-section-button'>
                {handleShowMore && <button onClick={() => handleShowMore()}>showMore</button>}
            </div>
        );
    },
}));

const mockBoardAlterationDrawer = jest.fn();

jest.mock('./components/BoardAlterationDrawer/BoardAlterationDrawer', () => ({
    __esModule: true,
    default: ({ handleCancelClick, handleConfirmClick, ...props }) => {
        mockBoardAlterationDrawer(props);

        return (
            <div data-tid='board-alteration-drawer'>
                {handleCancelClick && <button onClick={() => handleCancelClick()}>handleCancelClick</button>}
                {handleConfirmClick && <button onClick={() => handleConfirmClick()}>handleConfirmClick</button>}
            </div>
        );
    },
}));

jest.mock('frontend/store/holidays');
const mockUseRoomAndBoardLocalStore = jest.spyOn(roomAndBoardLocalStore, 'useRoomAndBoardLocalStore');

const mockedRooms = [
    {
        code: 'B01',
        price: 803,
        pricePP: 402,
        board: 'AS',
        roomType: {
            code: 'B01',
            title: {
                value: 'Double standard',
            },
            images: [{ small: '' }],
        },
        originalCode: 'B01',
        isFreeForKids: true,
        occupation: {
            adults: 2,
            children: 1,
        },
    },
];

const onSelectBoard = jest.fn();

const createProps = (): IBoardSectionProps => {
    const fields = boardTypesFields();

    return {
        offer: {
            price: 105,
            pricePP: 53,
            accom: {
                unit: mockedRooms,
            },
        } as IOffer,
        freeChildPlaceTooltip: 'freeChildPlaceTooltip',
        countryCode: 'ES',
        allBoardTypes: mockedAllBoards,
        selectedBoardTypeCode: mockedBedBreakfastBoard.code,
        altTitleSingular: fields.AlternativeBoardsTitleSingular,
        altTitlePlural: fields.AlternativeBoardsTitlePlural,
        hideLabelText: fields.HideLabel?.value,
        showLabelText: fields.ShowLabel?.value,
        editLabelText: fields.EditLabel?.value,
        drawerMode: false,
        fallbackImage: 'fallback-img',
        alterationInfoText: fields.AlterationInfoText,
        alterationInfoTitle: fields.AlterationInfoTitle,
        alterationResTitle: fields.AlterationRoomResultTitle,
        alterationResSubtitle: fields.AlterationResultSubtitle,
        alterationResTextSingular: fields.AlterationRoomResultTextSingular,
        alterationResTextPlural: fields.AlterationRoomResultTextPlural,
        alterationSubtitle: fields.AlterationSubtitle,
        freeChildPlaceInfoTitle: fields.FreeChildPlaceInfoTitle,
        freeChildPlaceInfoText: fields.FreeChildPlaceInfoText,
        alterationChangingFromTitle: fields.AlterationChangingFromTitle,
        alterationExtendedInfoTitle: fields.AlterationExtendedInfoTitle,
        alterationExtendedInfoText: fields.AlterationExtendedInfoText,
        onSelectBoard,
        onToggleDrawer: jest.fn(),
        isPostBooking: false,
    };
};

let mockStores;
let props = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BoardSection />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            bookingStore: {
                allAlternativeRooms: [
                    { code: 'B01', isFreeForKids: false },
                    { code: 'B02', isFreeForKids: false },
                ],
                boardCodeError: undefined as Nullable<string>,
                changeBoardType: jest.fn((boardType, priceDiff, onSuccess) => {
                    onSuccess();
                }),
            },
            amendRoomAndBoardStore: {
                changeBoardType: jest.fn((boardType, priceDiff, onSuccess) => {
                    onSuccess();
                }),
            },
        });
        props = createProps();
        mockBoardTypesToShow = [];
        mockNewAlternativeRooms = [];
        jest.mocked(isHolidayStore).mockReturnValue(true);
    });

    it('should standard render', () => {
        render(<BoardSection {...props} />);

        expect(screen.getByTestId('board-list')).toBeInTheDocument();
        expect(mockBoardListComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                items: mockBoardTypesToShow,
                isCollapsed: true,
                alterationInfoTitle: props.alterationInfoTitle,
                alterationInfoText: props.alterationInfoText,
                altTitleField: props.altTitlePlural,
                freeChildPlaceInfoTitle: props.freeChildPlaceInfoTitle,
                freeChildPlaceInfoText: props.freeChildPlaceInfoText,
                offer: props.offer,
                isMostExpensiveBoardSelected: false,
                selectedRooms: props.offer!.accom.unit,
                onUpdateBoard: props.onUpdateBoard,
                onDeleteBoard: props.onDeleteBoard,
                selectedBoardTypeCode: props.selectedBoardTypeCode,
                fallbackImage: props.fallbackImage,
                freeChildPlaceTooltip: props.freeChildPlaceTooltip,
                countryCode: props.countryCode,
                alternativeBoardsCount: 3,
            }),
        );
        expect(screen.getByTestId('board-section-button')).toBeInTheDocument();
        expect(mockBoardSectionButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                offer: props.offer,
                isCollapsed: true,
                alternativeBoardsCount: 3,
                isMostExpensiveBoardSelected: false,
                title: props.showLabelText,
            }),
        );
        expect(screen.getByTestId('board-alteration-drawer')).toBeInTheDocument();
    });

    describe('isMostExpensiveBoardSelected', () => {
        it('Should render BoardList with "isMostExpensiveBoardSelected" prop', () => {
            props.allBoardTypes = [mockedAllBoards[0]];
            render(<BoardSection {...props} />);

            expect(mockBoardListComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isMostExpensiveBoardSelected: true,
                }),
            );
        });
    });

    describe('handleShowMore', () => {
        it('should call tracking', async () => {
            render(<BoardSection {...props} />);
            await userEvent.click(screen.getByRole('button', { name: 'showMore' }));

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: BoardsAndRoomsEventAction.ShowBoards,
                    eventCategory: BoardsAndRoomsEventCategory.Board,
                    eventLabel: '3',
                    eventType: EventTypes.Interaction,
                    eventValue: null,
                },
                {
                    destinationUrl: null,
                    genericValue1: null,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                },
            );
        });

        it('Should NOT call tracking during post booking flow when click on show more button', async () => {
            render(<BoardSection {...props} isPostBooking />);
            await userEvent.click(screen.getByRole('button', { name: 'showMore' }));

            expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
        });
    });

    describe('onChangeBoard', () => {
        describe('local store behavior', () => {
            afterAll(() => {
                mockUseRoomAndBoardLocalStore.mockRestore();
            });

            it('calls selectBoardType from local store if drawerMode is false', async () => {
                const selectBoardType = jest.fn();
                mockUseRoomAndBoardLocalStore.mockReturnValue({ ...mockLocalStore, selectBoardType });
                render(<BoardSection {...props} />);

                await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

                expect(selectBoardType).toHaveBeenCalled();
                expect(onSelectBoard).not.toHaveBeenCalled();
            });

            it('calls selectBoardType and onSelectBoard if drawerMode is true', async () => {
                const selectBoardType = jest.fn();
                mockUseRoomAndBoardLocalStore.mockReturnValue({
                    ...mockLocalStore,
                    selectBoardType,
                });
                props.drawerMode = true;
                render(<BoardSection {...props} />);

                await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

                expect(selectBoardType).toHaveBeenCalled();
                expect(onSelectBoard).toHaveBeenCalled();
            });

            it('handles absence of the local store', async () => {
                mockUseRoomAndBoardLocalStore.mockReturnValue(null);

                render(<BoardSection {...props} selectedBoardTypeCode={mockedAllBoards[1].code} />);

                await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

                expect(onSelectBoard).toHaveBeenCalled();
            });
        });

        it('should call tracking', async () => {
            render(<BoardSection {...props} />);
            await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledTimes(1);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: BoardsAndRoomsEventAction.BoardSelected,
                    eventCategory: BoardsAndRoomsEventCategory.Board,
                    eventLabel: mockedBedBreakfastBoard.title,
                    eventType: EventTypes.Interaction,
                    eventValue: 15,
                },
                {
                    destinationUrl: null,
                    genericValue1: 'Bed and Breakfast',
                    genericValue2: '3',
                    genericValue3: 'Requires room alterations',
                    genericValue4: 'Upgrade',
                },
            );
        });

        it('should call correct tracking funcs when change board is triggered in drawer', async () => {
            render(<BoardSection {...props} />);
            jest.spyOn(boardsAndRoomsUtils, 'getIsRoomAlterationNeeded').mockReturnValueOnce(true);

            await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));
            await userEvent.click(screen.getByRole('button', { name: 'handleConfirmClick' }));

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledTimes(2);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenNthCalledWith(
                1,
                EventTypes.GenericEvent,
                {
                    eventAction: BoardsAndRoomsEventAction.BoardSelected,
                    eventCategory: BoardsAndRoomsEventCategory.Board,
                    eventLabel: mockedBedBreakfastBoard.title,
                    eventType: EventTypes.Interaction,
                    eventValue: 15,
                },
                {
                    destinationUrl: null,
                    genericValue1: 'Bed and Breakfast',
                    genericValue2: '3',
                    genericValue3: 'Requires room alterations',
                    genericValue4: 'Upgrade',
                },
            );
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenNthCalledWith(
                2,
                EventTypes.GenericEvent,
                {
                    eventAction: BoardsAndRoomsEventAction.AlterationConfirm,
                    eventCategory: BoardsAndRoomsEventCategory.BoardAndRoom,
                    eventLabel: 'Requires room alterations',
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: '',
                    genericValue2: 'Bed and Breakfast',
                    genericValue3: null,
                    genericValue4: 'Upgrade',
                },
            );
        });

        it('should render BookingAlterationDrawer component', async () => {
            const { rerender } = render(<BoardSection {...props} />);

            await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

            rerender(<BoardSection {...props} />);

            const drawer = screen.getByTestId('board-alteration-drawer');

            expect(drawer).toBeInTheDocument();
            expect(mockBoardAlterationDrawer).toBeCalledWith(
                expect.objectContaining({
                    alterationChangingFromTitle: { value: 'Changing From' },
                    alterationResSubtitle: {
                        value: 'Your new board selection requires an alteration to your other rooms',
                    },
                    alterationResTextPlural: { value: 'Your New Rooms' },
                    alterationResTextSingular: { value: 'Your New Room' },
                    alterationResTitle: { value: 'Room Alteration' },
                    alterationSubtitle: { value: 'Changing to this board means a few other changes to the package' },
                    changedBoard: mockedBedBreakfastBoard,
                    fallbackImage: props.fallbackImage,
                    freeChildPlaceInfoText: { value: 'Your free child place will not be valid on this board basis' },
                    freeChildPlaceInfoTitle: { value: 'About your Free Child Place' },
                    isAlterationModalShow: true,
                    priceChange: mockedPriceDiff,
                    newAlternativeRooms: [],
                    freeChildPlaceTooltip: props.freeChildPlaceTooltip,
                    countryCode: props.countryCode,
                }),
            );
        });

        it('should call onSelectBoard when changeBoardType succeed', async () => {
            render(<BoardSection {...props} selectedBoardTypeCode={mockedAllBoards[1].code} />);
            await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

            expect(onSelectBoard).toBeCalled();
        });

        it('should collapse the list when changeBoardType succeed', async () => {
            render(<BoardSection {...props} />);
            await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

            expect(mockBoardListComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isCollapsed: true,
                }),
            );
        });

        it('should NOT call onSelectBoard when changeBoardType fails', async () => {
            mockStores.bookingStore.changeBoardType = undefined;
            render(<BoardSection {...props} />);
            await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

            expect(onSelectBoard).not.toBeCalled();
        });

        it('should NOT collapse the list when changeBoardType fails', async () => {
            mockStores.bookingStore.changeBoardType = undefined;
            render(<BoardSection {...props} />);
            await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

            expect(mockBoardListComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    isCollapsed: true,
                }),
            );
        });

        it('should call changeBoardType from AmendRoomAndBoardStore when isPostBooking is true', async () => {
            props.allBoardTypes = [mockedHalfBoard];
            props.selectedBoardTypeCode = mockedHalfBoard.code;
            props.isPostBooking = true;
            render(<BoardSection {...props} />);

            await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

            expect(mockStores.amendRoomAndBoardStore.changeBoardType).toHaveBeenCalledWith(
                mockedHalfBoard.code,
                mockedPriceDiff,
                expect.any(Function),
            );
        });

        describe('trackNewRoomOrBoardClick', () => {
            it('Should call trackNewRoomOrBoardClick when isPostBooking', async () => {
                render(<BoardSection {...props} isPostBooking />);

                await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

                expect(mockStores.trackingStore.roomAndBoard.trackNewRoomOrBoardClick).toHaveBeenCalledWith(
                    EventTypes.PostBookingChangeBoardSelect,
                    'Bed and Breakfast',
                    15,
                );
            });

            it('Should use boardType.title when boardType.itemName is not available', async () => {
                const selectedMockedBoard = mockedAllBoards.find(el => el.code === props.selectedBoardTypeCode);
                selectedMockedBoard!.itemName = undefined;
                selectedMockedBoard!.title = 'All Inclusive';
                render(<BoardSection {...props} isPostBooking />);

                await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));

                expect(mockStores.trackingStore.roomAndBoard.trackNewRoomOrBoardClick).toHaveBeenCalledWith(
                    EventTypes.PostBookingChangeBoardSelect,
                    'All Inclusive',
                    15,
                );
            });
        });
    });

    it('should show and hide alteration window when cancel alteration is clicked', async () => {
        render(<BoardSection {...props} />);
        expect(mockBoardAlterationDrawer).toBeCalledWith(
            expect.objectContaining({
                isAlterationModalShow: false,
            }),
        );

        await userEvent.click(screen.getByRole('button', { name: 'changeBoard' }));
        expect(mockBoardAlterationDrawer).toBeCalledWith(
            expect.objectContaining({
                isAlterationModalShow: true,
            }),
        );

        await userEvent.click(screen.getByRole('button', { name: 'handleCancelClick' }));
        expect(mockBoardAlterationDrawer).toBeCalledWith(
            expect.objectContaining({
                isAlterationModalShow: false,
            }),
        );
    });

    describe('BoardSectionButton title', () => {
        it('should pass hideLabelText as title when list is collapsed', () => {
            mockStores.layoutStore.isEditMode = true;
            render(<BoardSection {...props} />);

            expect(mockBoardSectionButtonComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: props.hideLabelText,
                }),
            );
        });

        it('should pass showLabelText as title when list is expanded on HD page', () => {
            mockStores.layoutStore.isEditMode = false;
            mockStores.layoutStore.isExtrasPage = false;
            render(<BoardSection {...props} />);

            expect(mockBoardSectionButtonComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: props.showLabelText,
                }),
            );
        });

        it('should pass editLabelText as title when list is expanded on Extras page', () => {
            mockStores.layoutStore.isEditMode = false;
            mockStores.layoutStore.isExtrasPage = true;
            render(<BoardSection {...props} />);

            expect(mockBoardSectionButtonComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: props.editLabelText,
                }),
            );
        });
    });
});
