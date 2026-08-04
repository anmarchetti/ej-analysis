import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import * as paymentJumpPopupUtils from 'frontend/components/renderings/Payment/components/PaymentJumpPopup/PaymentJumpPopup.utils';

import PaymentJumpPopup from './PaymentJumpPopup';

const mockAnimatedPopupComponent = jest.fn();
jest.mock('frontend/components/common/AnimatedPopup/AnimatedPopup', () => ({
    __esModule: true,
    default: ({ content, onClose, firstButton, secondButton, ...props }) => {
        mockAnimatedPopupComponent(props);

        return (
            <div data-tid='popup' onClick={onClose}>
                {content}

                <button
                    data-tid={firstButton.dataTid}
                    onClick={firstButton.onClick}
                    onKeyDown={jest.fn()}
                    className={firstButton.className}
                >
                    {firstButton.content}
                </button>
                <button
                    data-tid={secondButton.dataTid}
                    onClick={secondButton.onClick}
                    onKeyDown={jest.fn()}
                    className={secondButton.className}
                >
                    {secondButton.content}
                </button>
            </div>
        );
    },
}));

const createStores = createMockStores;

const createProps = (): paymentJumpPopupUtils.IPaymentJumpProps => ({
    acceptButton: mockSitecoreField('accept'),
    declineButton: mockSitecoreField('decline'),
    description: mockSitecoreField('description {price}'),
    title: mockSitecoreField('title'),
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUsePaymentJumpPopup = jest.spyOn(paymentJumpPopupUtils, 'default');
const mockOnDeclineClick = jest.fn();
const mockOnApproveClick = jest.fn();

describe('<PaymentJumpPopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
        mockUsePaymentJumpPopup.mockReturnValue({
            descriptionContent: 'description 2000',
            isPaymentPriceJump: true,
            onApproveClick: mockOnApproveClick,
            onDeclineClick: mockOnDeclineClick,
        });
    });

    it('should render popup with false isShown', () => {
        mockUsePaymentJumpPopup.mockReturnValue({
            descriptionContent: 'description 2000',
            isPaymentPriceJump: false,
            onApproveClick: mockOnApproveClick,
            onDeclineClick: mockOnDeclineClick,
        });

        render(<PaymentJumpPopup {...mockProps} />);

        expect(mockAnimatedPopupComponent).toHaveBeenCalledWith({
            containerClass: 'paymentPopup',
            isShown: false,
        });
    });

    it('should render elements correctly', () => {
        render(<PaymentJumpPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getByTestId('payment-jump-popup-accept-button')).toHaveTextContent('accept');
        expect(screen.getByTestId('payment-jump-popup-decline-button')).toHaveTextContent('decline');
        expect(screen.getByTestId('payment-jump-popup-title')).toHaveTextContent('title');
        expect(screen.getByTestId('payment-jump-popup-description')).toHaveTextContent('description 2000');

        expect(mockAnimatedPopupComponent).toHaveBeenCalledWith({
            containerClass: 'paymentPopup',
            isShown: true,
        });
    });

    it('should render without content when props are NOT provided', () => {
        mockUsePaymentJumpPopup.mockReturnValue({
            descriptionContent: '',
            isPaymentPriceJump: true,
            onApproveClick: mockOnApproveClick,
            onDeclineClick: mockOnDeclineClick,
        });

        render(<PaymentJumpPopup />);

        expect(screen.getByTestId('payment-jump-popup-accept-button')).toHaveTextContent('');
        expect(screen.getByTestId('payment-jump-popup-decline-button')).toHaveTextContent('');
        expect(screen.queryByTestId('payment-jump-popup-title')).not.toBeInTheDocument();
        expect(screen.queryByTestId('payment-jump-popup-description')).not.toBeInTheDocument();
    });

    it('should call onDeclineClick on decline button click', async () => {
        render(<PaymentJumpPopup />);

        await userEvent.click(screen.getByTestId('payment-jump-popup-decline-button'));

        expect(mockOnDeclineClick).toHaveBeenCalled();
    });

    it('should call onApproveClick on approve button click', async () => {
        render(<PaymentJumpPopup />);

        await userEvent.click(screen.getByTestId('payment-jump-popup-accept-button'));

        expect(mockOnApproveClick).toHaveBeenCalled();
    });
});
