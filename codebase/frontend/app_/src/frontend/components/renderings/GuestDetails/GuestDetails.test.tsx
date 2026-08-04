import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { GuestDetailsPhase } from 'models/enum/GuestDetailsPhase';

import { GuestDetails, TGuestDetailsProps } from './GuestDetails';

import styles from './GuestDetails.module.scss';

const createStores = () => ({
    layoutStore: {
        isTradePortal: false,
        pageTitle: 'Guest Details',
        isSummaryBarEnabled: true,
        isSummaryBarHidden: false,
    },
    guestDetailsStore: {
        adults: [],
        initialize: jest.fn(() => true),
        clearGuestDetailsPhase: jest.fn(),
        saveGuestDetailsToSessionStorage: jest.fn(),
        guestDetailsPhase: GuestDetailsPhase.GuestsInfo,
    },
});

const resetMocks = (): TGuestDetailsProps => ({
    fields: {
        BlacklistedDomains: mockSitecoreField('example.com'),
        BlacklistedEmails: mockSitecoreField('test@example.com'),
        CheckboxLabel: mockSitecoreField('CheckboxLabel'),
        GuestInformationDescription: mockSitecoreField('GuestInformationDescription'),
        GuestInformationTitle: mockSitecoreField('GuestInformationTitle'),
        HasSignInPrompt: mockSitecoreField(true),
        HidePageTitle: mockSitecoreField(false),
        ImportantInformation: mockSitecoreField('ImportantInformation'),
        RemoveAllLabel: mockSitecoreField('RemoveAllLabel'),
        SurnameTooltip: mockSitecoreField('SurnameTooltip'),
        OffersSectionDescription1: mockSitecoreField('OffersSectionDescription1'),
        OffersSectionDescription2: mockSitecoreField('OffersSectionDescription2'),
        OffersSectionTitle: mockSitecoreField('OffersSectionTitle'),
        POffersSectionDescription1: mockSitecoreField('POffersSectionDescription1'),
        POffersSectionDescription2: mockSitecoreField('POffersSectionDescription2'),
        PartnerOffersSectionTitle: mockSitecoreField('PartnerOffersSectionTitle'),
    },
    params: {},
    rendering: {},
});

let mocks;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/GuestDetails/components/EmailVerificationSection', () => ({
    __esModule: true,
    default: () => <div data-tid='email-verification-section' />,
}));

jest.mock('frontend/components/renderings/GuestDetails/components/GuestDetailsSkeleton', () => ({
    __esModule: true,
    default: () => <div data-tid='guest-details-skeleton' />,
}));

jest.mock('frontend/components/renderings/GuestDetails/components/GuestDetailsFull', () => ({
    __esModule: true,
    default: () => <div data-tid='guest-details-full' />,
}));

jest.mock('frontend/components/renderings/GuestDetails/components/GuestPageInformation', () => ({
    __esModule: true,
    default: () => <div data-tid='guest-page-information' />,
}));

describe('<GuestDetails />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should call initialize function', () => {
        render(<GuestDetails {...mocks} />);

        expect(mockStores.guestDetailsStore.initialize).toHaveBeenCalled();
    });

    it('should save details to SessionStorage and clear phase on unmount', () => {
        const { unmount } = render(<GuestDetails {...mocks} />);

        unmount();

        expect(mockStores.guestDetailsStore.clearGuestDetailsPhase).toBeCalled();
        expect(mockStores.guestDetailsStore.saveGuestDetailsToSessionStorage).toBeCalled();
    });

    it('should render advanced container when summary bar is enabled and not hidden', () => {
        render(<GuestDetails {...mocks} />);

        expect(screen.getByTestId('guest-details-container')).toHaveClass(`${styles.wrapper} ${styles.advanced}`);
    });

    it('should NOT render advanced container when summary bar is disabled', () => {
        mockStores.layoutStore.isSummaryBarEnabled = false;

        render(<GuestDetails {...mocks} />);

        expect(screen.getByTestId('guest-details-container')).not.toHaveClass(`${styles.wrapper} ${styles.advanced}`);
    });

    it('should NOT render advanced container when summary bar is hidden', () => {
        mockStores.layoutStore.isSummaryBarHidden = true;

        render(<GuestDetails {...mocks} />);

        expect(screen.getByTestId('guest-details-container')).not.toHaveClass(`${styles.wrapper} ${styles.advanced}`);
    });

    it('should render GuestPageInformation component', () => {
        render(<GuestDetails {...mocks} />);

        expect(screen.getByTestId('guest-page-information')).toBeInTheDocument();
    });

    it('should render page title when HidePageTitle is false', () => {
        render(<GuestDetails {...mocks} />);

        expect(screen.getByRole('heading', { name: 'Guest Details' })).toBeInTheDocument();
    });

    it('should NOT render page title when HidePageTitle is true', () => {
        mocks.fields.HidePageTitle = mockSitecoreField(true);

        render(<GuestDetails {...mocks} />);

        expect(screen.queryByRole('heading', { name: 'Guest Details' })).toBeNull();
    });

    it('should render GuestDetailsFull when guestDetailsPhase is GuestInfo', () => {
        render(<GuestDetails {...mocks} />);

        expect(screen.getByTestId('guest-details-full')).toBeInTheDocument();
        expect(screen.queryByTestId('guest-details-skeleton')).toBeNull();
    });

    it('should render EmailVerificationSection when guestDetailsPhase is VerifyEmail', () => {
        mockStores.guestDetailsStore.guestDetailsPhase = GuestDetailsPhase.VerifyEmail;

        render(<GuestDetails {...mocks} />);

        expect(screen.getByTestId('email-verification-section')).toBeInTheDocument();
        expect(screen.queryByTestId('guest-details-skeleton')).toBeNull();
    });

    it('should NOT render when fields do NOT exist', () => {
        mocks.fields = null;

        const { container } = render(<GuestDetails {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render skeleton when guestDetailsPhase is null', () => {
        mockStores.guestDetailsStore.guestDetailsPhase = null as unknown as GuestDetailsPhase;

        render(<GuestDetails {...mocks} />);

        expect(screen.getByTestId('guest-details-skeleton')).toBeInTheDocument();
    });

    it('should NOT render skeleton when isTradePortal is true', () => {
        mockStores.layoutStore.isTradePortal = true;

        render(<GuestDetails {...mocks} />);

        expect(screen.queryByTestId('guest-details-skeleton')).toBeNull();
    });
});
