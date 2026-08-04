import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockBoardType, mockTransfer, roomTypeMock } from 'frontend/__mocks__';
import { createMockStores } from 'frontend/__mocks__/createMockStores';

import OfferExtras from './OfferExtras';

const createProps = () => ({
    boardType: mockBoardType,
    roomType: roomTypeMock,
    transfer: mockTransfer,
    ecoFacility: {
        name: 'Eco Facility',
        tooltip: 'Eco Facility Tooltip',
    },
    isUrgencyMessageVisible: true,
    avail: 5,
    className: '',
});

let mockProps = createProps();
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: jest.fn(() => mockUseMobileViewport),
}));

const mockEcoCertifiedPillProps = jest.fn();
jest.mock('frontend/components/common/EcoCertifiedPill', () => ({
    __esModule: true,
    default: props => {
        mockEcoCertifiedPillProps(props);

        return <div data-tid='eco-certified-pill' />;
    },
}));

const mockImageWithFilterProps = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: props => {
        mockImageWithFilterProps(props);

        return <div data-tid='image-with-filter' />;
    },
    SVGFilterMatrix: {
        Grayscale: 'Grayscale',
    },
}));

const mockUrgencyMessageProps = jest.fn();
jest.mock('frontend/components/common/UrgencyMessage/UrgencyMessage', () => ({
    __esModule: true,
    default: props => {
        mockUrgencyMessageProps(props);

        return <div data-tid='urgency-message' />;
    },
}));

describe('<OfferExtras />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render', () => {
        render(<OfferExtras {...mockProps} />);

        expect(screen.getByTestId('eco-certified-pill')).toBeInTheDocument();
        expect(mockEcoCertifiedPillProps).toHaveBeenCalledWith({
            title: mockProps.ecoFacility?.name,
            tooltip: mockProps.ecoFacility?.tooltip,
        });
        expect(screen.getByTestId('room-type')).toBeInTheDocument();
        expect(screen.getByTestId('room-icon')).toBeInTheDocument();
        expect(screen.getByText('roomType_title')).toBeInTheDocument();
        expect(screen.getByTestId('board-type')).toBeInTheDocument();
        expect(screen.getByTestId('board-icon')).toBeInTheDocument();
        expect(screen.getByText('Half Board')).toBeInTheDocument();
        expect(screen.getByTestId('transfer')).toBeInTheDocument();
        expect(screen.getByTestId('transfer-icon')).toBeInTheDocument();
        expect(screen.getByText('Transfer Name')).toBeInTheDocument();
        expect(screen.getByTestId('image-with-filter')).toBeInTheDocument();
        expect(screen.getByTestId('urgency-message')).toBeInTheDocument();
        expect(mockImageWithFilterProps).toHaveBeenCalledWith({
            imageSrc: 'https://example.com/transfer-icon.png',
            filterMatrix: 'Grayscale',
            className: 'icon',
        });
    });

    it('should NOT render EcoCertifiedPill if ecoFacility is not provided', () => {
        mockProps.ecoFacility = undefined as any;
        render(<OfferExtras {...mockProps} />);

        expect(screen.queryByTestId('eco-certified-pill')).not.toBeInTheDocument();
    });

    it('should NOT render EcoCertifiedPill on desktop', () => {
        mockUseMobileViewport = false;
        render(<OfferExtras {...mockProps} />);

        expect(screen.queryByTestId('eco-certified-pill')).not.toBeInTheDocument();
    });

    it('should render UrgencyMessage, and relevant classes if isUrgencyMessageVisible is true and if desktop', () => {
        mockUseMobileViewport = false;
        render(<OfferExtras {...mockProps} />);

        expect(screen.getByTestId('urgency-message')).toBeInTheDocument();
        expect(mockUrgencyMessageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'urgencyMessage',
                message: '',
                tooltip: 'SearchResults.Labels.HurryTooltip',
            }),
        );
        expect(screen.getByTestId('room-type')).toHaveClass('roomDetailsItem');
        expect(screen.getByTestId('room-title')).toHaveClass('roomDetails');
    });

    it('should NOT render UrgencyMessage if isUrgencyMessageVisible is false', () => {
        mockProps.isUrgencyMessageVisible = false;
        render(<OfferExtras {...mockProps} />);

        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
        expect(screen.getByTestId('room-type')).not.toHaveClass('roomDetailsItem');
        expect(screen.getByTestId('room-title')).not.toHaveClass('roomDetails');
    });

    it('should NOT render UrgencyMessage if avail is not provided', () => {
        mockProps.avail = undefined as any;
        render(<OfferExtras {...mockProps} />);

        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
        expect(screen.getByTestId('room-type')).not.toHaveClass('roomDetailsItem');
        expect(screen.getByTestId('room-title')).not.toHaveClass('roomDetails');
    });

    it('should NOT render transfer if transfer is not provided', () => {
        mockProps.transfer = undefined as any;
        render(<OfferExtras {...mockProps} />);

        expect(screen.queryByTestId('transfer')).not.toBeInTheDocument();
    });

    it('should NOT render transferIcon if transferIconUrl is not provided', () => {
        mockProps.transfer.iconUrl = undefined as any;
        render(<OfferExtras {...mockProps} />);

        expect(screen.queryByTestId('image-with-filter')).not.toBeInTheDocument();
    });

    it('should apply className if provided', () => {
        mockProps.className = 'test-class';
        render(<OfferExtras {...mockProps} />);

        expect(screen.getByTestId('trip-details')).toHaveClass('test-class');
    });

    it('should render roomType when roomType is provided', () => {
        render(<OfferExtras {...mockProps} />);

        expect(screen.getByTestId('room-type')).toBeInTheDocument();
        expect(screen.getByTestId('room-icon')).toBeInTheDocument();
        expect(screen.getByTestId('room-title')).toBeInTheDocument();
    });

    it('should render empty room label when roomType is not provided', () => {
        mockProps.roomType = undefined as any;
        render(<OfferExtras {...mockProps} />);

        expect(screen.getByTestId('room-title')).toBeInTheDocument();
        expect(screen.getByTestId('room-title')).toHaveTextContent('');
    });
});
