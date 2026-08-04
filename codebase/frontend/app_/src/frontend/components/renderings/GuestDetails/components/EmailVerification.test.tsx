import React from 'react';
import { render, screen } from '@testing-library/react';

import { createAdultDetails } from 'frontend/utils/guestsValidation';
import { LoginCustomer } from 'models/data/LoginCustomer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { EmailVerification } from './EmailVerification';

jest.mock('frontend/components/common/ValidatableField/ValidatableFieldNew', () => ({ id }) => <input data-tid={id} />);
jest.mock('./EmailVerificationSignIn', () => () => <div data-tid='email-verification-sign-in'>Sign In</div>);

const createStores = () => ({
    guestDetailsStore: {
        customerLogin: new LoginCustomer(),
        validateEmail: jest.fn(),
        initializeEmailVerificationPage: jest.fn(),
    },
    layoutStore: { getPhrase: jest.fn(p => p) },
    userStore: { isVerifyingEmail: false },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockProps;
let mockStores = createStores();

describe('<EmailVerification />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = {
            guest: createAdultDetails(20, true),
            hasSignInPrompt: false,
        };
    });

    it('Should NOT render component if guest is not Lead', () => {
        mockProps.guest.isLead = false;
        const { container } = render(<EmailVerification {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render component correctly if email is not validated', () => {
        render(<EmailVerification {...mockProps} />);

        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(
            SitecoreDictionary.GuestDetailsTitlesEnterYourEmailAddress,
        );
        expect(
            screen.getByText(SitecoreDictionary.GuestDetailsDescriptionsEmailForBookingConfirmation),
        ).toBeInTheDocument();
        expect(screen.getByTestId('email-ADULT')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsContinue })).toBeInTheDocument();
    });

    it('Should render component correctly if email is validated and no SignIn', () => {
        mockStores.guestDetailsStore.customerLogin.email = 'test@test.com';
        mockStores.guestDetailsStore.customerLogin.isEmailValidated = true;
        mockStores.guestDetailsStore.customerLogin.isEmailExists = true;

        render(<EmailVerification {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent(SitecoreDictionary.GuestDetailsTitlesFillInDetails);
        expect(screen.getByTestId('email-ADULT')).toBeInTheDocument();
        expect(screen.queryByText(SitecoreDictionary.GuestDetailsDescriptionsEmailForBookingConfirmation)).toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
        expect(screen.queryByTestId('email-verification-sign-in')).toBeNull();
    });

    it('Should render Sign In if email is validated', () => {
        mockProps.hasSignInPrompt = true;
        mockStores.guestDetailsStore.customerLogin.isEmailValidated = true;

        render(<EmailVerification {...mockProps} />);

        expect(screen.getByTestId('email-verification-sign-in')).toBeInTheDocument();
    });

    it("Should NOT render Sigh In if email isn't validated", () => {
        mockProps.hasSignInPrompt = true;
        mockStores.guestDetailsStore.customerLogin.isEmailValidated = false;

        render(<EmailVerification {...mockProps} />);

        expect(screen.queryByTestId('email-verification-sign-in')).toBeNull();
    });
});
