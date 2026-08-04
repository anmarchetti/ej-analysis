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
import ColorScheme from 'models/enum/banners/ColorScheme';
import { mockPromocodeInputFields } from 'frontend/components/renderings/PromocodeInput/__mocks__/promocodeInput.mocks';

import MerchandisedBanner, { IMerchandisedBannerProps } from './MerchandisedBanner';

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

const createProps = (): IMerchandisedBannerProps => ({
    fields: mockPromocodeInputFields(),
    className: 'bannerColumn',
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            merchandisedPromotion: {
                displayOnExtrasPage: true,
                title: 'oneadult',
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
            onErrorPromoCode: jest.fn(),
        },
        redeemVoucherStore: {
            initiateVoucherExtrasFlow: jest.fn(),
        },
        marketStore: {
            currency: CurrencyCode.CHF,
        },
        layoutStore: {
            getPhrase: jest.fn(key => key),
        },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<MerchandisedBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render MerchandisedBanner when merchandisedPromotion title undefined', () => {
        mockStores.bookingStore.merchandisedPromotion = {};

        const { container } = render(<MerchandisedBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render MerchandisedBanner when merchandisedPromotion undefined', () => {
        delete mockStores.bookingStore.merchandisedPromotion;

        const { container } = render(<MerchandisedBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render: title, description, button, promocode section', () => {
        mockGetDiscountPerPerson.mockReturnValue('');

        render(<MerchandisedBanner {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveClass('title');
        expect(screen.getByText('Add your promo code here to save £100 on your holiday')).toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.UseCodeText.value)).toHaveClass('description orangeTheme');
        expect(screen.getByText(mockStores.bookingStore.merchandisedPromotion.title)).toHaveClass(
            'promoCode orangeTheme',
        );
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
        expect(screen.getByText(mockProps.fields.ApplyCodeText.value)).toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.TermsAndConditions.value)).toBeInTheDocument();
    });

    it('should render title with percentage discount when discountAmountPerBooking undefined', () => {
        mockGetDiscountPerPerson.mockReturnValue('');

        delete mockStores.bookingStore.merchandisedPromotion.discountAmountPerBooking;

        render(<MerchandisedBanner {...mockProps} />);

        expect(screen.getByText('Add your promo code here to save 20% on your holiday')).toHaveClass('title');
    });

    it('should render title with empty discount when NO discount value in promotion', () => {
        mockGetDiscountPerPerson.mockReturnValue('');

        mockStores.bookingStore.merchandisedPromotion = {
            title: 'onetwo',
            displayOnExtrasPage: true,
        };

        render(<MerchandisedBanner {...mockProps} />);

        expect(screen.getByText('Add your promo code here to save on your holiday')).toBeInTheDocument();
    });

    it('should render title with discountPerPerson when discountAmountPerPerson exists', () => {
        const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');

        mockGetDiscountPerPerson.mockReturnValue('£95 pp');
        mockTokenizerReplaceTokens.mockReturnValue('Add your promo code here to save £95 pp on your holiday');

        mockStores.bookingStore.merchandisedPromotion = {
            title: 'TEST_PROMO_CODE',
            displayOnExtrasPage: true,
            discountAmountPerPerson: 95,
        };

        render(<MerchandisedBanner {...mockProps} />);

        expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
            mockStores.bookingStore.merchandisedPromotion,
            'CHF',
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
        expect(
            screen.getByRole('heading', { name: 'Add your promo code here to save £95 pp on your holiday' }),
        ).toBeInTheDocument();

        mockTokenizerReplaceTokens.mockRestore();
    });

    it('should render title with discountPerPerson when discountPercentagePerPerson exists', () => {
        const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');

        mockGetDiscountPerPerson.mockReturnValue('20% pp');
        mockTokenizerReplaceTokens.mockReturnValue('Add your promo code here to save 20% pp on your holiday');

        mockStores.bookingStore.merchandisedPromotion = {
            title: 'TEST_PROMO_CODE',
            displayOnExtrasPage: true,
            discountPercentagePerPerson: 0.2,
        };

        render(<MerchandisedBanner {...mockProps} />);

        expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
            mockStores.bookingStore.merchandisedPromotion,
            'CHF',
            mockStores.marketStore.formatMoney,
            '',
            ' pp',
        );
        expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
            'Add your promo code here to save {discount} on your holiday',
            {
                [Tokens.Discount]: '20% pp',
                [Tokens.DiscountPerPerson]: '20% pp',
            },
        );
        expect(
            screen.getByRole('heading', { name: 'Add your promo code here to save 20% pp on your holiday' }),
        ).toBeInTheDocument();

        mockTokenizerReplaceTokens.mockRestore();
    });

    it('should prioritize discountPerPerson over discount when both are present', () => {
        const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
        const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
        const mockGetDiscountPerPersonLocal = jest.spyOn(discountUtils, 'getDiscountPerPerson');

        mockGetDiscount.mockReturnValue('£100');
        mockGetDiscountPerPersonLocal.mockReturnValue('£95 pp');
        mockTokenizerReplaceTokens.mockReturnValue('Add your promo code here to save £95 pp on your holiday');

        mockStores.bookingStore.merchandisedPromotion = {
            title: 'TEST_PROMO_CODE',
            displayOnExtrasPage: true,
            discountAmountPerBooking: 100,
            discountAmountPerPerson: 95,
        };

        render(<MerchandisedBanner {...mockProps} />);

        expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
            'Add your promo code here to save {discount} on your holiday',
            {
                [Tokens.Discount]: '£95 pp',
                [Tokens.DiscountPerPerson]: '£95 pp',
            },
        );

        mockGetDiscount.mockRestore();
        mockGetDiscountPerPersonLocal.mockRestore();
        mockTokenizerReplaceTokens.mockRestore();
    });

    it('should use discount when discountPerPerson is not available', () => {
        const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
        const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');

        mockGetDiscount.mockReturnValue('£100');
        mockGetDiscountPerPerson.mockReturnValue('');
        mockTokenizerReplaceTokens.mockReturnValue('Add your promo code here to save £100 on your holiday');

        mockStores.bookingStore.merchandisedPromotion = {
            title: 'TEST_PROMO_CODE',
            displayOnExtrasPage: true,
            discountAmountPerBooking: 100,
        };

        render(<MerchandisedBanner {...mockProps} />);

        expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
            'Add your promo code here to save {discount} on your holiday',
            {
                [Tokens.Discount]: '£100',
                [Tokens.DiscountPerPerson]: '£100',
            },
        );

        mockGetDiscount.mockRestore();
        mockTokenizerReplaceTokens.mockRestore();
    });

    it('should handle messages with {discountPerPerson} token using the same prioritized value', () => {
        const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');

        mockGetDiscountPerPerson.mockReturnValue('£95 pp');
        mockTokenizerReplaceTokens.mockReturnValue(
            'Add your promo code here to save £95 pp per person on your holiday',
        );

        mockStores.bookingStore.merchandisedPromotion = {
            title: 'TEST_PROMO_CODE',
            displayOnExtrasPage: true,
            discountAmountPerPerson: 95,
        };

        mockProps.fields.OfferText.value =
            'Add your promo code here to save {discountPerPerson} per person on your holiday';

        render(<MerchandisedBanner {...mockProps} />);

        expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
            'Add your promo code here to save {discountPerPerson} per person on your holiday',
            {
                [Tokens.Discount]: '£95 pp',
                [Tokens.DiscountPerPerson]: '£95 pp',
            },
        );

        mockTokenizerReplaceTokens.mockRestore();
    });

    it('should render component with blue theme', () => {
        mockProps.fields.ColourScheme = mockSitecoreField(ColorScheme.Blue);

        render(<MerchandisedBanner {...mockProps} />);

        expect(screen.getByText(mockProps.fields.UseCodeText.value)).toHaveClass('description blueTheme');
        expect(screen.getByText(mockStores.bookingStore.merchandisedPromotion.title)).toHaveClass(
            'promoCode blueTheme',
        );
    });

    it('should call all proper functions on promocode apply', async () => {
        render(<MerchandisedBanner {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mockStores.bookingStore.promoCode.setIsPromocodeApplying).toHaveBeenCalledWith(true);
        expect(creditManagementService.validateVoucherCode).toHaveBeenCalledWith('oneadult');
        expect(mockStores.bookingStore.promoCode.clearPromocodeError).toHaveBeenCalled();
        expect(mockStores.redeemVoucherStore.initiateVoucherExtrasFlow).toHaveBeenCalledWith({
            voucherType: 'GIFT_VOUCHER',
        });
        expect(mockStores.bookingStore.promoCode.setIsPromocodeApplying).toHaveBeenCalledWith(false);
    });

    it('should call all proper functions on promocode apply', async () => {
        creditManagementService.validateVoucherCode = jest
            .fn()
            .mockReturnValueOnce(Promise.resolve({ voucherType: 'PROMO_VOUCHER' }));

        render(<MerchandisedBanner {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mockStores.bookingStore.promoCode.setIsPromocodeApplying).toHaveBeenCalledWith(true);
        expect(creditManagementService.validateVoucherCode).toHaveBeenCalledWith('oneadult');
        expect(mockStores.bookingStore.onApplyPromoCode).toHaveBeenCalledWith(
            'oneadult',
            expect.any(Function),
            mockStores.bookingStore.promoCode.onPromocodeErrorCallback,
        );
    });

    it('should render another version for applied promocode', async () => {
        mockGetDiscountPerPerson.mockReturnValue('');

        mockStores.bookingStore.promoCode = mockSitecoreField('oneadult');

        render(<MerchandisedBanner {...mockProps} />);

        expect(screen.getByText('You saved £100 on your holiday')).toHaveClass('title');
        expect(screen.queryByText(mockStores.bookingStore.merchandisedPromotion.title)).not.toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByText(mockProps.fields.ApplyCodeText.value)).not.toBeInTheDocument();
    });

    it('should skip applying when isPromocodeApplying is true', async () => {
        mockStores.bookingStore.promoCode.isPromocodeApplying = true;

        render(<MerchandisedBanner {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(screen.getByText(mockProps.fields.UseCodeText.value)).toHaveClass('description orangeTheme');
        expect(screen.getByText(mockStores.bookingStore.merchandisedPromotion.title)).toHaveClass(
            'promoCode orangeTheme',
        );
        expect(mockStores.bookingStore.promoCode.setIsPromocodeApplying).not.toHaveBeenCalled();
        expect(creditManagementService.validateVoucherCode).not.toHaveBeenCalled();
    });

    it('should call onError callback on error', async () => {
        creditManagementService.validateVoucherCode = jest.fn().mockRejectedValueOnce({ errorCode: 'test error' });

        render(<MerchandisedBanner {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(mockStores.bookingStore.onErrorPromoCode).toHaveBeenCalledWith({
            errorCode: 'test error',
        });
    });
});
