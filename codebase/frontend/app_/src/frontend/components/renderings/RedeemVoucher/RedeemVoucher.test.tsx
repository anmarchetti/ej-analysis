import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import { RedeemVoucher, TRedeemVoucherProps } from './RedeemVoucher';

jest.mock('./components/RedeemVoucherForm', () => ({
    __esModule: true,
    default: () => <div data-tid='redeem-voucher-form' />,
}));

jest.mock('./components/ValidatedVoucherPopup', () => ({
    __esModule: true,
    default: () => <div data-tid='validated-voucher-popup' />,
}));

jest.mock('./components/VoucherAppliedPopup', () => ({
    __esModule: true,
    default: () => <div data-tid='voucher-applied-popup' />,
}));

jest.mock('./components/LoginToRedeemPopup', () => ({
    __esModule: true,
    default: () => <div data-tid='login-to-redeem-popup' />,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): TRedeemVoucherProps => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Subtitle: mockSitecoreField('Subtitle'),
        Tooltip: mockSitecoreField('Tooltip'),
        FieldPlaceholder: mockSitecoreField('FieldPlaceholder'),
        VoucherCostPopupLabel: mockSitecoreField('VoucherCostPopupLabel'),
        VoucherWorthPopupLabel: mockSitecoreField('VoucherWorthPopupLabel'),
        TitleValidatedPopup: mockSitecoreField('TitleValidatedPopup'),
        AddCredit: mockSitecoreField('AddCredit'),
        PreviousCredit: mockSitecoreField('PreviousCredit'),
        TotalCredit: mockSitecoreField('TotalCredit'),
        VoucherName: mockSitecoreField('VoucherName'),
        TooltipValidatedPopup: mockSitecoreField('TooltipValidatedPopup'),
        CurrentCreditBalance: mockSitecoreField('CurrentCreditBalance'),
        Instruction1: mockSitecoreField('Instruction1'),
        Instruction2: mockSitecoreField('Instruction2'),
        InstructionsTitle: mockSitecoreField('InstructionsTitle'),
        TitleAppliedPopup: mockSitecoreField('TitleAppliedPopup'),
        VoucherAdded: mockSitecoreField('VoucherAdded'),
        TitleLoginToRedeemPopup: mockSitecoreField('TitleLoginToRedeemPopup'),
        SubtitleLoginToRedeemPopup: mockSitecoreField('SubtitleLoginToRedeemPopup'),
        MessageForVoucherWithDifferentCurrency: mockSitecoreField('MessageForVoucherWithDifferentCurrency'),
    },
    params: {},
    rendering: {},
});

const createStores = () => ({
    layoutStore: {
        isRedeemVoucherPage: true,
        isGiftCardRedemptionEnabled: true,
    },
});

let mockProps;
let mockStores;
const mockPlaceholderComponent = jest.fn();

describe('<RedeemVoucher />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<RedeemVoucher {...mockProps} />);

        expect(screen.getByTestId('redeem-voucher-form')).toBeInTheDocument();
        expect(screen.getByTestId('validated-voucher-popup')).toBeInTheDocument();
        expect(screen.getByTestId('voucher-applied-popup')).toBeInTheDocument();
        expect(screen.getByTestId('login-to-redeem-popup')).toBeInTheDocument();
        expect(screen.getByTestId('placeholder')).toBeInTheDocument();

        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: PlaceholderNames.CreateAccountPopup,
            rendering: mockProps.rendering,
        });
    });

    describe('should NOT render', () => {
        it('when fields are null', () => {
            mockProps.fields = null;
            const { container } = render(<RedeemVoucher {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('when isGiftCardRedemptionEnabled/isRedeemVoucherPage is false', () => {
            mockStores.layoutStore.isRedeemVoucherPage = false;
            mockStores.layoutStore.isGiftCardRedemptionEnabled = false;
            const { container } = render(<RedeemVoucher {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    it('should NOT render RedeemVoucherForm when isRedeemVoucherPage is false', () => {
        mockStores.layoutStore.isRedeemVoucherPage = false;
        render(<RedeemVoucher {...mockProps} />);

        expect(screen.queryByTestId('redeem-voucher-form')).not.toBeInTheDocument();
        expect(screen.getByTestId('validated-voucher-popup')).toBeInTheDocument();
        expect(screen.getByTestId('voucher-applied-popup')).toBeInTheDocument();
        expect(screen.getByTestId('login-to-redeem-popup')).toBeInTheDocument();
        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
    });
});
