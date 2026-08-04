import { render, screen } from '@testing-library/react';

import HotelDetails from './HotelDetails';

const createMockProps = () => ({
    location: {
        city: 'Barcelona',
        region: 'Spain',
    },
    name: 'Exotic Hotel',
});

let mockProps;

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: () => mockUseMobileViewport,
}));

describe('<HotelDetails />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should render HotelDetails component', () => {
        render(<HotelDetails {...mockProps} />);

        expect(screen.getByText('Exotic Hotel')).toBeInTheDocument();
        expect(screen.getByText('Barcelona, Spain')).toBeInTheDocument();
    });

    it('should render HotelDetails component with different location format on desktop', () => {
        mockUseMobileViewport = false;
        render(<HotelDetails {...mockProps} />);

        expect(screen.getByTestId('hotel-details-location')).toHaveTextContent('Exotic Hotel, Barcelona');
    });

    it('should render dataTid if provided', () => {
        mockUseMobileViewport = true;
        mockProps.dataTid = 'test-id';
        render(<HotelDetails {...mockProps} />);

        expect(screen.getByTestId('test-id')).toBeInTheDocument();
        expect(screen.getByTestId('test-id-title')).toBeInTheDocument();
        expect(screen.getByTestId('test-id-location')).toBeInTheDocument();
    });

    it('should render className if provided', () => {
        mockProps.className = 'test-class';
        render(<HotelDetails {...mockProps} />);

        expect(screen.getByTestId('hotel-details')).toHaveClass('test-class');
    });
});
