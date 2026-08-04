import { fireEvent, render, screen } from '@testing-library/react';

import { mockHotel } from 'frontend/__mocks__';

import HotelPreviewLink, { IHotelPreviewLinkProps } from './HotelPreviewLink';

const createMockProps = (): IHotelPreviewLinkProps => ({
    children: 'View hotel details',
    hotel: mockHotel,
    clickHandler: jest.fn(),
});

let mockProps;

const mockLinkProps = jest.fn();
jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: props => {
        mockLinkProps(props);

        return props.children;
    },
}));

jest.mock('frontend/utils/getHotelLocation', () => ({
    buildHotelDetailsUrl: () => 'hotel-url',
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: () => mockUseMobileViewport,
}));

describe('<HotelPreviewLink />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('Should render link with hotel-preview query param', () => {
        render(<HotelPreviewLink {...mockProps} />);

        const hotelPreviewCTA = screen.getByTestId('view-hotel-details');

        expect(hotelPreviewCTA).toHaveAttribute('target', '_blank');
        expect(mockLinkProps).toHaveBeenCalledWith({
            href: 'hotel-url?hotel-preview=1',
            legacyBehavior: true,
            children: expect.any(Object),
        });
    });

    it('Should render with children', () => {
        render(<HotelPreviewLink {...mockProps}>View hotel details</HotelPreviewLink>);

        expect(screen.getByTestId('view-hotel-details')).toHaveTextContent('View hotel details');
    });

    it('Should render with className', () => {
        render(<HotelPreviewLink {...mockProps} className='hotel-preview-link' />);

        expect(screen.getByTestId('view-hotel-details')).toHaveClass('hotel-preview-link');
    });

    it('Should NOT open in new tab on mobile', () => {
        mockUseMobileViewport = true;
        render(<HotelPreviewLink {...mockProps} />);

        expect(screen.getByTestId('view-hotel-details')).not.toHaveAttribute('target');
    });

    it('Should click event be invoked if exists', () => {
        render(<HotelPreviewLink {...mockProps} className='hotel-preview-link' />);

        fireEvent.click(screen.getByTestId('view-hotel-details'));

        expect(mockProps.clickHandler).toHaveBeenCalled();
    });

    it('Should click event be NOT invoked', () => {
        mockProps.clickHandler = undefined;

        render(<HotelPreviewLink {...mockProps} className='hotel-preview-link' />);

        expect(screen.getByTestId('view-hotel-details')).not.toHaveAttribute('onClick');
    });
});
