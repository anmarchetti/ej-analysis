import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

import { createMockStores as createDefaultMockStores, mockBooking, mockUnitRoom } from 'frontend/__mocks__';

import HolidaySummaryRoomAndBoard, { IHolidaySummaryRoomAndBoardProps } from './HolidaySummaryRoomAndBoard';

const createProps = (): IHolidaySummaryRoomAndBoardProps => ({
    units: [mockUnitRoom, { ...mockUnitRoom, code: 'code1' }],
    dataTid: 'amend-payment-hotel-and-board',
    hotel: {
        resort: {
            name: 'Barcelona',
            region: 'resort-region',
        },
        name: 'hotel',
    },
    accom: mockBooking.package.accom,
    showStayDuration: false,
});

let mockProps: IHolidaySummaryRoomAndBoardProps;
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

describe('<HolidaySummaryRoomAndBoard />', () => {
    beforeEach(() => {
        mockStores = createDefaultMockStores();
        mockProps = createProps();
    });

    it('Should render the component', () => {
        render(<HolidaySummaryRoomAndBoard {...mockProps} />);

        expect(screen.getAllByTestId('amend-payment-hotel-and-board')).toHaveLength(2);
        expect(screen.getAllByTestId('amend-payment-hotel-and-board-room-info')).toHaveLength(2);
        expect(screen.getAllByTestId('amend-payment-hotel-and-board-board-info')).toHaveLength(1);
        expect(screen.getByTestId('amend-payment-hotel-and-board-room-icon')).toBeInTheDocument();
        expect(screen.getByTestId('amend-payment-hotel-and-board-room-title')).toHaveTextContent('hotel');
        expect(screen.getByTestId('amend-payment-hotel-and-board-room-location')).toHaveTextContent(
            'Barcelona, resort-region',
        );
        expect(screen.getByText('hotel')).toBeInTheDocument();
        expect(screen.getByText('boardType_title')).toBeInTheDocument();
        expect(screen.getByText('boardType_description')).toBeInTheDocument();
        expect(
            screen.getAllByText('RoomTypes.Labels.Room: roomType_title BookingSummary.Labels.ForPeople').length,
        ).toBe(2);
        expect(mockImageFilterProps).toHaveBeenCalledWith(expect.objectContaining({ filterMatrix: 'grayscale' }));
    });

    it('Should render children and conditional className', () => {
        const { container } = render(
            <HolidaySummaryRoomAndBoard {...mockProps}>
                <div data-tid='child'>Child Component</div>
            </HolidaySummaryRoomAndBoard>,
        );

        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(container.querySelector('.blockWithChild')).toBeInTheDocument();
    });

    it('Should render stay duration when prop showStayDuration is true ', () => {
        mockProps.showStayDuration = true;
        render(<HolidaySummaryRoomAndBoard {...mockProps} />);

        expect(screen.getByTestId('amend-payment-hotel-and-board-duration-info')).toBeInTheDocument();
        expect(screen.getByTestId('amend-payment-hotel-and-board-duration-icon')).toBeInTheDocument();
        expect(screen.getByTestId('amend-payment-hotel-and-board-duration-text')).toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<HolidaySummaryRoomAndBoard {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
