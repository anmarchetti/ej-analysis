import { render, screen } from '@testing-library/react';

import { roomTypeMock } from 'frontend/__mocks__';

import RoomDetails from './RoomDetails';

const createMockProps = () => ({
    roomType: roomTypeMock,
});

let mockProps;

describe('<RoomDetails />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should render RoomDetails component', () => {
        render(<RoomDetails {...mockProps} />);

        expect(screen.getByTestId('room-details')).toBeInTheDocument();
        expect(screen.getByTestId('room-details-icon')).toBeInTheDocument();
        expect(screen.getByText('roomType_title')).toBeInTheDocument();
    });

    it('should render dataTid if provided', () => {
        mockProps.dataTid = 'test-id';
        render(<RoomDetails {...mockProps} />);

        expect(screen.getByTestId('test-id')).toBeInTheDocument();
        expect(screen.getByTestId('test-id-icon')).toBeInTheDocument();
        expect(screen.getByTestId('test-id-title')).toBeInTheDocument();
    });

    it('should render className if provided', () => {
        mockProps.className = 'test-class';
        render(<RoomDetails {...mockProps} />);

        expect(screen.getByTestId('room-details')).toHaveClass('test-class');
    });
});
