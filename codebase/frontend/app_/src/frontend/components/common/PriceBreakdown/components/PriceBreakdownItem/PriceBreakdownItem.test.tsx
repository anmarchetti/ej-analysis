import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';

import PriceBreakdownItem, { IPriceBreakdownItemProps } from './PriceBreakdownItem';

const createProps = (): IPriceBreakdownItemProps => ({
    amount: 10,
    breakdownTitle: 'title',
    uniqueKey: 'uniqueKey',
    currency: CurrencyCode.GBP,
});

let mockProps = createProps();
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid={props[`data-tid`]} />;
    },
}));

const mockCalloutProps = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => props => {
    mockCalloutProps(props);

    return <div data-tid='callout'>{props.content}</div>;
});

describe('PriceBreakdownItem', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('should render standard', () => {
        render(<PriceBreakdownItem {...mockProps} />);

        expect(screen.getByTestId(`price-breakdown-details-${mockProps.uniqueKey}`)).toBeInTheDocument();
        expect(screen.getByTestId(`price-breakdown-details-${mockProps.uniqueKey}-title`)).toBeInTheDocument();
        const amount = screen.getByTestId(`price-breakdown-details-${mockProps.uniqueKey}-amount`);
        expect(amount).toHaveTextContent(`£${mockProps.amount}`);
        expect(amount).toHaveClass('price price');
        expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalled();
        expect(mockStores.marketStore.formatMoney).toHaveBeenCalledWith(mockProps.amount, {
            currency: mockProps.currency,
        });
    });

    it('should render component with class name when it is provided', () => {
        mockProps.className = 'container';
        render(<PriceBreakdownItem {...mockProps} />);

        expect(screen.getByTestId(`price-breakdown-details-${mockProps.uniqueKey}-row`)).toHaveClass(
            `breakdownRow ${mockProps.className}`,
        );
    });

    it('should render component with children when it is provided', () => {
        render(
            <PriceBreakdownItem {...mockProps}>
                <div data-tid='child' />
            </PriceBreakdownItem>,
        );

        expect(screen.getByTestId(`price-breakdown-details-${mockProps.uniqueKey}`)).toBeInTheDocument();
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should render subItems when they are provided', () => {
        mockProps.subItems = [
            { amount: 5, title: 'subItem1', className: 'class1' },
            { amount: 15, title: 'subItem2' },
        ];
        render(<PriceBreakdownItem {...mockProps} />);
        mockProps.subItems.forEach((subItem, index) => {
            const subItemElement = screen.getByTestId(
                `price-breakdown-details-${mockProps.uniqueKey}-subitem-${index}`,
            );
            expect(subItemElement).toBeInTheDocument();
            expect(subItemElement).toHaveTextContent(subItem.title);
            expect(subItemElement).toHaveTextContent(`£${subItem.amount}`);

            if (subItem.className) {
                expect(subItemElement).toHaveClass(`breakdownRow subItemRow ${subItem.className}`);
            }
        });
    });

    describe('Tooltip rendering', () => {
        beforeEach(() => {
            mockProps.tooltipText = 'tooltipText';
        });

        it('should render tooltip when it is provided', () => {
            render(<PriceBreakdownItem {...mockProps} />);

            expect(screen.getByTestId('callout')).toBeInTheDocument();
            expect(mockCalloutProps).toHaveBeenCalledWith({
                className: 'callout',
                orientation: 'top',
                position: 'right',
                isShownOnHover: true,
                isIconSmall: true,
                content: expect.anything(),
            });
        });

        it('Should render Callout with position on left on mobile', () => {
            mockUseMobileViewport = true;

            render(<PriceBreakdownItem {...mockProps} />);

            expect(mockCalloutProps).toHaveBeenCalledWith({
                className: 'callout',
                orientation: 'top',
                position: 'icon-left',
                isShownOnHover: true,
                isIconSmall: true,
                content: expect.anything(),
            });
        });
    });
});
