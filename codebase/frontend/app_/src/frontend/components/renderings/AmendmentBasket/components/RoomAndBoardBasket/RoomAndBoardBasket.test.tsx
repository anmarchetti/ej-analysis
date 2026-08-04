import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

import { createMockStores, mockUnitRoom } from 'frontend/__mocks__';

import RoomAndBoardBasket from './RoomAndBoardBasket';

const createProps = () => ({
    units: [mockUnitRoom, { ...mockUnitRoom, code: 'code1' }],
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockImageFilterProps = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    SVGFilterMatrix: {
        Grayscale: 'grayscale',
        Orange: 'orange',
    },
    default: props => {
        mockImageFilterProps(props);

        return <div data-tid='image-with-filter' />;
    },
}));

describe('<RoomAndBoardBasket />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Should render the component', () => {
        render(<RoomAndBoardBasket {...mockProps} />);

        expect(screen.getByTestId('room-and-board-basket-rooms')).toBeInTheDocument();
        expect(screen.getByTestId('room-and-board-basket-room-icon')).toBeInTheDocument();
        expect(screen.getByText('Hotel Example')).toBeInTheDocument();
        expect(screen.getByText('Barcelona, package-region')).toBeInTheDocument();
        expect(
            screen.getAllByText('RoomTypes.Labels.Room: roomType_title BookingSummary.Labels.ForPeople'),
        ).toHaveLength(2);
        expect(screen.getByTestId('room-and-board-basket-board')).toBeInTheDocument();
        expect(screen.getByTestId('image-with-filter')).toBeInTheDocument();
        expect(screen.getByText('boardType_title')).toBeInTheDocument();
        expect(mockImageFilterProps).toHaveBeenCalledWith(expect.objectContaining({ filterMatrix: 'grayscale' }));
    });

    it('Should return null if no booking', () => {
        mockStores.viewBookingStore.booking = null;

        render(<RoomAndBoardBasket {...mockProps} />);

        expect(screen.queryByTestId('room-and-board-basket-rooms')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<RoomAndBoardBasket {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
