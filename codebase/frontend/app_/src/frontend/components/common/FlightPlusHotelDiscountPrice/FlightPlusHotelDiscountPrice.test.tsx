import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FlightPlusHotelDiscountPrice, { IFlightPlusHotelDiscountPriceProps } from './FlightPlusHotelDiscountPrice';

const mockRichTextDictionary = jest.fn();
jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: (props: any) => {
        mockRichTextDictionary(props);

        return <p data-tid='rich-text-dictionary'>{props.dictionaryKey}</p>;
    },
}));

const createProps = (overrides?: Partial<IFlightPlusHotelDiscountPriceProps>): IFlightPlusHotelDiscountPriceProps => ({
    isFph: true,
    discount: 100,
    wrapperClassName: 'wrapper-class',
    priceClassName: 'price-class',
    formattedDiscount: '£100',
    ...overrides,
});

describe('FlightPlusHotelDiscountPrice', () => {
    beforeEach(() => {
        mockRichTextDictionary.mockClear();
    });

    it('should render component when isFph is true and discount is greater than 0', () => {
        const props = createProps();

        render(<FlightPlusHotelDiscountPrice {...props} />);

        expect(screen.getByTestId('flight-plus-hotel-discount')).toBeInTheDocument();
        expect(screen.getByTestId('rich-text-dictionary')).toBeInTheDocument();
    });

    it('should return null when isFph is false', () => {
        const props = createProps({ isFph: false });

        const { container } = render(<FlightPlusHotelDiscountPrice {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should return null when discount is 0', () => {
        const props = createProps({ discount: 0 });

        const { container } = render(<FlightPlusHotelDiscountPrice {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should return null when discount is negative', () => {
        const props = createProps({ discount: -10 });

        const { container } = render(<FlightPlusHotelDiscountPrice {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call RichTextDictionary with correct dictionary key', () => {
        const props = createProps();

        render(<FlightPlusHotelDiscountPrice {...props} />);

        expect(mockRichTextDictionary).toHaveBeenCalledWith(
            expect.objectContaining({
                tag: 'p',
                dictionaryKey: SitecoreDictionary.FlightPlusHotelPricesDiscount,
            }),
        );
    });

    it('should display formatted discount with minus sign', () => {
        const props = createProps({ formattedDiscount: '£250' });

        render(<FlightPlusHotelDiscountPrice {...props} />);

        expect(screen.getByText('-£250')).toBeInTheDocument();
    });

    it('should apply wrapperClassName correctly', () => {
        const props = createProps({ wrapperClassName: 'custom-wrapper-class' });

        render(<FlightPlusHotelDiscountPrice {...props} />);

        expect(screen.getByTestId('flight-plus-hotel-discount')).toHaveClass('custom-wrapper-class');
    });

    it('should apply priceClassName correctly', () => {
        const props = createProps({ priceClassName: 'custom-price-class' });

        render(<FlightPlusHotelDiscountPrice {...props} />);

        expect(screen.getByTestId('flight-plus-hotel-discount-price')).toHaveClass('custom-price-class');
    });

    it('should apply multiple classNames when provided', () => {
        const props = createProps({ wrapperClassName: 'class1 class2 class3' });

        render(<FlightPlusHotelDiscountPrice {...props} />);

        const wrapper = screen.getByTestId('flight-plus-hotel-discount');
        expect(wrapper).toHaveClass('class1');
        expect(wrapper).toHaveClass('class2');
        expect(wrapper).toHaveClass('class3');
    });

    it('should render without optional classNames', () => {
        const props = createProps({ wrapperClassName: undefined, priceClassName: undefined });

        render(<FlightPlusHotelDiscountPrice {...props} />);

        expect(screen.getByTestId('flight-plus-hotel-discount')).toBeInTheDocument();
    });
});
