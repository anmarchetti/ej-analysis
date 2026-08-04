import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendFlightCardActions, { IAmendFlightCardActionsProps } from './AmendFlightCardActions';

expect.extend(toHaveNoViolations);

const createProps = (): IAmendFlightCardActionsProps => ({
    priceDifference: 15,
    priceTooltipText: <div>Tooltip Message</div>,
    onClickSelect: jest.fn(),
    currency: CurrencyCode.GBP,
    feeLabel: 'fee-label',
});

let mockProps;
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockButtonProps(props);

        return <div data-tid='button' onClick={onClick} {...props} />;
    },
}));

const mockCalloutProps = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockCalloutProps(props);

        return <div data-tid='callout' {...props} />;
    },
}));

describe('<AmendFlightCardActions />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    describe('Price Tooltip', () => {
        it('should render price tooltip if priceTooltipText is provided', () => {
            render(<AmendFlightCardActions {...mockProps} />);
            expect(screen.getByTestId('callout')).toBeInTheDocument();
            expect(mockCalloutProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    orientation: 'top',
                    position: 'right',
                    className: 'ms-2 text-center flight-card__price-tooltip',
                    isShownOnHover: true,
                }),
            );
        });

        it('should NOT render price tooltip if priceTooltipText is NOT provided', () => {
            mockProps.priceTooltipText = undefined;
            render(<AmendFlightCardActions {...mockProps} />);
            expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
        });
    });

    describe('Button', () => {
        it('should render Button with text only', () => {
            const { getByTestId } = render(<AmendFlightCardActions {...mockProps} />);
            expect(getByTestId('button')).toHaveTextContent('Select');
        });
    });

    it('Should render price > 0 and total label', () => {
        render(<AmendFlightCardActions {...mockProps} />);

        expect(screen.getByTestId('button')).toHaveTextContent(SitecoreDictionary.AlternativeFlightsButtonsSelect);
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isFullWidth: true,
                dataTid: 'select-button',
            }),
        );
    });

    it('Should render price === 0 and NO total label', () => {
        mockProps.priceDifference = 0;
        render(<AmendFlightCardActions {...mockProps} />);

        expect(screen.queryByTestId('prices')).not.toBeInTheDocument();
    });

    it('Should call onClickSelect from props when click on select button', async () => {
        render(<AmendFlightCardActions {...mockProps} />);

        const button = screen.getByTestId('button');
        await userEvent.click(button);

        expect(mockProps.onClickSelect).toHaveBeenCalledWith(mockProps.priceDifference);
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendFlightCardActions {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
