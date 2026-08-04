import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AccountCreatedForRedeemPopup from './AccountCreatedForRedeemPopup';

const createProps = () => ({
    ContentSuccessPopup: { value: 'ContentSuccessPopup {email}' },
});

const createStores = () => ({
    createAccountStore: { customerLogin: { email: 'mail@test.com' } },
    layoutStore: { getPhrase: jest.fn(p => p) },
    redeemVoucherStore: {
        isAccountCreatedForRedeemPopupVisible: true,
        setAccountCreatedForRedeemPopupVisible: jest.fn(),
        setValidatedVoucherPopupVisible: jest.fn(),
    },
    appStore: { isScreenMedium: true },
    routerStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

jest.mock('frontend/components/common/Drawer', () => ({ children }) => <div data-tid='drawer'>{children}</div>);

describe('<AccountCreatedForRedeemPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    describe('Desktop', () => {
        it('should NOT render when Account Created For Redeem Popup is NOT Visible', () => {
            mockStores.redeemVoucherStore.isAccountCreatedForRedeemPopupVisible = false;
            const { container } = render(<AccountCreatedForRedeemPopup {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should render popup', () => {
            const { getByTestId } = render(<AccountCreatedForRedeemPopup {...mockProps} />);

            expect(getByTestId('popup')).toBeInTheDocument();
        });

        it('should render title', () => {
            const { getByRole } = render(<AccountCreatedForRedeemPopup {...mockProps} />);

            expect(getByRole('heading')).toHaveTextContent(SitecoreDictionary.CreateAccountSuccessPopupAccountCreated);
        });

        it('should render content with email', () => {
            const { getByText } = render(<AccountCreatedForRedeemPopup {...mockProps} />);

            expect(getByText('ContentSuccessPopup mail@test.com')).toBeInTheDocument();
        });
    });

    describe('Mobile', () => {
        beforeEach(() => {
            mockStores.appStore.isScreenMedium = false;
        });

        it('should render drawer', () => {
            const { getByTestId } = render(<AccountCreatedForRedeemPopup {...mockProps} />);

            expect(getByTestId('drawer')).toBeInTheDocument();
        });

        it('should render continue button', () => {
            const { getByRole } = render(<AccountCreatedForRedeemPopup {...mockProps} />);

            expect(getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsContinue);
        });

        it('should render title', () => {
            const { getByRole } = render(<AccountCreatedForRedeemPopup {...mockProps} />);

            expect(getByRole('heading')).toHaveTextContent(SitecoreDictionary.CreateAccountSuccessPopupAccountCreated);
        });

        it('should render content with email', () => {
            const { getByText } = render(<AccountCreatedForRedeemPopup {...mockProps} />);

            expect(getByText('ContentSuccessPopup mail@test.com')).toBeInTheDocument();
        });
    });
});
