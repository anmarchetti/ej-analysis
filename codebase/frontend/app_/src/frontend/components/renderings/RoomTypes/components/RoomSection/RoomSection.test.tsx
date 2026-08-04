import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NextRoomDisplayOption } from 'models/enum/NextRoomDisplayOption';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { BoardsAndRoomsEventAction } from 'models/enum/tracking/BoardsAndRooms';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import {
    defaultRoom,
    mostExpensiveRoom,
    nextMostExpensiveToSelectedRoom,
    roomWithFacilitiesAndPhotos,
} from 'frontend/components/renderings/RoomTypes/components/__mocks__/rooms';
import roomTypesFieldsMocks from 'frontend/components/renderings/RoomTypes/components/__mocks__/roomTypesFields';

import RoomSection from './RoomSection';

const createStores = () => ({
    appStore: {
        isScreenMedium: true,
    },
    layoutStore: {
        isExtrasPage: false,
        isEditMode: false,
        getPhrase: jest.fn(e => e),
    },
    trackingStore: {
        trackEventWithParams: jest.fn(),
    },
});

const createProps = () => {
    const fields = roomTypesFieldsMocks();

    return {
        selectedRoomIndex: 0,
        isLimitReached: false,
        isOriginalRoomChanged: false,
        originalRooms: [
            {
                index: 0,
                room: defaultRoom,
                alternativeRooms: [],
                allRoomsCodes: [
                    defaultRoom.code,
                    nextMostExpensiveToSelectedRoom.code,
                    roomWithFacilitiesAndPhotos.code,
                    mostExpensiveRoom.code,
                ],
            },
        ],
        offer: {
            id: '1',
        },
        selectedRoomSectionIndex: 0,
        selectedRoom: defaultRoom,
        alternativeRooms: [
            [defaultRoom, nextMostExpensiveToSelectedRoom, roomWithFacilitiesAndPhotos, mostExpensiveRoom],
        ],
        nextRoomDisplayOption: NextRoomDisplayOption.NextMostExpensiveToSelected,
        titleNextToSelectedRoomSingular: fields.TitleNextToSelectedRoomSingular?.value,
        titleNextToSelectedRoomPlural: fields.TitleNextToSelectedRoomPlural?.value,
        alterationInfoTitle: fields.AlterationInfoTitle,
        alterationInfoText: fields.AlterationInfoText,
        freeChildPlaceInfoTitle: fields.FreeChildPlaceInfoTitle,
        freeChildPlaceInfoText: fields.FreeChildPlaceInfoText,
        altLabelSingular: 'room available',
        altLabelPlural: 'rooms available',
        openPanelLabel: 'open panel',
        onChangePanel: jest.fn(),
        onDeleteItem: jest.fn(e => e),
        onUpdateRoom: jest.fn(e => e),
        deleteRoom: jest.fn(),
        editRoomInTheCurrentSection: jest.fn(),
        onCollapseSection: jest.fn(),
    };
};

const btnExpandSelector = { name: SitecoreDictionary.RoomTypesButtonsShowMore };
const btnCollapseSelector = { name: SitecoreDictionary.RoomTypesButtonsShowLess };
const btnExpandExtraSelector = { name: SitecoreDictionary.RoomTypesLabelsEditRoom };

let mockStores;
let props;

const mockRoomCardComponent = jest.fn();
const mockSectionPreviewComponent = jest.fn();

jest.mock('frontend/components/renderings/RoomTypes/components/RoomCard/RoomCard', () => ({
    __esModule: true,
    default: props => {
        mockRoomCardComponent(props);

        return <div data-tid='room-card' />;
    },
}));

jest.mock('frontend/components/renderings/RoomTypes/components/RoomSectionPreview/RoomSectionPreview', () => ({
    __esModule: true,
    default: props => {
        mockSectionPreviewComponent(props);

        return (
            <div data-tid='room-section-preview'>
                {props.openPanelLabel && <button onClick={props.openPanel}>{props.openPanelLabel}</button>}
                {props.showAlternativeRooms && <button onClick={props.showAlternativeRooms}>show alt rooms</button>}
            </div>
        );
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useEffect: jest.fn(),
}));

describe('<RoomSection />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    describe('Standard renderings', () => {
        it('Should render correct count of room cards with first room which is selected and with a title', () => {
            render(<RoomSection {...props} />);

            const allRoomCards = screen.getAllByTestId('room-card');

            expect(allRoomCards).toHaveLength(props.alternativeRooms[0].length - 1);
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(1, expect.objectContaining({ isSelected: true }));
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(3, expect.objectContaining({ isSpoiler: true }));
            expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
                `${props.alternativeRooms[0].length - 1} Rooms available`,
            );
        });

        it('Should toggle list of rooms when click on show more and show less CTA', async () => {
            const expecterCollapsedRoomCount = 3;

            render(<RoomSection {...props} />);

            const showMoreButton = screen.getByRole('button', btnExpandSelector);

            expect(showMoreButton).toBeInTheDocument();
            expect(screen.getAllByTestId('room-card')).toHaveLength(expecterCollapsedRoomCount);

            mockRoomCardComponent.mockReset();

            await userEvent.click(showMoreButton);

            expect(props.editRoomInTheCurrentSection).toHaveBeenCalledWith(props.selectedRoomSectionIndex);
            expect(screen.getAllByTestId('room-card')).toHaveLength(props.alternativeRooms[0].length);
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(3, expect.objectContaining({ isSpoiler: false }));

            mockRoomCardComponent.mockReset();

            const collapseBtn = screen.getByRole('button', btnCollapseSelector);

            expect(collapseBtn).toBeInTheDocument();

            await userEvent.click(collapseBtn);

            expect(props.onCollapseSection).toHaveBeenCalledWith(props.selectedRoomSectionIndex);
            expect(screen.getAllByTestId('room-card')).toHaveLength(expecterCollapsedRoomCount);
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(3, expect.objectContaining({ isSpoiler: true }));
        });

        it('Should not render show more CTA when there are less than 2 rooms available', () => {
            props.alternativeRooms = [[defaultRoom, mostExpensiveRoom]];

            render(<RoomSection {...props} />);

            expect(screen.queryByRole('button', btnExpandSelector)).not.toBeInTheDocument();
        });

        it('Should not render room cards when there are no rooms in the alternative rooms list', () => {
            props.alternativeRooms = [];

            render(<RoomSection {...props} />);

            expect(screen.queryAllByTestId('room-card')).toHaveLength(0);
        });

        it('Should render sectionLabel which shows the name of the room section', () => {
            props.originalRooms.push([]);

            render(<RoomSection {...props} />);

            expect(screen.getByTestId('room-section-close-btn')).toBeInTheDocument();
            expect(screen.getByText(SitecoreDictionary.RoomTypesLabelsRoom)).toBeInTheDocument();
            expect(screen.getByText(SitecoreDictionary.GlobalsButtonsClose)).toBeInTheDocument();
        });

        it('Should render show more CTA when section is collapsed with one visible room and there are only two available rooms to select', async () => {
            props.nextRoomDisplayOption = undefined;
            props.alternativeRooms = [[defaultRoom, nextMostExpensiveToSelectedRoom]];

            render(<RoomSection {...props} />);

            const button = screen.getByRole('button', btnExpandSelector);

            expect(button).toBeInTheDocument();
            expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();

            await userEvent.click(button);

            expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
                `${props.alternativeRooms[0].length - 1} Room available`,
            );
        });

        it('The room next to selected room should be a spoiler when the isOriginalRoomChanged prop is true', () => {
            props.isOriginalRoomChanged = true;

            render(<RoomSection {...props} />);

            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(2, expect.objectContaining({ isSpoiler: true }));
        });

        it('Should not render a subtitle when props with plural text is undefined', () => {
            props.titleNextToSelectedRoomPlural = undefined;

            render(<RoomSection {...props} />);

            expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
        });

        describe('Preview mode', () => {
            beforeEach(() => {
                props.isPreview = true;
            });

            it('Should render RoomSectionPreview when isPreview is true', () => {
                render(<RoomSection {...props} />);

                expect(screen.getByTestId('room-section-preview')).toBeInTheDocument();
                expect(mockSectionPreviewComponent).toBeCalledWith(
                    expect.objectContaining({
                        altRoomsCount: 3,
                        altLabel: props.altLabelPlural,
                        panelLabel: SitecoreDictionary.RoomTypesLabelsRoom,
                        roomType: props.selectedRoom.roomType,
                        sectionIndex: 0,
                        title: props.selectedRoom.roomType.title.value,
                    }),
                );
            });

            it('Should render RoomSectionPreview with a singular title', () => {
                props.alternativeRooms = [[defaultRoom, nextMostExpensiveToSelectedRoom]];

                render(<RoomSection {...props} />);

                expect(mockSectionPreviewComponent).toBeCalledWith(
                    expect.objectContaining({
                        altRoomsCount: 1,
                        altLabel: props.altLabelSingular,
                    }),
                );
            });

            it('Should render RoomSectionPreview with a correct title', () => {
                props.selectedRoom = { ...defaultRoom, roomType: undefined };

                render(<RoomSection {...props} />);

                expect(mockSectionPreviewComponent).toBeCalledWith(expect.objectContaining({ title: '' }));
            });

            it('Should call onChangePanel and track event on click cancel CTA', async () => {
                render(<RoomSection {...props} />);

                await userEvent.click(screen.getByRole('button', { name: props.openPanelLabel }));

                expect(props.onChangePanel).toBeCalledWith(0);
                expect(mockStores.trackingStore.trackEventWithParams).toBeCalledWith(
                    EventTypes.GenericEvent,
                    expect.objectContaining({
                        eventLabel: props.selectedRoom.roomType.title.value,
                        eventAction: BoardsAndRoomsEventAction.ShowRoomInformation,
                    }),
                    expect.objectContaining({
                        genericValue1: `${props.alternativeRooms[0].length - 1}`,
                    }),
                );
            });

            it('Should call onChangePanel and track event on click show alt rooms CTA', async () => {
                render(<RoomSection {...props} />);

                await userEvent.click(screen.getByRole('button', { name: 'show alt rooms' }));

                expect(props.onChangePanel).toBeCalledWith(0);
                expect(mockStores.trackingStore.trackEventWithParams).toBeCalledWith(
                    EventTypes.GenericEvent,
                    expect.objectContaining({
                        eventLabel: props.selectedRoom.roomType.title.value,
                        eventAction: BoardsAndRoomsEventAction.ShowOtherRooms,
                    }),
                    expect.anything(),
                );
            });
        });
    });

    describe('Mobile view renderings', () => {
        beforeEach(() => {
            mockStores.appStore.isScreenMedium = false;
        });

        it('Should display show more CTA on small screen', () => {
            render(<RoomSection {...props} />);

            expect(screen.getAllByTestId('room-card')).toHaveLength(2);
            expect(screen.getByRole('button', btnExpandSelector)).toBeInTheDocument();
        });

        it('Should call editRoomInTheCurrentSection on click show more CTA', async () => {
            render(<RoomSection {...props} />);

            await userEvent.click(screen.getByText(SitecoreDictionary.RoomTypesButtonsShowMore));

            expect(props.editRoomInTheCurrentSection).toHaveBeenCalled();
            expect(screen.getAllByTestId('room-card')).toHaveLength(2);
        });

        it('Should render ShowMoreButton with label when multiple rooms', () => {
            props.originalRooms.push([defaultRoom]);

            render(<RoomSection {...props} />);

            expect(screen.getByTestId('room-section-close-btn')).toBeInTheDocument();
            expect(screen.getByText(SitecoreDictionary.GlobalsButtonsClose)).toBeInTheDocument();
        });
    });

    describe('Check the order of card renderings', () => {
        it('Should render only the original room when original room is the most expensive room', () => {
            props.originalRooms[0].room = mostExpensiveRoom;
            props.selectedRoom = mostExpensiveRoom;

            render(<RoomSection {...props} />);

            expect(screen.getAllByTestId('room-card')).toHaveLength(1);
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ room: mostExpensiveRoom }),
            );
        });

        it('Should render only the original room when nextRoomDisplayOption setting is undefined', () => {
            props.nextRoomDisplayOption = undefined;

            render(<RoomSection {...props} />);

            expect(screen.getAllByTestId('room-card')).toHaveLength(1);
        });

        it('Should render all rooms when click show more and when nextRoomDisplayOption setting is undefined', async () => {
            props.nextRoomDisplayOption = undefined;

            render(<RoomSection {...props} />);

            expect(screen.getAllByTestId('room-card')).toHaveLength(1);

            await userEvent.click(screen.getByText(SitecoreDictionary.RoomTypesButtonsShowMore));

            expect(screen.getAllByTestId('room-card')).toHaveLength(props.alternativeRooms[0].length);
        });

        it('Should render the original room and next room that more expensive after the original', () => {
            render(<RoomSection {...props} />);

            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(1, expect.objectContaining({ room: defaultRoom }));
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ room: nextMostExpensiveToSelectedRoom }),
            );
        });

        it('Should render the original room and the most expensive room when section is collapsed', () => {
            props.nextRoomDisplayOption = NextRoomDisplayOption.MostExpensive;

            render(<RoomSection {...props} />);

            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(1, expect.objectContaining({ room: defaultRoom }));
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ room: mostExpensiveRoom }),
            );
        });

        it('Should render the original room, the most expensive room and the rest of the rooms when section is expanded', async () => {
            props.nextRoomDisplayOption = NextRoomDisplayOption.MostExpensive;

            render(<RoomSection {...props} />);

            expect(screen.getAllByTestId('room-card')).toHaveLength(3);

            await userEvent.click(screen.getByRole('button', btnExpandSelector));

            expect(screen.getAllByTestId('room-card')).toHaveLength(props.alternativeRooms[0].length);
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(1, expect.objectContaining({ room: defaultRoom }));
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ room: mostExpensiveRoom }),
            );
        });
    });

    describe('Booking Extras renderings', () => {
        beforeEach(() => {
            mockStores.layoutStore.isExtrasPage = true;
        });

        it('Should render one room card when section is collapsed', () => {
            render(<RoomSection {...props} />);

            expect(screen.getAllByTestId('room-card')).toHaveLength(1);
            expect(screen.getByRole('button', btnExpandExtraSelector)).toBeInTheDocument();
            expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
        });

        it('Should render subtitle with plural text value when section is expanded', async () => {
            render(<RoomSection {...props} />);

            expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();

            await userEvent.click(screen.getByRole('button', btnExpandExtraSelector));

            expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
                `${props.alternativeRooms[0].length - 1} Room available`,
            );
        });

        it('Should not render a subtitle when it is undefined', () => {
            props.titleNextToSelectedRoomSingular = undefined;

            render(<RoomSection {...props} />);

            expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
        });

        it('Should render RoomSectionPreview on extras when isPreview is true', () => {
            props.isPreview = true;

            render(<RoomSection {...props} />);

            expect(screen.getByTestId('room-section-preview')).toBeInTheDocument();
        });
    });

    describe('Experience Editor renderings', () => {
        beforeEach(() => {
            mockStores.layoutStore.isEditMode = true;
        });

        it('Should render edit and delete CTAs', () => {
            const expectedBtnCount = props.alternativeRooms[0].length;

            render(<RoomSection {...props} />);

            expect(screen.getAllByRole('button', { name: 'Update' })).toHaveLength(expectedBtnCount);
            expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(expectedBtnCount);
        });

        it('Should show all rooms ordered by default', () => {
            props.selectedRoom = mostExpensiveRoom;
            props.alternativeRooms = [[mostExpensiveRoom, nextMostExpensiveToSelectedRoom, defaultRoom]];

            render(<RoomSection {...props} />);

            const [firstRoomSection] = props.alternativeRooms;

            expect(screen.getAllByTestId('room-card')).toHaveLength(firstRoomSection.length);
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ room: firstRoomSection[0] }),
            );
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ room: firstRoomSection[1] }),
            );
            expect(mockRoomCardComponent).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({ room: firstRoomSection[2] }),
            );
        });
    });

    describe('sectionTitle', () => {
        beforeEach(() => {
            props.originalRooms.push(nextMostExpensiveToSelectedRoom);
        });

        it('should render sectionTitle', () => {
            render(<RoomSection {...props} />);

            expect(screen.getByTestId('room-section-title')).toBeInTheDocument();
            expect(screen.getByText(defaultRoom.roomType.title.value)).toBeInTheDocument();
        });
    });
});
