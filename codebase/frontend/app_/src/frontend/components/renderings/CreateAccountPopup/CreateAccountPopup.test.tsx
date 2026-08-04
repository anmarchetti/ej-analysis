import React from 'react';
import { waitFor } from '@testing-library/dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { CreateAccountPopup } from './CreateAccountPopup';

jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='drawer'>{children}</div>,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: () => <div data-tid='sitecore-text' />,
}));

jest.mock('frontend/components/renderings/CreateAccount/CreateAccount', () => ({
    __esModule: true,
    default: ({ actionAfterSubmitting }) => <form data-tid='create-account' onSubmit={actionAfterSubmitting} />,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, footerContent, onClose }) => (
        <div data-tid='popup' onClick={onClose}>
            {children}
            {footerContent}
        </div>
    ),
}));

jest.mock('./components/AccountCreatedForRedeemPopup/AccountCreatedForRedeemPopup', () => ({
    __esModule: true,
    default: () => <div data-tid='account-created-for-redeem-popup' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = () => ({
    fields: {
        data: {
            PopupTitle: mockSitecoreField('popup title'),
            PopupSubtitle: mockSitecoreField('popup subtitle'),
            PopupDescription: mockSitecoreField('popup description'),
        },
    },
});

const createStores = () => ({
    appStore: { isScreenMedium: false },
    createAccountStore: {
        isCreateAccountPopupVisible: true,
        setCreateAccountPopupVisible: jest.fn(p => p),
        isCreateAccountForbidden: false,
        isCreateAccountSending: false,
        isFormValid: true,
    },
    redeemVoucherStore: {
        setLoginToRedeemPopupVisible: jest.fn(p => p),
        setAccountCreatedForRedeemPopupVisible: jest.fn(p => p),
        validateVoucherAfterLogin: jest.fn(),
    },
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
});

let mockProps;
let mockStores;

describe('<CreateAccountPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    describe('Drawer view', () => {
        it('should standard render', () => {
            render(<CreateAccountPopup {...mockProps} />);

            expect(screen.getByTestId('drawer')).toBeInTheDocument();
            expect(screen.getAllByTestId('sitecore-text')).toHaveLength(3);
            expect(screen.getAllByRole('button')).toHaveLength(2);
            expect(screen.getByTestId('account-created-for-redeem-popup')).toBeInTheDocument();
        });

        it('should NOT render CreateAccount when isCreateAccountPopupVisible is false', () => {
            mockStores.createAccountStore.isCreateAccountPopupVisible = false;
            render(<CreateAccountPopup {...mockProps} />);

            expect(screen.queryByTestId('create-account')).not.toBeInTheDocument();
            expect(screen.getByTestId('drawer')).toBeInTheDocument();
            expect(screen.getAllByTestId('sitecore-text')).toHaveLength(3);
            expect(screen.getAllByRole('button')).toHaveLength(2);
            expect(screen.getByTestId('account-created-for-redeem-popup')).toBeInTheDocument();
        });

        it('should NOT render when Fields are null', () => {
            mockProps.fields = false;
            const { container } = render(<CreateAccountPopup {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('Popup view', () => {
        it('should render when isScreenMedium is true', () => {
            mockStores.appStore.isScreenMedium = true;
            render(<CreateAccountPopup {...mockProps} />);

            expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
            expect(screen.getByTestId('popup')).toBeInTheDocument();
            expect(screen.getAllByTestId('sitecore-text')).toHaveLength(3);
            expect(screen.queryByTestId('create-account')).toBeInTheDocument();
            expect(screen.getByTestId('account-created-for-redeem-popup')).toBeInTheDocument();
        });

        it('should render when isScreenMedium is true and isCreateAccountPopupVisible is false', () => {
            mockStores.appStore.isScreenMedium = true;
            mockStores.createAccountStore.isCreateAccountPopupVisible = false;
            render(<CreateAccountPopup {...mockProps} />);

            expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
            expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
            expect(screen.getByTestId('account-created-for-redeem-popup')).toBeInTheDocument();
        });

        it('should call onClose on click', async () => {
            mockStores.appStore.isScreenMedium = true;
            render(<CreateAccountPopup {...mockProps} />);

            const spy = jest.spyOn(mockStores.createAccountStore, 'setCreateAccountPopupVisible');

            fireEvent.click(screen.getByTestId('popup'));

            await waitFor(() => expect(spy).toHaveBeenCalledWith(false));
        });

        it('should call setCreateAccountPopupVisible on click the back button', async () => {
            mockStores.appStore.isScreenMedium = true;
            const { container } = render(<CreateAccountPopup {...mockProps} />);

            const spy = jest.spyOn(mockStores.createAccountStore, 'setCreateAccountPopupVisible');

            fireEvent.click(container.getElementsByClassName('back-btn')[0]);

            await waitFor(() => expect(spy).toHaveBeenCalledWith(false));
        });

        it('should call setCreateAccountPopupVisible and setAccountCreatedForRedeemPopupVisible on click', async () => {
            mockStores.appStore.isScreenMedium = true;
            render(<CreateAccountPopup {...mockProps} />);

            const spy = jest.spyOn(mockStores.createAccountStore, 'setCreateAccountPopupVisible');
            const spy2 = jest.spyOn(mockStores.redeemVoucherStore, 'setAccountCreatedForRedeemPopupVisible');

            fireEvent.submit(screen.getByTestId('create-account'));

            await waitFor(() => expect(spy).toHaveBeenCalledWith(false));
            await waitFor(() => expect(spy2).toHaveBeenCalledWith(true));
        });
    });
});
