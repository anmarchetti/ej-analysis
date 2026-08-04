import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { Tokens } from 'code/tokens';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import * as discountUtils from 'frontend/utils/discount.utils';
import * as tokenizerUtils from 'frontend/utils/tokenizer';

import PromotionBanner from './PromotionBanner';

expect.extend(toHaveNoViolations);

const mockRichTextWithLinksComponent = jest.fn();

const createProps = () => ({
    promo: {
        icon: 'promo-icon.jpg',
        bannerTitle: 'Summer Sale Now On',
        minimumSpendText: '£100 off holidays over £800',
        minimumSpendValue: 800,
        promotionCodeTiers: [
            {
                discountAmountPerBooking: 100,
                percentageDiscountPerBooking: 0,
                minimumSpend: 800,
                minimumSpendPerPerson: null,
            },
        ],
        promoCode: 'SUMMERSALE',
        date: 'Travel between 01/07/22 - 31/08/22',
        tandCs: 'T&C Apply',
        showTaxesNote: false,
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/JSSResponsiveImage', () => () => <div data-tid='icon' />);

jest.mock('frontend/hooks/usePriceLabels', () =>
    jest.fn(() => ({
        labelBeforePrice: '',
        labelAfterPrice: ' pp',
    })),
);

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, ...props }) => {
        mockRichTextWithLinksComponent(props);

        return <div data-tid='rich-text-with-links'>{field.value}</div>;
    },
}));

let mockProps;
let mockStores;

describe('<PromotionBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: { isEditMode: true },
            queryParamStore: { buildRedirectUrlQuery: jest.fn() },
            userStore: { onLogout: jest.fn() },
            marketStore: {
                currency: 'GBP',
                formatMoney: jest.fn().mockImplementation(value => `£${value}`),
            },
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<PromotionBanner {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });

    it('should NOT render PromotionBanner when promo is empty', () => {
        delete mockProps.promo;
        const { container } = render(<PromotionBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render PromoBanner', () => {
        render(<PromotionBanner {...mockProps} />);

        expect(screen.queryByTestId('promotion-banner-title')).toBeInTheDocument();
        expect(screen.getByTestId('promotion-banner-title')).toHaveTextContent('Summer Sale Now On');
        expect(screen.queryByTestId('promotion-banner-discounts')).toBeInTheDocument();
        expect(screen.queryByTestId('promotion-banner-promocode')).toBeInTheDocument();
        expect(screen.getByTestId('promotion-banner-promocode')).toHaveTextContent('SUMMERSALE');
        expect(screen.queryByTestId('promotion-banner-date')).toBeInTheDocument();
        expect(screen.getByTestId('promotion-banner-date')).toHaveTextContent('Travel between 01/07/22 - 31/08/22');
        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('T&C Apply');
        expect(mockRichTextWithLinksComponent).toHaveBeenCalledWith({
            className: 'link',
            dataId: 'promotion-banner-link',
        });
    });

    it('should NOT render the PromotionBanner when all conditions are false', () => {
        mockProps.promo = {
            icon: '',
            bannerTitle: '',
            minimumSpendText: '',
            minimumSpendValue: 0,
            promotionCodeTiers: null,
            promoCode: '',
            date: '',
            tandCs: '',
        };

        render(<PromotionBanner {...mockProps} />);

        expect(screen.queryByTestId('promotion-banner')).not.toBeInTheDocument();
    });

    it('should render PromotionBanner when only minimumSpendText is provided (without promotionCodeTiers)', () => {
        mockProps.promo = {
            icon: '',
            bannerTitle: '',
            minimumSpendText: 'Save £50 on orders over £200',
            minimumSpendValue: 0,
            promotionCodeTiers: null,
            promoCode: '',
            date: '',
            tandCs: '',
        };

        render(<PromotionBanner {...mockProps} />);

        expect(screen.queryByTestId('promotion-banner')).toBeInTheDocument();
        expect(screen.queryByTestId('promotion-banner-discounts')).not.toBeInTheDocument();
    });

    it('should render PromotionBanner when minimumSpendValue is 0 but other conditions are met', () => {
        mockProps.promo = {
            icon: 'test-icon.jpg',
            bannerTitle: 'Test Banner',
            minimumSpendText: '',
            minimumSpendValue: 0,
            promotionCodeTiers: null,
            promoCode: '',
            date: '',
            tandCs: '',
        };

        render(<PromotionBanner {...mockProps} />);

        expect(screen.queryByTestId('promotion-banner')).toBeInTheDocument();
        expect(screen.queryByTestId('promotion-banner-title')).toBeInTheDocument();
        expect(screen.getByTestId('promotion-banner-title')).toHaveTextContent('Test Banner');
    });

    it('should render PromotionBanner when promotionCodeTiers is null but other conditions are met', () => {
        mockProps.promo = {
            icon: '',
            bannerTitle: '',
            minimumSpendText: 'Save £50 on orders over £200',
            minimumSpendValue: 0,
            promotionCodeTiers: null,
            promoCode: '',
            date: '',
            tandCs: '',
        };

        render(<PromotionBanner {...mockProps} />);

        expect(screen.queryByTestId('promotion-banner')).toBeInTheDocument();
        expect(screen.queryByTestId('promotion-banner-discounts')).not.toBeInTheDocument();
    });

    describe('minimumSpendText tokenization', () => {
        it('should tokenize minimumSpendText with both discount and minimumSpend tokens', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');

            mockTokenizerReplaceTokens.mockReturnValue('Save £50 on orders over £200');
            mockGetDiscount.mockReturnValue('£50');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Save {discount} on orders over {minimumSpend}',
                minimumSpendValue: 200,
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 50,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 200,
                        minimumSpendPerPerson: null,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockGetDiscount).toHaveBeenCalledWith(
                mockProps.promo.promotionCodeTiers[0],
                'GBP',
                mockStores.marketStore.formatMoney,
            );

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith('Save {discount} on orders over {minimumSpend}', {
                [Tokens.Discount]: '£50',
                [Tokens.MinimumSpend]: '£200',
            });
        });

        it('should tokenize minimumSpendText with discountPerPerson when discountAmountPerPerson exists', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens.mockReturnValue('Save £75 pp on orders over £300');
            mockGetDiscountPerPerson.mockReturnValue('£75 pp');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Save {discountPerPerson} on orders over {minimumSpend}',
                minimumSpendValue: 300,
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 0,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 300,
                        minimumSpendPerPerson: null,
                        discountAmountPerPerson: 75,
                        discountPercentagePerPerson: 0,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                mockProps.promo.promotionCodeTiers[0],
                'GBP',
                mockStores.marketStore.formatMoney,
                '',
                ' pp',
            );

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
                'Save {discountPerPerson} on orders over {minimumSpend}',
                {
                    [Tokens.DiscountPerPerson]: '£75 pp',
                    [Tokens.MinimumSpend]: '£300',
                },
            );
        });

        it('should tokenize minimumSpendText with both discount and discountPerPerson tokens', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens.mockReturnValue('Total £100 off, save £50 pp per person');
            mockGetDiscount.mockReturnValue('£100');
            mockGetDiscountPerPerson.mockReturnValue('£50 pp');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Total {discount} off, save {discountPerPerson} per person',
                minimumSpendValue: 500,
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 100,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 500,
                        minimumSpendPerPerson: null,
                        discountAmountPerPerson: 50,
                        discountPercentagePerPerson: 0,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockGetDiscount).toHaveBeenCalledWith(
                mockProps.promo.promotionCodeTiers[0],
                'GBP',
                mockStores.marketStore.formatMoney,
            );
            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                mockProps.promo.promotionCodeTiers[0],
                'GBP',
                mockStores.marketStore.formatMoney,
                '',
                ' pp',
            );

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
                'Total {discount} off, save {discountPerPerson} per person',
                {
                    [Tokens.Discount]: '£100',
                    [Tokens.DiscountPerPerson]: '£50 pp',
                    [Tokens.MinimumSpend]: '£500',
                },
            );
        });

        it('should call getDiscountPerPerson but NOT add discountPerPerson token when no discountAmountPerPerson or discountPercentagePerPerson', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens.mockReturnValue('Save £50 on orders over £200');
            mockGetDiscount.mockReturnValue('£50');
            mockGetDiscountPerPerson.mockReturnValue('');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Save {discount} on orders over {minimumSpend}',
                minimumSpendValue: 200,
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 50,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 200,
                        minimumSpendPerPerson: null,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockGetDiscount).toHaveBeenCalled();
            expect(mockGetDiscountPerPerson).toHaveBeenCalled();
            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith('Save {discount} on orders over {minimumSpend}', {
                [Tokens.Discount]: '£50',
                [Tokens.MinimumSpend]: '£200',
            });
        });

        it('should tokenize minimumSpendText with percentage discount', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens.mockReturnValue('Save 15% on orders over £300');
            mockGetDiscount.mockReturnValue('15%');
            mockGetDiscountPerPerson.mockReturnValue('');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Save {discount} on orders over {minimumSpend}',
                minimumSpendValue: 300,
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 0,
                        percentageDiscountPerBooking: 0.15,
                        minimumSpend: 300,
                        minimumSpendPerPerson: null,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith('Save on orders over {minimumSpend}', {
                [Tokens.Discount]: '15%',
                [Tokens.MinimumSpend]: '£300',
            });
        });

        it('should tokenize minimumSpendText with only minimumSpend token when no discount', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens.mockReturnValue('Minimum order from £400');
            mockGetDiscount.mockReturnValue('');
            mockGetDiscountPerPerson.mockReturnValue('');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Minimum order from {minimumSpend}',
                minimumSpendValue: 400,
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 0,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 400,
                        minimumSpendPerPerson: null,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith('Minimum order from {minimumSpend}', {
                [Tokens.MinimumSpend]: '£400',
            });
        });

        it('should not tokenize minimumSpendText when no tokens are available', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens.mockReturnValue('Regular offer');
            mockGetDiscount.mockReturnValue('');
            mockGetDiscountPerPerson.mockReturnValue('');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Regular offer',
                minimumSpendValue: 0,
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 0,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 0,
                        minimumSpendPerPerson: null,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith('Regular offer', {});
        });

        it('should remove minimumSpend and minimumSpendPerPerson tokens when both values are 0', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens.mockReturnValue('Save £50');
            mockGetDiscount.mockReturnValue('£50');
            mockGetDiscountPerPerson.mockReturnValue('');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Save {discount} on orders over {minimumSpend} per {minimumSpendPerPerson}',
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 50,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 0,
                        minimumSpendPerPerson: 0,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith('Save {discount} on orders over per', {
                [Tokens.Discount]: '£50',
            });
        });

        it('should keep minimumSpend token when minimumSpendPerPerson is 0 but minimumSpend has value', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens.mockReturnValue('Save £50 on orders over £200');
            mockGetDiscount.mockReturnValue('£50');
            mockGetDiscountPerPerson.mockReturnValue('');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Save {discount} on orders over {minimumSpend} per {minimumSpendPerPerson}',
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 50,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 200,
                        minimumSpendPerPerson: 0,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
                'Save {discount} on orders over {minimumSpend} per',
                {
                    [Tokens.Discount]: '£50',
                    [Tokens.MinimumSpend]: '£200',
                },
            );
        });

        it('should keep minimumSpendPerPerson token when minimumSpend is 0 but minimumSpendPerPerson has value', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens.mockReturnValue('Save £50 per £100');
            mockGetDiscount.mockReturnValue('£50');
            mockGetDiscountPerPerson.mockReturnValue('');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Save {discount} on orders over {minimumSpend} per {minimumSpendPerPerson}',
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 50,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 0,
                        minimumSpendPerPerson: 100,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith(
                'Save {discount} on orders over per {minimumSpendPerPerson}',
                {
                    [Tokens.Discount]: '£50',
                    [Tokens.MinimumSpendPerPerson]: '£100',
                },
            );
        });

        it('should handle multiple promotion tiers', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens
                .mockReturnValueOnce('Save £50 on orders over £200')
                .mockReturnValueOnce('Save £100 on orders over £300');
            mockGetDiscount.mockReturnValueOnce('£50').mockReturnValueOnce('£100');
            mockGetDiscountPerPerson.mockReturnValue('');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Save {discount} on orders over {minimumSpend}',
                minimumSpendValue: 200,
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 50,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 200,
                        minimumSpendPerPerson: null,
                    },
                    {
                        discountAmountPerBooking: 100,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 300,
                        minimumSpendPerPerson: null,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            // Should be called twice for two tiers
            expect(mockTokenizerReplaceTokens).toHaveBeenCalledTimes(2);
        });

        it('should remove discount token when discountAmountPerBooking is 0', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens.mockReturnValue('Save on orders over £200');
            mockGetDiscount.mockReturnValue('');
            mockGetDiscountPerPerson.mockReturnValue('');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Save {discount} on orders over {minimumSpend}',
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 0,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 200,
                        minimumSpendPerPerson: null,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith('Save on orders over {minimumSpend}', {
                [Tokens.MinimumSpend]: '£200',
            });
        });

        it('should keep discount token when discountAmountPerBooking has value', () => {
            const mockTokenizerReplaceTokens = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceTokens');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceTokens.mockReturnValue('Save £50 on orders over £200');
            mockGetDiscount.mockReturnValue('£50');
            mockGetDiscountPerPerson.mockReturnValue('');

            mockProps.promo = {
                ...mockProps.promo,
                minimumSpendText: 'Save {discount} on orders over {minimumSpend}',
                promotionCodeTiers: [
                    {
                        discountAmountPerBooking: 50,
                        percentageDiscountPerBooking: 0,
                        minimumSpend: 200,
                        minimumSpendPerPerson: null,
                    },
                ],
            };

            render(<PromotionBanner {...mockProps} />);

            expect(mockTokenizerReplaceTokens).toHaveBeenCalledWith('Save {discount} on orders over {minimumSpend}', {
                [Tokens.Discount]: '£50',
                [Tokens.MinimumSpend]: '£200',
            });
        });
    });

    describe('Should NOT render fields', () => {
        it('should NOT render bannerTitle when it is empty', () => {
            mockProps.promo.bannerTitle = '';

            render(<PromotionBanner {...mockProps} />);

            expect(screen.queryByTestId('promotion-banner-title')).not.toBeInTheDocument();
        });

        it('should NOT render discounts when promotionCodeTiers is empty', () => {
            mockProps.promo.promotionCodeTiers = [];

            render(<PromotionBanner {...mockProps} />);

            expect(screen.queryByTestId('promotion-banner-discounts')).not.toBeInTheDocument();
        });

        it('should NOT render promocode when it is empty', () => {
            mockProps.promo.promoCode = '';

            render(<PromotionBanner {...mockProps} />);

            expect(screen.queryByTestId('promotion-banner-promocode')).not.toBeInTheDocument();
        });

        it('should NOT render date when it is empty', () => {
            mockProps.promo.date = '';

            render(<PromotionBanner {...mockProps} />);

            expect(screen.queryByTestId('promotion-banner-date')).not.toBeInTheDocument();
        });

        it('should NOT render tandCs when it is empty', () => {
            mockProps.promo.tandCs = '';

            render(<PromotionBanner {...mockProps} />);

            expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
        });
    });

    describe('showTaxesNote', () => {
        it('should render taxes note and call getPhrase with TouristTaxLabelsPromoBannerTaxNote when showTaxesNote is true', () => {
            mockProps.promo.showTaxesNote = true;

            render(<PromotionBanner {...mockProps} />);

            expect(screen.getByText('TouristTax.Labels.PromoBannerTaxNote')).toBeInTheDocument();
            expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith('TouristTax.Labels.PromoBannerTaxNote');
        });

        it('should NOT render taxes note and NOT call getPhrase with TouristTaxLabelsPromoBannerTaxNote when showTaxesNote is false', () => {
            mockProps.promo.showTaxesNote = false;

            render(<PromotionBanner {...mockProps} />);

            expect(screen.queryByText('TouristTax.Labels.PromoBannerTaxNote')).not.toBeInTheDocument();
            expect(mockStores.layoutStore.getPhrase).not.toHaveBeenCalledWith('TouristTax.Labels.PromoBannerTaxNote');
        });
    });

    describe('Separators', () => {
        it('should render the divider hr element when date is provided', () => {
            const { container } = render(<PromotionBanner {...mockProps} />);

            expect(container.querySelector('.divider')).toBeInTheDocument();
        });

        it('should NOT render the divider hr element when date, tandCs, and showTaxesNote are all falsy', () => {
            mockProps.promo.date = '';
            mockProps.promo.tandCs = '';
            mockProps.promo.showTaxesNote = false;

            const { container } = render(<PromotionBanner {...mockProps} />);

            expect(container.querySelector('.divider')).not.toBeInTheDocument();
        });

        it('should render the divider hr element when only showTaxesNote is true', () => {
            mockProps.promo.date = '';
            mockProps.promo.tandCs = '';
            mockProps.promo.showTaxesNote = true;

            const { container } = render(<PromotionBanner {...mockProps} />);

            expect(container.querySelector('.divider')).toBeInTheDocument();
        });

        it('should apply lineSeparator class to promocode when promotionCodeTiers is non-empty', () => {
            render(<PromotionBanner {...mockProps} />);

            expect(screen.getByTestId('promotion-banner-promocode')).toHaveClass('lineSeparator');
        });

        it('should NOT apply lineSeparator class to promocode when promotionCodeTiers is empty', () => {
            mockProps.promo.promotionCodeTiers = [];

            render(<PromotionBanner {...mockProps} />);

            expect(screen.getByTestId('promotion-banner-promocode')).not.toHaveClass('lineSeparator');
        });

        it('should NOT apply lineSeparator class to promocode when promotionCodeTiers is null', () => {
            mockProps.promo.promotionCodeTiers = null;

            render(<PromotionBanner {...mockProps} />);

            expect(screen.getByTestId('promotion-banner-promocode')).not.toHaveClass('lineSeparator');
        });
    });
});
