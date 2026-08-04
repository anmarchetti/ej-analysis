import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import {
    defaultRoom,
    mostExpensiveRoom,
    nextMostExpensiveToSelectedRoom,
} from 'frontend/components/renderings/RoomTypes/components/__mocks__/rooms';
import roomTypesFieldsMocks from 'frontend/components/renderings/RoomTypes/components/__mocks__/roomTypesFields';

import RoomsDrawer, { IRoomsDrawerProps } from './RoomsDrawer';

const createStores = () => ({
    layoutStore: {
        isBodyScrollLocked: false,
        setIsBodyScrollLocked: jest.fn(),
        getPhrase: jest.fn(e => e),
    },
    bookingStore: {
        selectedOffer: {
            accom: {
                unit: [defaultRoom, nextMostExpensiveToSelectedRoom, mostExpensiveRoom],
            },
        },
    },
});

const createProps = (): IRoomsDrawerProps => {
    const fields = roomTypesFieldsMocks();

    return {
        isOpen: false,
        alternativeRooms: [[nextMostExpensiveToSelectedRoom as IUnit, mostExpensiveRoom as IUnit]],
        activeRoomSectionIndex: 0,
        originalRooms: [
            {
                index: 0,
                room: defaultRoom as IUnit,
                alternativeRooms: [nextMostExpensiveToSelectedRoom as IUnit, mostExpensiveRoom as IUnit],
            },
        ],
        fallbackImage: 'fallback-img',
        isLoadingOffer: false,
        title: fields.Title,
        description: fields.Description,
        alterationInfoTitle: fields.AlterationInfoTitle,
        alterationInfoText: fields.AlterationInfoText,
        alterationExtendedInfoTitle: fields.AlterationExtendedInfoTitle,
        alterationExtendedInfoText: fields.AlterationExtendedInfoText,
        freeChildPlaceInfoTitle: fields.FreeChildPlaceInfoTitle,
        freeChildPlaceInfoText: fields.FreeChildPlaceInfoText,
        onChangeRoom: jest.fn(),
        onClose: jest.fn(),
    };
};

let mockStores;
let props;

jest.mock('frontend/components/renderings/RoomTypes/components/RoomCard/RoomCard', () => ({
    __esModule: true,
    default: ({ room }) => (
        <div>
            RoomCard
            <span>{room.code}</span>
        </div>
    ),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomsDrawer />', () => {
    beforeEach(() => {
        mockStores = createStores();
        props = createProps();
    });

    it('Should standard render', () => {
        render(<RoomsDrawer {...props} />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(props.title.value);
        expect(screen.getByText(props.description.value)).toBeInTheDocument();
        expect(screen.getAllByText('RoomCard')).toHaveLength(2);
        expect(screen.getByRole('button', { name: SitecoreDictionary.RoomTypesButtonsCancel })).toBeInTheDocument();
        expect(screen.getByTestId('drawer-room-select')).toBeInTheDocument();
    });

    it('Should sort alternative rooms by price', () => {
        props.alternativeRooms[0] = [mostExpensiveRoom, nextMostExpensiveToSelectedRoom];
        render(<RoomsDrawer {...props} />);

        const rooms = screen.getAllByText('RoomCard');

        expect(rooms).toHaveLength(2);
        expect(rooms[0]).toHaveTextContent(`RoomCard${nextMostExpensiveToSelectedRoom.code}`);
        expect(rooms[1]).toHaveTextContent(`RoomCard${mostExpensiveRoom.code}`);
    });

    it('Should skip render if no offer set', () => {
        mockStores.bookingStore.selectedOffer = false;
        const { container } = render(<RoomsDrawer {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should skip render if no alternativeRooms set', () => {
        props.alternativeRooms = [];
        const { container } = render(<RoomsDrawer {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render null if no originalRooms set', () => {
        props.originalRooms = [];
        render(<RoomsDrawer {...props} />);

        expect(screen.getByRole('dialog')).toBeEmptyDOMElement();
    });

    it('Should close drawer when cancel button is clicked', () => {
        render(<RoomsDrawer {...props} />);

        fireEvent.click(screen.getByRole('button', { name: SitecoreDictionary.RoomTypesButtonsCancel }));

        expect(props.onClose).toHaveBeenCalled();
    });

    it('Should not contain a heading and a description when they are missing from the props', () => {
        props.title = undefined;
        props.description = undefined;
        render(<RoomsDrawer {...props} />);

        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
        expect(screen.queryByTestId('board-and-room-drawer-subtitle')).not.toBeInTheDocument();
    });
});
