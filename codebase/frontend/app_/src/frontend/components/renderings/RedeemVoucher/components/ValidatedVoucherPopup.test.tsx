import React from 'react';
import { waitFor } from '@testing-library/dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { VoucherTypes } from 'models/enum/VoucherTypes';

import ValidatedVoucherPopup, { IValidatedVoucherPopupProps } from './ValidatedVoucherPopup';

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToElement: jest.fn(),
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, dataId, onLinkClick }) => (
        <div onClick={onLinkClick} data-tid={dataId}>
            {field.value}
        </div>
    ),
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, footerContent }) => (
        <div data-tid='popup'>
            <div data-tid='children'>{children}</div>
            <div data-tid='footer-content'>{footerContent}</div>
        </div>
    ),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockProps;
let mockStores;

const createMocks = (): IValidatedVoucherPopupProps => ({
    fields: {
        AddCredit: mockSitecoreField('AddCredit'),
        CurrentCreditBalance: mockSitecoreField('CurrentCreditBalance'),
        FieldPlaceholder: mockSitecoreField('FieldPlaceholder'),
        Instruction1: mockSitecoreField('Instruction1'),
        Instruction2: mockSitecoreField('Instruction2'),
        InstructionsTitle: mockSitecoreField('InstructionsTitle'),
        MessageForVoucherWithDifferentCurrency: mockSitecoreField('MessageForVoucherWithDifferentCurrency'),
        PreviousCredit: mockSitecoreField('PreviousCredit'),
        Subtitle: mockSitecoreField('Subtitle'),
        SubtitleLoginToRedeemPopup: mockSitecoreField('SubtitleLoginToRedeemPopup'),
        Title: mockSitecoreField('Title'),
        TitleAppliedPopup: mockSitecoreField('TitleAppliedPopup'),
        TitleLoginToRedeemPopup: mockSitecoreField('TitleLoginToRedeemPopup'),
        TitleValidatedPopup: mockSitecoreField('TitleValidatedPopup'),
        Tooltip: mockSitecoreField('Tooltip'),
        TooltipValidatedPopup: mockSitecoreField('TooltipValidatedPopup'),
        TotalCredit: mockSitecoreField('TotalCredit'),
        VoucherAdded: mockSitecoreField('VoucherAdded'),
        VoucherCostPopupLabel: mockSitecoreField('VoucherCostPopupLabel'),
        VoucherName: mockSitecoreField('VoucherName'),
        VoucherWorthPopupLabel: mockSitecoreField('VoucherWorthPopupLabel'),
    },
});

describe('ValidatedVoucherPopup', () => {
    beforeEach(() => {
        mockProps = createMocks();
        mockStores = createMockStores({
            redeemVoucherStore: {
                voucher: {
                    active: 'true',
                    amount: 100,
                    currency: CurrencyCode.GBP,
                    userCurrentBalance: 0,
                    userNewBalance: 100,
                    voucherCode: 'code',
                    voucherType: VoucherTypes.GiftVoucher,
                },
                isValidatedVoucherPopupVisible: true,
                setValidatedVoucherPopupVisible: jest.fn(),
            },
            marketStore: {
                currency: CurrencyCode.EUR,
            },
            appStore: {
                isScreenMedium: true,
            },
        });
    });

    it('should render message about different market when user use voucher with different currency then market', () => {
        render(<ValidatedVoucherPopup {...mockProps} />);

        expect(screen.getByTestId('message-for-voucher-with-different-currency')).toBeInTheDocument();
    });

    it('should NOT render message about different market when user use voucher with the same currency as market', () => {
        mockStores.marketStore.currency = CurrencyCode.GBP;
        render(<ValidatedVoucherPopup {...mockProps} />);

        expect(screen.queryByTestId('message-for-voucher-with-different-currency')).not.toBeInTheDocument();
    });

    it('should call close popup and scroll after click on link in text', () => {
        render(<ValidatedVoucherPopup {...mockProps} />);

        fireEvent.click(screen.getByTestId('message-for-voucher-with-different-currency'));

        expect(mockStores.redeemVoucherStore.setValidatedVoucherPopupVisible).toBeCalledWith(false);
        waitFor(() => {
            expect(scrollToElement).toBeCalled();
        });
    });

    it('should render cancel button when Voucher processed', () => {
        mockStores.redeemVoucherStore.isVoucherCodeProcessing = true;
        render(<ValidatedVoucherPopup {...mockProps} />);
        expect(screen.queryByTestId('cancel-btn')).not.toBeInTheDocument();
    });

    it('should render cancel button when Voucher processed', () => {
        mockStores.redeemVoucherStore.isVoucherCodeProcessing = false;
        render(<ValidatedVoucherPopup {...mockProps} />);
        expect(screen.queryByTestId('cancel-btn')).toBeInTheDocument();
    });

    it('should render the TotalCredit field', () => {
        render(<ValidatedVoucherPopup {...mockProps} />);
        expect(screen.getByText(mockProps.fields.TotalCredit.value)).toBeInTheDocument();
    });
});
