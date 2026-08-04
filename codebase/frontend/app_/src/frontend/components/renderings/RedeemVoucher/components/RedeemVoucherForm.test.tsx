import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import RedeemVoucherForm, { IRedeemVoucherFormProps } from './RedeemVoucherForm';

const mockBreadcrumbs = jest.fn();
jest.mock('frontend/components/renderings/DestinationBreadcrumbs', () => ({
    __esModule: true,
    default: props => {
        mockBreadcrumbs(props);

        return <div data-tid='path-breadcrumbs' />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button data-tid='button' />;
    },
}));

const mockValidatableFieldProps = jest.fn();
jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => ({
    __esModule: true,
    default: props => {
        mockValidatableFieldProps(props);

        return <div data-tid='validatable-field' />;
    },
}));

jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: ({ header }) => <div data-tid='overlay-spinner'>{header}</div>,
}));

jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: ({ dictionaryKey }) => <span data-tid='rich-text-dictionary'>{dictionaryKey}</span>,
}));

jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: () => <div data-tid='callout' />,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='sitecore-text'>{field?.value}</div>,
}));

const createProps = (): IRedeemVoucherFormProps => ({
    fields: {
        AddCredit: mockSitecoreField('Add Credit'),
        CurrentCreditBalance: mockSitecoreField('Current Credit Balance'),
        FieldPlaceholder: mockSitecoreField('Enter voucher code'),
        Instruction1: mockSitecoreField('Instruction 1'),
        Instruction2: mockSitecoreField('Instruction 2'),
        InstructionsTitle: mockSitecoreField('Instructions Title'),
        MessageForVoucherWithDifferentCurrency: mockSitecoreField('Different currency message'),
        PreviousCredit: mockSitecoreField('Previous Credit'),
        Subtitle: mockSitecoreField('Subtitle text'),
        SubtitleLoginToRedeemPopup: mockSitecoreField('Login subtitle'),
        Title: mockSitecoreField('Redeem your voucher'),
        TitleAppliedPopup: mockSitecoreField('Applied'),
        TitleLoginToRedeemPopup: mockSitecoreField('Login title'),
        TitleValidatedPopup: mockSitecoreField('Validated'),
        Tooltip: mockSitecoreField('Tooltip text'),
        TooltipValidatedPopup: mockSitecoreField('Tooltip validated'),
        TotalCredit: mockSitecoreField('Total Credit'),
        VoucherAdded: mockSitecoreField('Voucher Added'),
        VoucherCostPopupLabel: mockSitecoreField('Voucher cost'),
        VoucherName: mockSitecoreField('Voucher Name'),
        VoucherWorthPopupLabel: mockSitecoreField('Voucher worth'),
    },
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isRedeemVoucherPage: true,
            isGiftCardRedemptionEnabled: true,
            getBreadcrumb: jest.fn(value => value),
        },
        redeemVoucherStore: {
            validateVoucherCode: jest.fn(),
            cleanupRedeemStore: jest.fn(),
            isVoucherCodeProcessing: false,
            error: null,
        },
        userStore: {
            logoutIfNotSignedIn: jest.fn(),
        },
        queryParamStore: {
            buildRedirectUrlToRedeemPage: jest.fn(),
        },
        routerStore: {
            redirectToHomePage: jest.fn(),
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RedeemVoucherForm />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should render the form', () => {
        render(<RedeemVoucherForm {...mockProps} />);

        expect(screen.getByTestId('path-breadcrumbs')).toBeInTheDocument();
        expect(screen.getByTestId('validatable-field')).toBeInTheDocument();
        expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    it('should redirect to home page if gift card redemption is not enabled', () => {
        mockStores.layoutStore.isGiftCardRedemptionEnabled = false;

        render(<RedeemVoucherForm {...mockProps} />);
        expect(mockStores.routerStore.redirectToHomePage).toHaveBeenCalled();
    });
});
