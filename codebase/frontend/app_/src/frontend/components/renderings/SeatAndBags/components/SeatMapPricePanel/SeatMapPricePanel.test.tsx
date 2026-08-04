import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { RouteDirection } from 'models/enum/RouteDirection';
import { SeatType } from 'models/enum/SeatType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ISeatMapPricePanelProps, SeatMapPricePanel } from './SeatMapPricePanel';

const createProps = (): ISeatMapPricePanelProps => ({
    seat: {
        priceBand: SeatType.UpFront,
        seatNumber: '1A',
        products: [],
        price: 29.99,
    },
    type: RouteDirection.Outbound,
    isPricesHidden: false,
    isLastChild: false,
});

let mockProps = createProps();
let mockStores = createMockStores({
    viewBookingStore: {
        isLuxuryPackage: false,
    },
});

const mockRichTextDictionary = jest.fn();
jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockRichTextDictionary(props);

        return <div data-tid='no-seat-selected-dictionary' {...props} />;
    },
}));

const mockLuxuryPill = jest.fn();
jest.mock('frontend/components/common/Pills/LuxuryPill/LuxuryPill', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockLuxuryPill(props);

        return <div data-tid='luxury-pill' {...props} />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SeatMapPricePanel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render default', () => {
        render(<SeatMapPricePanel {...mockProps} />);

        const pricePanel = screen.getByTestId('price-panel');
        expect(pricePanel).toHaveClass('wrapper');
        expect(pricePanel).not.toHaveClass('arrivalWrapper lastChildWrapper');

        const pricePanelContainer = screen.getByTestId('price-panel-container');
        expect(pricePanelContainer).toHaveClass('container');

        expect(screen.getByTestId('seat-price')).toHaveTextContent(`£${mockProps.seat!.price}`);

        const seatNumber = screen.getByTestId('seat-number');
        expect(seatNumber).toHaveTextContent(mockProps.seat!.seatNumber);
        expect(seatNumber).toHaveClass(
            'seat-confirmation__seat-number seat-confirmation__seat-number--alt seat-confirmation__seat-number--border-color-blue',
        );

        const priceBand = screen.getByTestId('price-band');
        expect(priceBand).toHaveTextContent(mockProps.seat!.priceBand);
        expect(priceBand).toHaveClass('text seatsGrayText');

        expect(screen.queryByTestId('no-seat-selected')).not.toBeInTheDocument();
        expect(screen.queryByTestId('no-seat-selected-container')).not.toBeInTheDocument();
        expect(screen.queryByTestId('no-seat-selected-text')).not.toBeInTheDocument();
    });

    it('should render no seat selected label with no seat', () => {
        delete mockProps.seat;

        render(<SeatMapPricePanel {...mockProps} />);

        const noSeatsSelected = screen.getByTestId('no-seat-selected');
        expect(noSeatsSelected).toHaveClass('wrapper');
        expect(noSeatsSelected).not.toHaveClass('arrivalWrapper lastChildWrapper');

        const noSeatsSelectedContainer = screen.getByTestId('no-seat-selected-container');
        expect(noSeatsSelectedContainer).toHaveClass('container');

        expect(screen.getByTestId('no-seat-selected-text')).toHaveClass('text');

        expect(mockRichTextDictionary).toHaveBeenCalledWith({
            dictionaryKey: SitecoreDictionary.SeatMapLabelsNoSeatSelectedSingular,
            tag: 'span',
            className: 'seatsGrayText',
        });

        expect(screen.queryByTestId('price-panel')).not.toBeInTheDocument();
    });

    it('should NOT render price when isPricesHidden is true', () => {
        mockProps.isPricesHidden = true;

        render(<SeatMapPricePanel {...mockProps} />);

        expect(screen.getByTestId('price-panel')).toBeInTheDocument();
        expect(screen.queryByTestId('seat-price')).not.toBeInTheDocument();
    });

    describe('Luxury Pill', () => {
        it('should render luxury pill instead price when isLuxuryPackage is true and priceBand is not premium', () => {
            mockStores.bookingStore.isLuxuryPackage = true;
            mockProps.seat!.priceBand = SeatType.Standard;

            render(<SeatMapPricePanel {...mockProps} />);

            expect(screen.getByTestId('luxury-pill')).toBeInTheDocument();
            expect(mockLuxuryPill).toHaveBeenCalled();
            expect(screen.queryByTestId('seat-price')).not.toBeInTheDocument();
        });

        it('should render luxury pill instead price when isLuxuryPackage on ViewBookingPage is true and priceBand is not premium', () => {
            mockStores.viewBookingStore.isLuxuryPackage = true;
            mockProps.seat!.priceBand = SeatType.Standard;

            render(<SeatMapPricePanel {...mockProps} />);

            expect(screen.getByTestId('luxury-pill')).toBeInTheDocument();
            expect(mockLuxuryPill).toHaveBeenCalled();
            expect(screen.queryByTestId('seat-price')).not.toBeInTheDocument();
        });

        it('should NOT render luxury pill when isLuxuryPackage is true and priceBand is premium', () => {
            mockStores.bookingStore.isLuxuryPackage = true;
            mockProps.seat!.priceBand = SeatType.UpFront;

            render(<SeatMapPricePanel {...mockProps} />);

            expect(screen.queryByTestId('luxury-pill')).not.toBeInTheDocument();
            expect(screen.getByTestId('seat-price')).toHaveTextContent(`£${mockProps.seat!.price}`);
        });

        it('should NOT render luxury pill when isLuxuryPackage is false', () => {
            mockStores.bookingStore.isLuxuryPackage = false;

            render(<SeatMapPricePanel {...mockProps} />);

            expect(screen.queryByTestId('luxury-pill')).not.toBeInTheDocument();
            expect(screen.getByTestId('seat-price')).toHaveTextContent(`£${mockProps.seat!.price}`);
        });
    });

    describe('Inbound route direction', () => {
        beforeEach(() => {
            mockProps.type = RouteDirection.Inbound;
        });

        it('should render arrivalWrapper style class when RouteDirection = inbound for no seat selected', () => {
            delete mockProps.seat;

            render(<SeatMapPricePanel {...mockProps} />);

            expect(screen.getByTestId('no-seat-selected')).toHaveClass('arrivalWrapper');

            expect(screen.queryByTestId('price-panel')).not.toBeInTheDocument();
        });
    });

    describe('isLastChild', () => {
        beforeEach(() => {
            mockProps.isLastChild = true;
            mockProps.type = RouteDirection.Inbound;
        });

        it('should apply isLastChild style for selected seats class when isLastChild AND RouteDirection = inbound', () => {
            render(<SeatMapPricePanel {...mockProps} />);

            expect(screen.getByTestId('price-panel')).toHaveClass('lastChildWrapper');
        });

        it('should NOT apply isLastChild style class when RouteDirection = outbound', () => {
            mockProps.type = RouteDirection.Outbound;

            render(<SeatMapPricePanel {...mockProps} />);

            expect(screen.getByTestId('price-panel')).not.toHaveClass('lastChildWrapper');
        });

        it('should NOT apply isLastChild style class when isLastChild is false', () => {
            mockProps.isLastChild = false;

            render(<SeatMapPricePanel {...mockProps} />);

            expect(screen.getByTestId('price-panel')).not.toHaveClass('lastChildWrapper');
        });

        it('should apply isLastChild style for no seat selection class when isLastChild AND RouteDirection = inbound', () => {
            delete mockProps.seat;

            render(<SeatMapPricePanel {...mockProps} />);

            expect(screen.getByTestId('no-seat-selected')).toHaveClass('lastChildWrapper');
        });
    });
});
