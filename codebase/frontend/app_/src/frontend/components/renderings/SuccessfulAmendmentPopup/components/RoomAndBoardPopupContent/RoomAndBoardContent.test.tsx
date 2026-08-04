import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { boardTypeMock, roomTypeMock } from 'frontend/__mocks__/room';

import RoomAndBoardPopupContent from './RoomAndBoardPopupContent';

expect.extend(toHaveNoViolations);

let mockStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStore,
}));

jest.mock('frontend/components/icons-new/HotelBedFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='hotel-bed-filled' />,
}));

const mockImageWithFilterProps = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: props => {
        mockImageWithFilterProps(props);

        return <div data-tid='image-with-filter' />;
    },
    SVGFilterMatrix: {
        Grayscale: 'grayscale',
    },
}));

describe('RoomAndBoardPopupContent', () => {
    beforeEach(() => {
        mockStore = createMockStores();
    });

    it('should render null if no booking', () => {
        mockStore.viewBookingStore.booking = null;

        const { container } = render(<RoomAndBoardPopupContent />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render room and board pop up content for a single room', () => {
        mockStore.viewBookingStore.booking.package.accom.rooms[0].roomType.title = 'Double Room';
        mockStore.viewBookingStore.booking.package.accom.rooms[0].boardType = {
            title: 'All Inclusive',
            iconUrl: 'iconUrl',
        };

        render(<RoomAndBoardPopupContent />);

        expect(screen.getByTestId('hotel-bed-filled')).toBeInTheDocument();
        expect(screen.getByTestId('successful-amendment-popup-room-1')).toBeInTheDocument();
        expect(screen.getByTestId('successful-amendment-popup-room-type-1')).toBeInTheDocument();
        expect(screen.getByText(/Double Room/)).toBeInTheDocument();
        expect(screen.getByTestId('image-with-filter')).toBeInTheDocument();
        expect(mockImageWithFilterProps).toHaveBeenCalledWith(
            expect.objectContaining({
                imageSrc: 'iconUrl',
                filterMatrix: 'grayscale',
            }),
        );
        expect(screen.getByText(/All Inclusive/)).toBeInTheDocument();
    });

    it('should render all rooms with indexed data-tids for a multiple room booking', () => {
        mockStore.viewBookingStore.booking.package.accom.rooms = [
            {
                ...mockStore.viewBookingStore.booking.package.accom.rooms[0],
                roomType: { ...roomTypeMock, title: 'Double Standard' },
                boardType: { ...boardTypeMock, title: 'Bed & Breakfast', iconUrl: 'bbIconUrl' },
            },
            {
                ...mockStore.viewBookingStore.booking.package.accom.rooms[0],
                roomType: { ...roomTypeMock, title: 'Double Standard with Lake View' },
                boardType: { ...boardTypeMock, title: 'Bed & Breakfast', iconUrl: 'bbIconUrl' },
            },
        ];

        render(<RoomAndBoardPopupContent />);

        expect(screen.getByTestId('successful-amendment-popup-room-1')).toBeInTheDocument();
        expect(screen.getByTestId('successful-amendment-popup-room-type-1')).toBeInTheDocument();
        expect(
            within(screen.getByTestId('successful-amendment-popup-room-type-1')).getByText(/Double Standard/),
        ).toBeInTheDocument();

        expect(screen.getByTestId('successful-amendment-popup-room-2')).toBeInTheDocument();
        expect(screen.getByTestId('successful-amendment-popup-room-type-2')).toBeInTheDocument();
        expect(
            within(screen.getByTestId('successful-amendment-popup-room-type-2')).getByText(
                /Double Standard with Lake View/,
            ),
        ).toBeInTheDocument();

        // Board row is rendered once, using the first room's boardType
        expect(screen.getByTestId('successful-amendment-popup-board')).toBeInTheDocument();
        expect(screen.getByTestId('successful-amendment-popup-board-type')).toBeInTheDocument();
        expect(screen.getByText(/Bed & Breakfast/)).toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<RoomAndBoardPopupContent />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
