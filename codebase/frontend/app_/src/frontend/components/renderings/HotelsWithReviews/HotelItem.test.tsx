import React from 'react';
import { render, screen } from '@testing-library/react';

import HotelItem from './HotelItem';
import { IHotelItem } from './HotelsWithReviews';

const createProps = (): IHotelItem => ({
    StarRating: 5,
    TotalNumberOfReviews: 5,
    HotelRating: 5,
    Name: 'Name',
    url: '/hotel-url',
    EcoFacility: {
        Tooltip: 'This hotel has a Global Sustainable Tourism Council recognised certification',
        Name: 'Certified sustainable',
    },
});

const createStores = () => ({
    layoutStore: {
        currentPath: 'currentPath',
        sitePath: 'sitePath',
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='link'>{children}</div>,
}));

jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: () => <div data-tid='star-rating' />,
}));

jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => ({
    __esModule: true,
    default: () => <div data-tid='trip-advisor-info' />,
}));

jest.mock('frontend/components/common/EcoCertifiedPill', () => ({
    __esModule: true,
    default: () => <div data-tid='eco-certified-pill' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HotelItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render', () => {
        render(<HotelItem {...mockProps} />);

        expect(screen.getByTestId('link')).toBeInTheDocument();
        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(screen.getByTestId('trip-advisor-info')).toBeInTheDocument();
        expect(screen.getByTestId('eco-certified-pill')).toBeInTheDocument();
    });

    it('should NOT render', () => {
        mockProps.Name = '';

        const { container } = render(<HotelItem {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when fields are NOT provided', () => {
        mockProps = undefined;

        const { container } = render(<HotelItem {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render all items', () => {
        render(<HotelItem {...mockProps} />);

        expect(screen.getByTestId('link')).toBeInTheDocument();
        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(screen.getByTestId('trip-advisor-info')).toBeInTheDocument();
        expect(screen.getByTestId('eco-certified-pill')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should NOT render HotelStarRating when StarRating is NOT provided', () => {
        mockProps.StarRating = undefined;

        render(<HotelItem {...mockProps} />);

        expect(screen.queryByTestId('star-rating')).not.toBeInTheDocument();
    });

    it('should NOT render TripadvisorInfo when HotelRating is NOT provided', () => {
        mockProps.HotelRating = undefined;

        render(<HotelItem {...mockProps} />);

        expect(screen.queryByTestId('trip-advisor-info')).not.toBeInTheDocument();
    });

    it('should NOT render TripadvisorInfo when TotalNumberOfReviews is NOT provided', () => {
        mockProps.TotalNumberOfReviews = 0;

        render(<HotelItem {...mockProps} />);

        expect(screen.queryByTestId('trip-advisor-info')).not.toBeInTheDocument();
    });

    it('should NOT render EcoCertifiedPill when EcoFacility is NOT provided', () => {
        mockProps.EcoFacility = undefined;

        render(<HotelItem {...mockProps} />);

        expect(screen.queryByTestId('eco-certified-pill')).not.toBeInTheDocument();
    });

    it('should NOT render EcoCertifiedPill when EcoFacility.Name is NOT provided', () => {
        mockProps.EcoFacility.Name = '';

        render(<HotelItem {...mockProps} />);

        expect(screen.queryByTestId('eco-certified-pill')).not.toBeInTheDocument();
    });
});
