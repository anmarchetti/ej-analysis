import * as React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { allBoards } from 'frontend/__mocks__/boards';
import { IUnit } from 'models/data/IOffer';
import { IOriginalRoom } from 'models/data/IOriginalRoom';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import {
    defaultRoom,
    mostExpensiveRoom,
    nextMostExpensiveToSelectedRoom,
} from 'frontend/components/renderings/RoomTypes/components/__mocks__/rooms';
import roomTypesFieldsMocks from 'frontend/components/renderings/RoomTypes/components/__mocks__/roomTypesFields';

import RoomTypesWrapper, { IRoomTypesWrapperProps } from './RoomTypesWrapper';

const createStores = () => ({
    appStore: {
        isScreenMedium: false,
    },
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
    bookingStore: {
        allBoardTypes: allBoards,
        createOfferSnapshot: jest.fn(),
    },
    trackingStore: {
        trackEventWithParams: jest.fn(),
    },
});

const createProps: () => IRoomTypesWrapperProps = () => ({
    originalRooms: [{ index: 0 } as IOriginalRoom, { index: 1 } as IOriginalRoom, { index: 2 } as IOriginalRoom],
    units: [defaultRoom as IUnit, nextMostExpensiveToSelectedRoom as IUnit, mostExpensiveRoom as IUnit],
    alternativeRooms: [
        [defaultRoom as IUnit],
        [nextMostExpensiveToSelectedRoom as IUnit],
        [nextMostExpensiveToSelectedRoom as IUnit],
    ],
    fallbackImage: '/hotel-details/fallback-image.ashx',
    offer: null,
    isLoadingOffer: false,
    fields: roomTypesFieldsMocks(),
    onChangeRoom: jest.fn(),
});

let mockStores;
let mockProps;
const expectedPriceChange = 123;

jest.mock('frontend/components/renderings/RoomTypes/components/RoomSection/RoomSection', () => ({
    __esModule: true,
    default: ({
        selectedRoom,
        selectedRoomSectionIndex,
        isPreview,
        editRoomInTheCurrentSection,
        alternativeRooms,
        onChangePanel,
        onChangeRoom,
    }) => (
        <div>
            RoomSection
            <span>{selectedRoom.code}</span>
            <span>{selectedRoomSectionIndex}</span>
            {isPreview && <span>isPreview</span>}
            {onChangePanel && <button onClick={() => onChangePanel(selectedRoomSectionIndex)}>changePanel</button>}
            {editRoomInTheCurrentSection && (
                <button onClick={() => editRoomInTheCurrentSection(selectedRoomSectionIndex)}>editRoom</button>
            )}
            {alternativeRooms[selectedRoomSectionIndex].map(e => (
                <div key={`${e.code}-${selectedRoomSectionIndex}`}>
                    <div>{e.code}</div>
                    {onChangeRoom && (
                        <button onClick={() => onChangeRoom(selectedRoomSectionIndex, e, expectedPriceChange)}>
                            changeRoom
                        </button>
                    )}
                </div>
            ))}
        </div>
    ),
}));

jest.mock('frontend/components/renderings/RoomTypes/components/RoomsDrawer/RoomsDrawer', () => ({
    __esModule: true,
    default: ({ isOpen, activeRoomSectionIndex, onClose }) => (
        <div>
            RoomsDrawer {isOpen && <span>isOpen</span>}
            <span>{activeRoomSectionIndex}</span>
            {onClose && <button onClick={onClose}>closeDrawer</button>}
        </div>
    ),
}));

jest.mock('frontend/components/renderings/RoomTypes/components/RoomCard/RoomCard', () => ({
    __esModule: true,
    default: ({ room }) => (
        <div>
            RoomCard <span>{room.code}</span>
        </div>
    ),
}));

jest.mock('frontend/components/renderings/BoardTypes/components/BoardCard/BoardCard', () => ({
    __esModule: true,
    default: () => <div>BoardCard</div>,
}));

jest.mock('frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer', () => ({
    __esModule: true,
    default: ({ isOpen, selectedItemElement, infoBlock, price, previousItemName, onCancel, onConfirm }) => (
        <div>
            BookingAlterationDrawer
            <span>{price}</span>
            <span>{selectedItemElement}</span>
            <span>{infoBlock}</span>
            <span>{previousItemName}</span>
            {isOpen && <span>isOpen</span>}
            {onCancel && <button onClick={onCancel}>cancel</button>}
            {onConfirm && <button onClick={onConfirm}>confirm</button>}
        </div>
    ),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomTypesWrapper />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<RoomTypesWrapper {...mockProps} />);

        expect(screen.getByTestId('board-and-room-separator')).toBeInTheDocument();
        expect(screen.getByTestId('room-types')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(mockProps.fields!.TitleMultiple!.value);
        expect(screen.getByText(mockProps.fields!.Description!.value)).toBeInTheDocument();
        expect(screen.getAllByTestId('delimiter')).toHaveLength(3);
        expect(screen.queryByText(SitecoreDictionary.RoomTypesLabelsErrorWhileLoading)).not.toBeInTheDocument();
        expect(screen.getAllByText('RoomSection')).toHaveLength(mockProps.units.length);
        expect(screen.getByText(mockProps.fields!.Description!.value)).toBeInTheDocument();
        expect(screen.getByText('RoomsDrawer')).toBeInTheDocument();
    });

    it('should render single Title and NOT render delimiters when room is single', () => {
        mockProps.units = [{ code: 'DB01' } as IUnit];

        render(<RoomTypesWrapper {...mockProps} />);

        expect(screen.queryByTestId('delimiter')).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(mockProps.fields!.Title!.value);
    });

    it('should render ErrorMessage when failedLoadingOffersAlterations is true', () => {
        mockProps.failedLoadingOffersAlterations = true;

        render(<RoomTypesWrapper {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.RoomTypesLabelsErrorWhileLoading)).toBeInTheDocument();
    });

    it('should NOT render RoomSections when originalRooms empty', () => {
        mockProps.originalRooms = [];

        render(<RoomTypesWrapper {...mockProps} />);

        expect(screen.queryByText('RoomSection')).not.toBeInTheDocument();
    });

    it('should NOT render RoomSections when units empty', () => {
        mockProps.units = [];

        render(<RoomTypesWrapper {...mockProps} />);

        expect(screen.queryByText('RoomSection')).not.toBeInTheDocument();
    });

    it('should set active room section and open drawer on mobile after call editRoomInTheCurrentSection', () => {
        render(<RoomTypesWrapper {...mockProps} />);

        const drawer = screen.getByText('RoomsDrawer');

        expect(drawer).not.toHaveTextContent('isOpen');
        expect(drawer).toHaveTextContent('0');

        fireEvent.click(within(screen.getAllByText('RoomSection')[2]).getByRole('button', { name: 'editRoom' }));

        expect(drawer).toHaveTextContent('isOpen');
        expect(drawer).toHaveTextContent('2');
    });

    it('should close drawer', () => {
        render(<RoomTypesWrapper {...mockProps} />);

        const drawer = screen.getByText('RoomsDrawer');

        fireEvent.click(within(screen.getAllByText('RoomSection')[2]).getByRole('button', { name: 'editRoom' }));
        fireEvent.click(within(drawer).getByRole('button', { name: 'closeDrawer' }));

        expect(drawer).not.toHaveTextContent('isOpen');
    });

    it('should NOT render RoomsDrawer when screen is medium', () => {
        mockStores.appStore.isScreenMedium = true;

        render(<RoomTypesWrapper {...mockProps} />);

        expect(screen.queryByText('RoomsDrawer')).not.toBeInTheDocument();
    });

    it('should display alteration drawer when user selects room with alteration option', async () => {
        render(<RoomTypesWrapper {...mockProps} />);

        const roomSections = screen.getAllByText('RoomSection');

        await userEvent.click(within(roomSections[0]).getByRole('button', { name: 'changeRoom' }));

        const alterationDrawer = await screen.findByText('BookingAlterationDrawer');

        expect(within(alterationDrawer).queryByText('isOpen')).not.toBeInTheDocument();

        await userEvent.click(within(roomSections[1]).getByRole('button', { name: 'changeRoom' }));

        await waitFor(() => {
            expect(within(alterationDrawer).getByText('isOpen')).toBeInTheDocument();
        });

        const selectedRoom = within(alterationDrawer).getByText('RoomCard');

        expect(within(selectedRoom).getByText(mockProps.units[1].code)).toBeInTheDocument();
        expect(within(alterationDrawer).getByText(expectedPriceChange)).toBeInTheDocument();
    });

    it('should select new room, reload offer and close alt drawer after confirm alteration', async () => {
        render(<RoomTypesWrapper {...mockProps} />);

        await waitFor(() =>
            fireEvent.click(within(screen.getAllByText('RoomSection')[1]).getByRole('button', { name: 'changeRoom' })),
        );

        const alterationDrawer = screen.getByText('BookingAlterationDrawer');

        await waitFor(() => fireEvent.click(within(alterationDrawer).getByRole('button', { name: 'confirm' })));

        expect(mockProps.onChangeRoom).toHaveBeenCalledWith(1, nextMostExpensiveToSelectedRoom, expectedPriceChange);

        expect(within(alterationDrawer).queryByText('isOpen')).not.toBeInTheDocument();
    });

    it('should swap active panels when room in section was clicked', () => {
        render(<RoomTypesWrapper {...mockProps} />);

        fireEvent.click(within(screen.getAllByText('RoomSection')[1]).getByRole('button', { name: 'changePanel' }));

        expect(screen.getAllByText('RoomSection')[0]).toHaveTextContent('isPreview');
        expect(screen.getAllByText('RoomSection')[1]).not.toHaveTextContent('isPreview');
        expect(screen.getAllByText('RoomSection')[2]).toHaveTextContent('isPreview');
    });

    describe('booking extra page', () => {
        beforeEach(() => {
            mockStores.layoutStore.isExtrasPage = true;
        });

        it('should have all sections collapsed on load', () => {
            render(<RoomTypesWrapper {...mockProps} />);

            screen.getAllByText('RoomSection').forEach(section => {
                expect(section).toHaveTextContent('isPreview');
            });
        });

        it('should have single room NOT collapsed on load', () => {
            mockProps.units = [{ code: 'DB01' } as IUnit];

            render(<RoomTypesWrapper {...mockProps} />);

            expect(screen.getByText('RoomSection')).not.toHaveTextContent('isPreview');
        });
    });
});
