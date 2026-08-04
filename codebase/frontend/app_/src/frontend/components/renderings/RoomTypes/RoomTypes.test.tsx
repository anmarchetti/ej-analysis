import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import { defaultRoom, nextMostExpensiveToSelectedRoom } from './components/__mocks__/rooms';
import roomTypesFieldsMocks from './components/__mocks__/roomTypesFields';
import RoomTypes, { IRoomTypesFields, IRoomTypesParams } from './RoomTypes';

const createStores = () =>
    createMockStores({
        bookingStore: {
            selectedOffer: {
                accom: {
                    unit: [defaultRoom],
                },
            },
            alternativeRooms: [],
            failedLoadingOffersAlterations: false,
            isLoadingOffer: false,
            isRoomUnavailablePopupShown: false,
            changeRoom: jest.fn(),
        },
    });

const createProps = (): ISitecoreComponent<IRoomTypesFields, IRoomTypesParams> => {
    const fields = roomTypesFieldsMocks();

    return {
        fields: {
            Title: fields.Title,
        },
        params: {
            Anchor: 'anchor',
            Caching: '',
            CollapseRoomTypes: '',
        },
        rendering: {},
    };
};

let props;
let mockStores;

const mockRoomTypesWrapperComponent = jest.fn();

jest.mock('./components/RoomTypesWrapper/RoomTypesWrapper', () => ({
    __esModule: true,
    default: props => {
        mockRoomTypesWrapperComponent(props);

        return <div data-tid='room-types-wrapper' />;
    },
}));

jest.mock('./components/RoomUnavailablePopup/RoomUnavailablePopup', () => ({
    __esModule: true,
    default: () => <div data-tid='room-unavailable-popup' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomTypes />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<RoomTypes {...props} />);

        expect(screen.getByTestId('room-types-wrapper')).toBeInTheDocument();
        expect(mockRoomTypesWrapperComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                offer: mockStores.bookingStore.selectedOffer,
                units: [defaultRoom],
                fallbackImage: SiteSettings.HotelFallbackImage,
                fields: props.fields,
                isLoadingOffer: false,
                alternativeRooms: mockStores.bookingStore.alternativeRooms,
                originalRooms: [],
            }),
        );
    });

    it('should pass correct alternative and original rooms to the RoomTypesWrapper props', () => {
        const selectedRoomTitle = 'Selected room title';
        const altRoomTitle = 'Alt room title';
        const selectedRoom = { ...defaultRoom, roomType: { title: selectedRoomTitle } };
        const altRoom = { ...nextMostExpensiveToSelectedRoom, roomType: { title: altRoomTitle } };
        const expectedOriginalRooms = [
            {
                index: 0,
                room: { ...selectedRoom, roomType: { title: { value: selectedRoomTitle } } },
                alternativeRooms: [{ ...altRoom, roomType: { title: { value: altRoomTitle } } }],
                allRoomsCodes: [selectedRoom.code, altRoom.code],
            },
        ];

        const expectedAltRooms = [
            [
                { ...defaultRoom, roomType: { title: { value: selectedRoomTitle } } },
                { ...nextMostExpensiveToSelectedRoom, roomType: { title: { value: altRoomTitle } } },
            ],
        ];

        mockStores.bookingStore.selectedOffer.accom.unit = [selectedRoom];
        mockStores.bookingStore.alternativeRooms = [[selectedRoom, altRoom]];

        render(<RoomTypes {...props} />);

        expect(mockRoomTypesWrapperComponent).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                originalRooms: expectedOriginalRooms,
                alternativeRooms: expectedAltRooms,
                units: [selectedRoom],
            }),
        );
    });

    it('should not set alternative room when they are undefined', () => {
        mockStores.bookingStore.alternativeRooms = undefined;

        render(<RoomTypes {...props} />);

        expect(mockRoomTypesWrapperComponent).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                originalRooms: [
                    {
                        index: 0,
                        allRoomsCodes: [],
                        alternativeRooms: [],

                        room: defaultRoom,
                    },
                ],
                alternativeRooms: [],
            }),
        );
    });

    it('should render Room Unavailable Popup when prop isRoomUnavailablePopupShown is true', () => {
        mockStores.bookingStore.isRoomUnavailablePopupShown = true;

        render(<RoomTypes {...props} />);

        expect(screen.getByTestId('room-unavailable-popup')).toBeInTheDocument();
    });

    it('should render null when selected offer is not defined', () => {
        mockStores.bookingStore.selectedOffer = undefined;

        const { container } = render(<RoomTypes {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when there no fields received', () => {
        props.fields = undefined;

        const { container } = render(<RoomTypes {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
