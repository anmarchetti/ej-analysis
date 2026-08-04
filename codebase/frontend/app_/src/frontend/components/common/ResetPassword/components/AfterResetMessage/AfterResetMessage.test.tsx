import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AfterResetMessage, { IAfterResetMessageProps } from './AfterResetMessage';

const createProps = (): IAfterResetMessageProps => ({
    afterReset: jest.fn(),
    email: 'test@test.com',
    onClosePopup: jest.fn(),
});

const createStores = () => createMockStores();

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockButtonProps(props);

        return (
            <div data-tid={props.dataTid} onClick={props.onClick}>
                {children}
            </div>
        );
    },
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

let mockIsBookingFlow = false;
jest.mock('frontend/utils/buildSitecorePath', () => ({
    isBookingFlow: () => mockIsBookingFlow,
}));

describe('<ResetPassword />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('renders component NOT in booking flow', async () => {
        render(<AfterResetMessage {...mockProps} />);

        expect(screen.getByTestId('email-sent-msg')).toHaveTextContent(
            SitecoreDictionary.LoginDescriptionsWeSentAnEmailTo,
        );

        expect(screen.getByTestId('email-sent-additional-msg')).toHaveTextContent(
            SitecoreDictionary.LoginDescriptionsNotificationOutsideTheBookingFlow,
        );

        expect(screen.getByTestId('log-in-btn')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            isText: true,
            onClick: expect.any(Function),
            dataTid: 'log-in-btn',
        });
    });

    it('renders component  in booking flow', async () => {
        mockIsBookingFlow = true;
        render(<AfterResetMessage {...mockProps} />);

        expect(screen.getByTestId('email-sent-additional-msg')).toHaveTextContent(
            SitecoreDictionary.LoginDescriptionsNotificationInsideTheBookingFlow,
        );
    });

    it('handles log in click on password reset phase', async () => {
        render(<AfterResetMessage {...mockProps} />);
        await userEvent.click(screen.getByTestId('log-in-btn'));

        expect(mockProps.onClosePopup).toHaveBeenCalled();
        expect(mockProps.afterReset).toHaveBeenCalledWith(mockProps.email);
    });
});
