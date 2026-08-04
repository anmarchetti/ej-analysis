import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

import { createMockStores as createDefaultMockStores, mockBooking, mockUnitRoom } from 'frontend/__mocks__';

import AmendPaymentRoomsAndBoards, { IAmendDatesPaymentRoomBoardProps } from './AmendPaymentRoomsAndBoards';

const createProps = (): IAmendDatesPaymentRoomBoardProps => ({
    units: [mockUnitRoom, { ...mockUnitRoom, code: 'code1' }],
    dataTid: 'amend-payment-hotel-and-board',
    hotel: {
        location: mockBooking.package.location,
        name: 'hotel',
    },
});

let mockProps: IAmendDatesPaymentRoomBoardProps;
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

describe('<AmendDatesPaymentRoomBoard />', () => {
    beforeEach(() => {
        mockStores = createDefaultMockStores();
        mockProps = createProps();
    });

    it('Should render the component', () => {
        const { container } = render(<AmendPaymentRoomsAndBoards {...mockProps} />);

        expect(screen.getByTestId('amend-payment-hotel-and-board')).toBeInTheDocument();
        expect(screen.getByTestId('amend-payment-rooms')).toBeInTheDocument();
        expect(screen.getByTestId('amend-payment-board')).toBeInTheDocument();
        expect(screen.getByText('hotel')).toBeInTheDocument();
        expect(screen.getByText('boardType_title')).toBeInTheDocument();
        expect(screen.getByText('boardType_description')).toBeInTheDocument();
        expect(screen.getByText('Barcelona, package-region')).toBeInTheDocument();
        expect(screen.getAllByText('4 roomType_title').length).toBe(2);
        expect(mockImageFilterProps).toHaveBeenCalledWith(expect.objectContaining({ filterMatrix: 'grayscale' }));
        expect(container.querySelector('.rbc-hotel-board')).toBeInTheDocument();
    });

    it('Should render component with areSeparateRooms property', () => {
        mockProps.areSeparateRooms = true;
        render(<AmendPaymentRoomsAndBoards {...mockProps} />);

        expect(
            screen.getAllByText('RoomTypes.Labels.Room: roomType_title BookingSummary.Labels.ForPeople').length,
        ).toBe(2);
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendPaymentRoomsAndBoards {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
