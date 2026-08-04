import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { Tokens } from 'code/tokens';
import { createMockStores } from 'frontend/__mocks__';
import creditManagementService from 'frontend/services/creditManagement.service';
import * as discountUtils from 'frontend/utils/discount.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import * as tokenizerUtils from 'frontend/utils/tokenizer';
import { VoucherTypes } from 'models/enum/VoucherTypes';

import PromocodeBanner, { IPromocodeBannerProps } from './PromocodeBanner';

jest.mock('frontend/services/creditManagement.service', () => ({
    validateVoucherCode: jest.fn().mockReturnValue(Promise.resolve({ voucherType: 'GIFT_VOUCHER' })),
}));

jest.mock('frontend/hooks/usePriceLabels', () =>
    jest.fn(() => ({
        labelBeforePrice: '',
        labelAfterPrice: ' pp',
    })),
);

const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');
const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');

const createProps = (): IPromocodeBannerProps => ({
    buttonLabel: mockSitecoreField('Apply Code'),
    text: mockSitecoreField('Add your promo code here to save {discount} on your holiday'),
});

const createStores = () =>
    createMockStores({
        layoutStore: { isExtrasPage: true },
        bookingStore: {
            merchandisedPromotion: {
                displayOnExtrasPage: true,
                title: 'ONEADULT',
                date: '27/07/1993',
                discountAmountPerBooking: 100,
                percentageDiscountPerBooking: 0.2,
            },
            promoCode: {
                value: '',
                isPromocodeApplying: false,
                clearPromocodeError: jest.fn(),
                setIsPromocodeApplying: jest.fn(),
                onPromocodeErrorCallback: jest.fn(),
            },
            onApplyPromoCode: jest.fn(),
        },
        redeemVoucherStore: {
            cleanupRedeemStore: jest.fn(),
            initiateVoucherExtrasFlow: jest.fn(),
        },
        marketStore: {
            currency: CurrencyCode.GBP,
            formatMoney: jest.fn(amount => `£${amount}`),
        },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PromocodeBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render when it is not the extras page', () => {
        mockStores.layoutStore.isExtrasPage = false;

        const { container } = render(<PromocodeBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when text field is missing', () => {
        mockProps.text = undefined;

        const { container } = render(<PromocodeBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when text field value is empty', () => {
        mockProps.text = mockSitecoreField('');

        const { container } = render(<PromocodeBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when buttonLabel field is missing', () => {
        mockProps.buttonLabel = undefined;

        const { container } = render(<PromocodeBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when buttonLabel field value is empty', () => {
        mockProps.buttonLabel = mockSitecoreField('');

        const { container } = render(<PromocodeBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when merchandisedPromotion title is missing', () => {
        mockStores.bookingStore.merchandisedPromotion = {};

        const { container } = render(<PromocodeBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when merchandisedPromotion is undefined', () => {
        delete mockStores.bookingStore.merchandisedPromotion;

        const { container } = render(<PromocodeBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when displayOnExtrasPage is false', () => {
        mockStores.bookingStore.merchandisedPromotion.displayOnExtrasPage = false;

        const { container } = render(<PromocodeBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when promo code is already applied and NOT applying', () => {
        mockStores.bookingStore.promoCode.value = 'ONEADULT';
        mockStores.bookingStore.promoCode.isPromocodeApplying = false;

        const { container } = render(<PromocodeBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render when promo code is applied but currently applying', () => {
        mockStores.bookingStore.promoCode.value = 'ONEADULT';
        mockStores.bookingStore.promoCode.isPromocodeApplying = true;

        const { container } = render(<PromocodeBanner {...mockProps} />);

        expect(container).not.toBeEmptyDOMElement();
    });

    it('should render text and button when all conditions are met', () => {
        mockGetDiscountPerPerson.mockReturnValue('£100');

        render(<PromocodeBanner {...mockProps} />);

        expect(screen.getByText('Add your promo code here to save £100 on your holiday')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Apply Code' })).toBeInTheDocument();
        expect(screen.getByText('Apply Code')).toBeInTheDocument();
        expect(screen.getByText('Add your promo code here to save £100 on your holiday')).toHaveClass('text');
        expect(screen.getByRole('button')).toHaveClass('button');
    });

    describe('Discount value calculation', () => {
        it('should use discountPerPerson when available', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');

            mockGetDiscountPerPerson.mockReturnValue('£95 pp');
            mockGetDiscount.mockReturnValue('£100');
            mockTokenizerReplaceTokens.mockReturnValue('Add your promo code here to save £95 pp on your holiday');

            mockStores.bookingStore.merchandisedPromotion = {
                title: 'ONEADULT',
                discountAmountPerPerson: 95,
                discountAmountPerBooking: 100,
                displayOnExtrasPage: true,
            };

            render(<PromocodeBanner {...mockProps} />);

            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                mockStores.bookingStore.merchandisedPromotion,
                CurrencyCode.GBP,
                mockStores.marketStore.formatMoney,
                '',
                ' pp',
            );
            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
                'Add your promo code here to save {discount} on your holiday',
                {
                    [Tokens.Discount]: '£95 pp',
                    [Tokens.DiscountPerPerson]: '£95 pp',
                },
            );

            mockTokenizerReplaceTokens.mockRestore();
        });

        it('should fall back to discount when discountPerPerson returns empty', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');

            mockGetDiscountPerPerson.mockReturnValue('');
            mockGetDiscount.mockReturnValue('£100');
            mockTokenizerReplaceTokens.mockReturnValue('Add your promo code here to save £100 on your holiday');

            render(<PromocodeBanner {...mockProps} />);

            expect(mockGetDiscount).toHaveBeenCalledWith(
                mockStores.bookingStore.merchandisedPromotion,
                CurrencyCode.GBP,
                mockStores.marketStore.formatMoney,
            );
            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
                'Add your promo code here to save {discount} on your holiday',
                {
                    [Tokens.Discount]: '£100',
                    [Tokens.DiscountPerPerson]: '£100',
                },
            );

            mockTokenizerReplaceTokens.mockRestore();
        });

        it('should handle empty discount values gracefully', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');

            mockGetDiscountPerPerson.mockReturnValue('');
            mockGetDiscount.mockReturnValue('');
            mockTokenizerReplaceTokens.mockReturnValue('Add your promo code here to save  on your holiday');

            render(<PromocodeBanner {...mockProps} />);

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
                'Add your promo code here to save {discount} on your holiday',
                {
                    [Tokens.Discount]: '',
                    [Tokens.DiscountPerPerson]: '',
                },
            );

            mockTokenizerReplaceTokens.mockRestore();
        });

        it('should handle percentage discounts', () => {
            mockGetDiscountPerPerson.mockReturnValue('15%');

            mockStores.bookingStore.merchandisedPromotion = {
                title: 'ONEADULT',
                percentageDiscountPerBooking: 0.15,
                displayOnExtrasPage: true,
            };

            render(<PromocodeBanner {...mockProps} />);

            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                mockStores.bookingStore.merchandisedPromotion,
                CurrencyCode.GBP,
                mockStores.marketStore.formatMoney,
                '',
                ' pp',
            );
        });
    });

    it('should handle gift voucher application successfully', async () => {
        mockGetDiscountPerPerson.mockReturnValue('£100');

        creditManagementService.validateVoucherCode = jest
            .fn()
            .mockReturnValueOnce(Promise.resolve({ voucherType: VoucherTypes.GiftVoucher }));

        render(<PromocodeBanner {...mockProps} />);

        const button = screen.getByRole('button', { name: 'Apply Code' });
        await userEvent.click(button);

        expect(mockStores.bookingStore.promoCode.setIsPromocodeApplying).toHaveBeenCalledWith(true);
        expect(creditManagementService.validateVoucherCode).toHaveBeenCalledWith('ONEADULT');
        expect(mockStores.bookingStore.promoCode.clearPromocodeError).toHaveBeenCalled();
        expect(mockStores.redeemVoucherStore.initiateVoucherExtrasFlow).toHaveBeenCalledWith({
            voucherType: VoucherTypes.GiftVoucher,
        });
        expect(mockStores.bookingStore.promoCode.setIsPromocodeApplying).toHaveBeenCalledWith(false);
    });

    it('should handle promo voucher application successfully', async () => {
        mockGetDiscountPerPerson.mockReturnValue('£100');
        creditManagementService.validateVoucherCode = jest
            .fn()
            .mockReturnValueOnce(Promise.resolve({ voucherType: VoucherTypes.PromoVoucher }));

        render(<PromocodeBanner {...mockProps} />);

        const button = screen.getByRole('button', { name: 'Apply Code' });
        await userEvent.click(button);

        expect(mockStores.bookingStore.promoCode.setIsPromocodeApplying).toHaveBeenCalledWith(true);
        expect(creditManagementService.validateVoucherCode).toHaveBeenCalledWith('ONEADULT');
        expect(mockStores.bookingStore.onApplyPromoCode).toHaveBeenCalledWith(
            'ONEADULT',
            expect.any(Function),
            mockStores.bookingStore.promoCode.onPromocodeErrorCallback,
        );
    });

    it('should handle validation errors properly', async () => {
        const error = { errorCode: 'INVALID_CODE' };
        jest.mocked(creditManagementService.validateVoucherCode).mockRejectedValue(error);

        render(<PromocodeBanner {...mockProps} />);

        const button = screen.getByRole('button', { name: 'Apply Code' });
        await userEvent.click(button);

        expect(mockStores.bookingStore.promoCode.onPromocodeErrorCallback).toHaveBeenCalledWith(error);
        expect(mockStores.redeemVoucherStore.cleanupRedeemStore).toHaveBeenCalled();
        expect(mockStores.bookingStore.promoCode.setIsPromocodeApplying).toHaveBeenCalledWith(false);
    });

    it('should prevent application when already applying', async () => {
        mockStores.bookingStore.promoCode.isPromocodeApplying = true;

        render(<PromocodeBanner {...mockProps} />);

        const button = screen.getByRole('button', { name: 'Apply Code' });
        await userEvent.click(button);

        expect(creditManagementService.validateVoucherCode).not.toHaveBeenCalled();
        expect(mockStores.bookingStore.promoCode.setIsPromocodeApplying).not.toHaveBeenCalled();
    });

    it('should prevent application when merchandisedPromotion title is missing', async () => {
        mockStores.bookingStore.merchandisedPromotion.title = '';

        render(<PromocodeBanner {...mockProps} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should have correct button attributes', () => {
        mockGetDiscountPerPerson.mockReturnValue('£100');

        render(<PromocodeBanner {...mockProps} />);

        const button = screen.getByRole('button', { name: 'Apply Code' });

        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('aria-label', 'Apply Code');
    });

    it('should handle both discount and discountPerPerson tokens', () => {
        const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');

        mockGetDiscountPerPerson.mockReturnValue('£95 pp');
        mockProps.text = mockSitecoreField('Save {discount} or {discountPerPerson} on your booking');

        render(<PromocodeBanner {...mockProps} />);

        expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
            'Save {discount} or {discountPerPerson} on your booking',
            {
                [Tokens.Discount]: '£95 pp',
                [Tokens.DiscountPerPerson]: '£95 pp',
            },
        );

        mockTokenizerReplaceTokens.mockRestore();
    });
});
