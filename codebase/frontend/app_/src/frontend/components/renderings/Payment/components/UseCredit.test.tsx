import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IUseCreditProps, UseCredit } from './UseCredit';

const createMockProps = (): IUseCreditProps => ({
    fields: {
        UseCreditTitle: mockSitecoreField('UseCreditTitle'),
        UseCreditDescription: mockSitecoreField('UseCreditDescription'),
        UseCreditFormTitle: mockSitecoreField('UseCreditFormTitle'),
        IconCreditInfoBlock: mockSitecoreField(mockSitecoreImageField('IconCreditInfoBlock')),
        IsUseCreditShown: mockSitecoreField(false),
        TextCreditInfoBlock: mockSitecoreField('TextCreditInfoBlock'),
        UseCreditLogInText: mockSitecoreField('UseCreditLogInText'),
    },
});

let mockStores;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockCheckboxProps = jest.fn();
jest.mock('frontend/components/common/Checkbox', () => ({
    __esModule: true,
    default: props => {
        mockCheckboxProps(props);

        return <div data-tid='checkbox' />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button data-tid='button' onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

const mockAmountForPayProps = jest.fn();
jest.mock('frontend/components/common/AmountForPay', () => ({
    __esModule: true,
    default: props => {
        mockAmountForPayProps(props);

        return <div data-tid='amount-for-pay' />;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => <div data-tid={props['data-tid']} />,
}));

describe('<UseCredit />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            payStore: {
                userCreditAmount: 300,
                totalCreditAmount: 600,
                usedCredit: 100,
                isCreditUsed: true,
                isActive: false,
                useCredit: jest.fn(),
                toggleUseCredit: jest.fn(),
                editUseCredit: jest.fn(),
                hasCredit: true,
                currency: CurrencyCode.GBP,
                userCreditError: false,
            },
            layoutStore: {
                isPayBalancePage: false,
            },
        });
    });

    it('Should standard render', () => {
        render(<UseCredit {...mockProps} />);

        expect(screen.getByTestId('use-credit-header')).toBeInTheDocument();

        expect(screen.getByTestId('checkbox')).toBeInTheDocument();
        expect(mockCheckboxProps).toHaveBeenCalledWith({
            label: mockProps.fields.UseCreditTitle.value,
            checked: mockStores.payStore.isCreditUsed,
            onChange: mockStores.payStore.toggleUseCredit,
            disabled: mockStores.payStore.isDisabled,
            medium: true,
            tick: true,
        });

        expect(screen.getByTestId('use-credit-manage')).toBeInTheDocument();
        expect(screen.getByTestId('use-credit-amount').textContent).toBe(`£${mockStores.payStore.usedCredit}`);

        expect(screen.getByRole('button', { name: SitecoreDictionary.PaymentButtonsEdit })).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                onClick: expect.any(Function),
                disabled: mockProps.isDisabled,
                isText: true,
            }),
        );
        expect(screen.queryByTestId('credit-expire-banner-placeholder')).not.toBeInTheDocument();
    });

    it('should render placeholder for cedit expire banner when isPayBalancePage is true', () => {
        mockStores.payStore.isCreditUsed = false;
        mockStores.layoutStore.isPayBalancePage = true;

        render(<UseCredit {...mockProps} />);

        expect(screen.getByTestId('credit-expire-banner-placeholder')).toBeInTheDocument();
    });

    it('Should render correctly when isCreditUsed is false', () => {
        mockStores.payStore.isCreditUsed = false;

        render(<UseCredit {...mockProps} />);

        expect(screen.getByTestId('checkbox')).toBeInTheDocument();
        expect(mockCheckboxProps).toHaveBeenCalledWith({
            label: mockProps.fields.UseCreditTitle.value,
            checked: mockStores.payStore.isCreditUsed,
            onChange: mockStores.payStore.toggleUseCredit,
            disabled: mockProps.isDisabled,
            medium: true,
            tick: true,
        });

        expect(screen.queryByTestId('use-credit-manage')).not.toBeInTheDocument();

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            tag: 'div',
            className: 'use-credit__about',
            field: mockProps.fields.UseCreditDescription,
        });
    });

    it('Should render correctly when isActive is true', () => {
        mockStores.payStore.isActive = true;
        render(<UseCredit {...mockProps} />);

        expect(screen.getByTestId('checkbox')).toBeInTheDocument();
        expect(mockCheckboxProps).toHaveBeenCalledWith(expect.objectContaining({ checked: true }));

        expect(screen.getByTestId('amount-for-pay')).toBeInTheDocument();
        expect(mockAmountForPayProps).toHaveBeenCalledWith({
            fullAmount: mockStores.payStore.totalCreditAmount,
            currency: mockStores.payStore.currency,
            residualBalance: 0,
            title: mockProps.fields.UseCreditFormTitle.value,
            hideTotalLabel: true,
            isCredit: true,
            onAmountChange: expect.any(Function),
        });

        expect(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsApply })).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                onClick: expect.any(Function),
                disabled: true,
                isMedium: true,
            }),
        );
    });

    it('Should call editUseCredit on edit button click', async () => {
        mockStores.payStore.isCreditUsed = true;

        render(<UseCredit {...mockProps} />);

        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.PaymentButtonsEdit }));

        expect(mockStores.payStore.editUseCredit).toHaveBeenCalled();
    });

    it('Should call useCredit on apply button click', async () => {
        mockStores.payStore.isActive = true;

        render(<UseCredit {...mockProps} />);

        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsApply }));

        expect(mockStores.payStore.useCredit).toHaveBeenCalled();
    });

    it('Should render correctly when isVoucherRedeemedBookingFlow', () => {
        const mockGetSessionStorage = jest.fn().mockReturnValue(true);

        Object.defineProperty(window, 'sessionStorage', {
            value: {
                getItem: mockGetSessionStorage,
            },
            writable: true,
        });

        render(<UseCredit {...mockProps} />);
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImageProps).toHaveBeenCalledWith({
            field: mockProps.fields.IconCreditInfoBlock,
            className: 'credit-info-block__icon',
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            tag: 'p',
            className: 'credit-info-block__text',
            field: mockProps.fields.TextCreditInfoBlock,
        });
    });

    it('Should render correctly when hasCredit is false but userCreditError is true', () => {
        mockStores.payStore.hasCredit = false;
        mockStores.payStore.userCreditError = true;

        render(<UseCredit {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.HolidayCreditTitlesHolidayCredit)).toBeInTheDocument();

        expect(screen.getByText(SitecoreDictionary.HolidayCreditTitlesHolidayCredit)).toBeInTheDocument();
    });

    it('Should render null when isCreditUsed is false and hasCredit is false', () => {
        mockStores.payStore.isCreditUsed = false;
        mockStores.payStore.hasCredit = false;

        const { container } = render(<UseCredit {...mockProps} />);

        expect(container.firstChild).toBeNull();
    });
});
