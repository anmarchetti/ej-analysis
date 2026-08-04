import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';

import LoginDrawer from './LoginDrawer';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockDrawerProps = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockDrawerProps(props);

        return <div data-tid='drawer'>{children}</div>;
    },
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, dataTid }) => <button data-tid={dataTid} onClick={onClick} />,
}));

jest.mock('frontend/components/renderings/LoginForm/components/SingInSection', () => ({
    __esModule: true,
    default: () => <div data-tid='sing-in-section' />,
}));

jest.mock('frontend/components/renderings/ViewBooking/components/LoginPopupHeader', () => ({
    __esModule: true,
    default: () => <div data-tid='login-popup-header' />,
}));

const createProps = () => ({
    isShown: true,
    title: 'title',
    description: 'description',
    onLogin: jest.fn(),
    onClose: jest.fn(),
});

let props;
let mockStores;

describe('<LoginDrawer />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            layoutStore: {
                setIsBodyScrollLocked: jest.fn(),
                isBodyScrollLocked: false,
            },
            userStore: {
                customerLogin: {
                    onChangeEmail: jest.fn(),
                    cleanUpErrors: jest.fn(),
                    cleanUpModel: jest.fn(),
                    email: 'email',
                    emailErrors: [],
                    passwordErrors: [],
                    errors: [],
                    firstError: false,
                },
                initializeCustomerLogin: jest.fn(),
            },
            reCaptchaStore: {
                loadReCaptcha: jest.fn(),
            },
            trackingStore: {
                trackValidation: jest.fn(),
            },
        });
    });

    it('Should standard render', () => {
        render(<LoginDrawer {...props} />);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
        expect(mockDrawerProps).toHaveBeenCalledWith({ className: 'container', open: true });
    });

    it('Should call onClose when click on close button', async () => {
        render(<LoginDrawer {...props} />);

        await userEvent.click(screen.getByTestId('login-drawer-close'));
        expect(props.onClose).toHaveBeenCalled();
    });

    it('Should call onLogin when click on login button', async () => {
        render(<LoginDrawer {...props} />);

        await userEvent.click(screen.getByTestId('login-drawer-confirm'));

        expect(props.onLogin).toHaveBeenCalled();
    });
});
