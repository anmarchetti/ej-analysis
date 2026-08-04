import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import { CustomerDetails } from 'models/data/CustomerDetails';
import { LoginCustomer } from 'models/data/LoginCustomer';

import { CreateAccount } from './CreateAccount';

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToErrorBlock: jest.fn(),
}));

let mockStores: any;
jest.mock('frontend/hooks/useStore', () => ({
    __esModule: true,
    default: (selector: any) => selector(mockStores),
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: (props: any) => {
        mockButtonProps(props);

        return (
            <button
                type={props.type ?? 'button'}
                data-tid='submit-btn'
                onClick={props.onClick}
                disabled={props.disabled}
            >
                {props.children}
            </button>
        );
    },
}));

const mockVFProps = jest.fn();
const mockVPFProps = jest.fn();
const mockVSProps = jest.fn();

jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => ({
    __esModule: true,
    default: ({ children, ...props }: any) => {
        mockVFProps(props);

        return (
            <div data-tid='vf' data-id={props.id}>
                {children}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/ValidatablePasswordField', () => ({
    __esModule: true,
    default: (props: any) => {
        mockVPFProps(props);

        return <div data-tid='vpf' data-id={props.id} />;
    },
}));

jest.mock('frontend/components/common/ValidatableSelectField', () => ({
    __esModule: true,
    default: (props: any) => {
        mockVSProps(props);

        return <div data-tid='vs' data-id={props.id} />;
    },
}));

const mockFieldSetProps = jest.fn();
jest.mock('./components/CreateAccountFieldSet', () => ({
    __esModule: true,
    CreateAccountFieldSet: (props: any) => {
        mockFieldSetProps(props);

        return (
            <div data-tid='fieldset' data-disabled={props.disabled ? 'true' : 'false'}>
                {props.children}
            </div>
        );
    },
}));

const getCapturedPropsById = (mockFn: jest.Mock, id: string) =>
    mockFn.mock.calls.map(c => c[0]).find((p: any) => p.id === id);

jest.mock('./components/AccountSignIn', () => ({
    __esModule: true,
    default: () => <div data-tid='account-signin' />,
}));

jest.mock('frontend/components/common/PhonePrefix', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('frontend/components/renderings/GuestDetails/components/SpecialOffersBlock', () => ({
    __esModule: true,
    default: () => <div data-tid='special-offers' />,
}));

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: () => <div data-tid='tooltip-trigger' />,
    TooltipContent: ({ text }: { text: string }) => <div data-tid='tooltip-content'>{text}</div>,
}));

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        getSetting: jest.fn(s => s),
        isCreateAccountPage: true,
    },
    appCatalogStore: {
        countryCodesSelectOptions: [
            { value: 'GBR', name: 'United Kingdom' },
            { value: 'BLR', name: 'Belarus' },
        ],
        dialingCodesSelectOptions: [
            { value: '44', name: '(+44) UK' },
            { value: '375', name: '(+375) Bel' },
        ],
        getCustomerTitlesSelectOptions: jest.fn(() => [
            { value: 'MS', name: 'MS' },
            { value: 'MR', name: 'MR' },
        ]),
    },
    createAccountStore: {
        initialize: jest.fn(),
        customerDetails: new CustomerDetails(),
        customerLogin: new LoginCustomer(),
        isCreateAccountForbidden: true,
        isCreateAccountSending: false,
        isFormValid: false,
        isSignInState: false,
        createAccountErrors: [] as any,
        forceErrors: false,
        toggleForceErrors: jest.fn(() => Promise.resolve()),
        changeEmail: jest.fn(),
        toggleSignInState: jest.fn(),
        createAccount: jest.fn(),
        signIn: jest.fn(),
    },
});

const createProps = () => ({
    fields: {
        airportsGroups: [],
        data: {
            LoginDetailsTitle: { value: 'LoginTitle' },
            LoginDetailsDescription: { value: 'LoginDescription' },
            AccountDetailsTitle: { value: 'AccountDetailsTitle' },
            AccountDetailsDescription: { value: 'AccountDetailsTitle' },
            AirportsTitle: { value: 'AirportsTitle' },
            AirportsDescription: { value: 'AirportsTitle' },
            OffersTitle: { value: 'OffersTitle' },
            OffersDescription: { value: 'OffersTitle' },
            OffersSectionTitle: { value: 'OffersSectionTitle' },
            OffersSectionDescription1: { value: 'OffersSectionDescription1' },
            OffersSectionDescription2: { value: 'OffersSectionDescription2' },
            PartnerOffersSectionTitle: { value: 'PartnerOffersSectionTitle' },
            POffersSectionDescription1: { value: 'POffersSectionDescription1' },
            POffersSectionDescription2: { value: 'POffersSectionDescription2' },
        },
    },
});

mockStores = createStores();
let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useEffect: f => f(),
}));

describe('<CreateAccount />', () => {
    beforeEach(() => {
        mockStores = createStores();
        props = createProps();
    });

    describe('Form view', () => {
        it('should call initialize() on first render', () => {
            render(<CreateAccount {...props} />);

            expect(mockStores.createAccountStore.initialize).toHaveBeenCalled();
        });

        it('should be empty render if there are no fields', () => {
            (props as any).fields = null;

            const { container } = render(<CreateAccount {...props} />);

            expect(container.firstChild).toBeNull();
        });

        it('should render almost disabled form if create account is forbidden', () => {
            const { container } = render(<CreateAccount {...props} />);

            expect(container.querySelector('form')).toBeInTheDocument();
            expect(screen.queryByTestId('account-signin')).not.toBeInTheDocument();

            const fieldsets = screen.getAllByTestId('fieldset');
            expect(fieldsets.length).toBe(4);

            const disabledCount = fieldsets.filter(n => n.getAttribute('data-disabled') === 'true').length;
            expect(disabledCount).toBe(3);

            const pwdProps = getCapturedPropsById(mockVPFProps, 'customer-password');
            expect(pwdProps).toBeTruthy();
            expect(pwdProps.disabled).toBe(true);

            const emailProps = getCapturedPropsById(mockVFProps, 'customer-email');
            expect(emailProps).toBeTruthy();
            expect(emailProps.disabled).not.toBe(true);

            const lastButtonProps = mockButtonProps.mock.calls.pop()?.[0];
            expect(lastButtonProps?.hasDisabledStyles).toBe(true);
        });

        it('should render active form if create account is allowed', () => {
            mockStores.createAccountStore.isCreateAccountForbidden = false;

            const { container } = render(<CreateAccount {...props} />);

            expect(container.querySelector('form')).toBeInTheDocument();

            const fieldsets = screen.getAllByTestId('fieldset');
            const disabledCount = fieldsets.filter(n => n.getAttribute('data-disabled') === 'true').length;

            expect(disabledCount).toBe(0);

            const pwdProps = getCapturedPropsById(mockVPFProps, 'customer-password');

            expect(pwdProps).toBeTruthy();
            expect(pwdProps.disabled).toBe(false);
        });

        it('should render SignIn block if it is SignIn State', () => {
            mockStores.createAccountStore.isSignInState = true;

            const { container } = render(<CreateAccount {...props} />);

            expect(screen.getByTestId('account-signin')).toBeInTheDocument();
            expect(container.querySelector('#customer-password')).not.toBeInTheDocument();
            expect(container.querySelector('#customer-email')).not.toBeInTheDocument();
        });
    });

    describe('Form fields', () => {
        beforeEach(() => {
            mockStores.createAccountStore.isCreateAccountForbidden = false;
        });

        it('should call onChangeField() for all mapped inputs', () => {
            mockStores.createAccountStore.isCreateAccountForbidden = false;

            render(<CreateAccount {...props} />);

            const spy = jest.spyOn(mockStores.createAccountStore.customerDetails, 'onChangeField');

            const fields = [
                'title', // VS
                'password', // VPF
                'firstName', // VF
                'lastName', // VF
                'address1', // VF
                'address2', // VF
                'city', // VF
                'postalCode', // VF
                'mobilePhone', // VF
                'dialingCode', // VS
                'countryCode', // VS
                'airport1', // VS
                'airport2', // VS
                'airport3', // VS
            ] as const;

            // map each field to the right mock
            const mockFor = (id: string) =>
                id === 'customer-password'
                    ? mockVPFProps
                    : [
                          'customer-title',
                          'customer-dialingCode',
                          'customer-countryCode',
                          'customer-airport1',
                          'customer-airport2',
                          'customer-airport3',
                      ].includes(id)
                    ? mockVSProps
                    : mockVFProps;

            fields.forEach(f => {
                const id = `customer-${f}`;
                const mockFn = mockFor(id);
                const captured = getCapturedPropsById(mockFn, id);
                expect(captured).toBeTruthy();

                captured.onChange('Test');

                expect(spy).toHaveBeenLastCalledWith(f, 'Test');
            });

            expect(spy).toHaveBeenCalledTimes(fields.length);
        });

        it('should call changeEmail() on email field change', () => {
            mockStores.createAccountStore.isCreateAccountForbidden = false;

            render(<CreateAccount {...props} />);

            const emailProps = getCapturedPropsById(mockVFProps, 'customer-email');
            expect(emailProps).toBeTruthy();

            emailProps.onChange('test@email.com');

            expect(mockStores.createAccountStore.changeEmail).toHaveBeenCalledWith('test@email.com');
        });
    });

    describe('Submit form', () => {
        it('should NOT submit data if create account is forbidden', async () => {
            mockStores.createAccountStore.isCreateAccountForbidden = true;

            render(<CreateAccount {...props} />);

            fireEvent.click(screen.getByTestId('submit-btn'));

            expect(mockStores.createAccountStore.createAccount).not.toHaveBeenCalled();
        });

        it('should NOT submit data if form already sending', async () => {
            mockStores.createAccountStore.isCreateAccountSending = true;

            render(<CreateAccount {...props} />);

            fireEvent.click(screen.getByTestId('submit-btn'));

            expect(mockStores.createAccountStore.createAccount).not.toHaveBeenCalled();
        });

        it('should NOT submit and scroll to errors if form is NOT valid', async () => {
            mockStores.createAccountStore.isCreateAccountForbidden = false;
            mockStores.createAccountStore.isFormValid = false;

            render(<CreateAccount {...props} />);

            fireEvent.click(screen.getByTestId('submit-btn'));

            expect(mockStores.createAccountStore.createAccount).not.toHaveBeenCalled();
            await waitFor(() => expect(mockStores.createAccountStore.toggleForceErrors).toHaveBeenCalledWith(true));
            expect(scrollToErrorBlock).toHaveBeenCalled();
        });

        it('should submit data if form is valid', async () => {
            mockStores.createAccountStore.isCreateAccountForbidden = false;
            mockStores.createAccountStore.isFormValid = true;

            render(<CreateAccount {...props} />);

            fireEvent.click(screen.getByTestId('submit-btn'));

            expect(mockStores.createAccountStore.createAccount).toHaveBeenCalled();
        });

        it('should scroll to errors if submit is failed', async () => {
            mockStores.createAccountStore.isCreateAccountForbidden = false;
            mockStores.createAccountStore.isFormValid = true;
            mockStores.createAccountStore.createAccount.mockRejectedValueOnce(new Error('fail'));

            render(<CreateAccount {...props} />);

            fireEvent.click(screen.getByTestId('submit-btn'));

            expect(mockStores.createAccountStore.createAccount).toHaveBeenCalled();
            await waitFor(() => expect(mockStores.createAccountStore.toggleForceErrors).toHaveBeenCalledWith(true));
            expect(scrollToErrorBlock).toHaveBeenCalled();
        });
    });

    describe('Errors', () => {
        it('should render error message', () => {
            mockStores.createAccountStore.createAccountErrors = [{ title: 'Error', description: 'Important Error' }];

            const { getByText } = render(<CreateAccount {...props} />);

            expect(getByText('Error')).toBeInTheDocument();
            expect(getByText('Important Error')).toBeInTheDocument();
        });
    });

    describe('Tooltip', () => {
        it('should render tooltip when setting is provided', () => {
            mockStores.layoutStore.getPhrase.mockReturnValue('tooltip text');

            render(<CreateAccount {...props} />);

            expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        });

        it('should NOT render tooltip when setting is NOT provided', () => {
            mockStores.layoutStore.getPhrase.mockReturnValue('');

            render(<CreateAccount {...props} />);

            expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        });
    });
});
