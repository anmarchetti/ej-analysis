import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockPriceJumpPopupFields } from 'frontend/__mocks__';

import PriceJumpPopupFooter, { IPriceJumpPopupFooterProps } from './PriceJumpPopupFooter';

let mockProps: IPriceJumpPopupFooterProps;

describe('<PriceJumpPopupFooter />', () => {
    beforeEach(() => {
        mockProps = {
            onClose: jest.fn(),
            onDecline: jest.fn(),
            fields: mockPriceJumpPopupFields,
            isOnlyCloseButton: false,
            isOnlyContinueButton: false,
        };
    });

    it('should render component', () => {
        render(<PriceJumpPopupFooter {...mockProps} />);

        expect(screen.getByTestId('pricejump-popup-go-back-cta')).toHaveTextContent(
            mockProps.fields!.DeclineButtonLabel.value,
        );
        expect(screen.getByTestId('pricejump-popup-continue-cta')).toHaveTextContent(
            mockProps.fields!.ContinueButtonLabel.value,
        );
    });

    it('should render only continue button when isOnlyContinueButton props provided', () => {
        mockProps.isOnlyContinueButton = true;

        render(<PriceJumpPopupFooter {...mockProps} />);

        expect(screen.getByTestId('pricejump-popup-continue-cta')).toHaveTextContent(
            mockProps.fields!.ContinueButtonLabel.value,
        );
        expect(screen.queryByTestId('pricejump-popup-go-back-cta')).not.toBeInTheDocument();
    });

    it('should render only continue button when isOnlyCloseButton props provided', () => {
        mockProps.isOnlyCloseButton = true;

        render(<PriceJumpPopupFooter {...mockProps} />);

        expect(screen.getByTestId('pricejump-popup-continue-cta')).toHaveTextContent(
            mockProps.fields!.CloseButtonLabel.value,
        );
        expect(screen.queryByTestId('pricejump-popup-go-back-cta')).not.toBeInTheDocument();
    });

    it('should render only continue button and handle click on it', async () => {
        mockProps.isOnlyContinueButton = true;

        render(<PriceJumpPopupFooter {...mockProps} />);

        const continueBtn = screen.getByTestId('pricejump-popup-continue-cta');

        await userEvent.click(continueBtn);

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should NOT render component when no fields props provided', () => {
        mockProps.fields = undefined;

        const { container } = render(<PriceJumpPopupFooter {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call onDecline while click decline button', async () => {
        render(<PriceJumpPopupFooter {...mockProps} />);

        const declineBtn = screen.getByTestId('pricejump-popup-go-back-cta');
        await userEvent.click(declineBtn);

        expect(mockProps.onDecline).toHaveBeenCalled();
    });

    it('should call onCLose while click continue button', async () => {
        render(<PriceJumpPopupFooter {...mockProps} />);

        const continueBtn = screen.getByTestId('pricejump-popup-continue-cta');
        await userEvent.click(continueBtn);

        expect(mockProps.onClose).toHaveBeenCalled();
    });
});
