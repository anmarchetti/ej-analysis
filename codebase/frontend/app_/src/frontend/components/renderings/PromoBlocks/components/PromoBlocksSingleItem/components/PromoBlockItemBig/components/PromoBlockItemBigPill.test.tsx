import React from 'react';
import { render, screen } from '@testing-library/react';

import { BigVariantPillAlignment } from 'models/enum/PromoBlocksBigVariantParams';

import { IPromoBlockItemBigPillProps, PromoBlockItemBigPill } from './PromoBlockItemBigPill';

const createStores = () => ({
    layoutStore: {
        isTouristTaxEnabled: true,
    },
});

jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: (callback: any) => callback(mockStores),
}));

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children }) => <div data-tid='tax-tooltip'>{children}</div>,
}));

const resetMocks = (): IPromoBlockItemBigPillProps => ({
    pillText: 'Pill text {pillPrice}',
    pillPrice: '123pp',
    alignment: BigVariantPillAlignment.Right,
});

let mockProps: IPromoBlockItemBigPillProps;
let mockStores;

describe('<PromoBlockItemBigPill />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createStores();
    });

    it('should render standard', () => {
        render(<PromoBlockItemBigPill {...mockProps} />);

        expect(screen.getByTestId('pill-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('pill-wrapper')).toHaveClass('pill');
        expect(screen.getByTestId('promo-block-pill')).toHaveClass('pillText');
    });

    it('should render empty container if pillText is empty string', () => {
        mockProps.pillText = '';
        const { container } = render(<PromoBlockItemBigPill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
        expect(screen.queryByTestId('pill-wrapper')).not.toBeInTheDocument();
    });

    it('should render with correct class name when left aligned', () => {
        mockProps.alignment = BigVariantPillAlignment.Left;
        render(<PromoBlockItemBigPill {...mockProps} />);

        expect(screen.getByTestId('pill-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('pill-wrapper')).toHaveClass('pill pillLeft');
    });

    it('should render TouristTaxGenericTooltip when isTouristTaxEnabled is true', () => {
        render(<PromoBlockItemBigPill {...mockProps} />);

        expect(screen.getByTestId('tax-tooltip')).toBeInTheDocument();
    });

    it('should NOT render TouristTaxGenericTooltip when isTouristTaxEnabled is false', () => {
        mockStores.layoutStore.isTouristTaxEnabled = false;
        render(<PromoBlockItemBigPill {...mockProps} />);

        expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
    });

    it('should NOT render TouristTaxGenericTooltip when isTouristTaxEnabled but pillPrice is empty string', () => {
        mockProps.pillPrice = '';
        render(<PromoBlockItemBigPill {...mockProps} />);

        expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
        expect(screen.getByText('Pill text')).toBeInTheDocument();
    });
});
