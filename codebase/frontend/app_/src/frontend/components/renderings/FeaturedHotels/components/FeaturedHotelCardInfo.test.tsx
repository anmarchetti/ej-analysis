import React from 'react';
import { render, screen } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import * as discountUtils from 'frontend/utils/discount.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import * as tokenizerUtils from 'frontend/utils/tokenizer';
import { ILivePrice } from 'models/data/ILivePrice';
import { ISinglePromotionInfo } from 'models/data/IPromocode';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FeaturedHotelCardInfo, { IFeaturedHotelCardInfoProps } from './FeaturedHotelCardInfo';

jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: jest.fn(),
}));

jest.mock('frontend/components/common/PromoBadge', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockPriceComponent(props);

        return <div data-tid='price-component' />;
    },
}));

jest.mock('frontend/utils/url.utils', () => ({
    ...jest.requireActual('frontend/utils/url.utils'),
    purifyUrl: jest.fn(url => url),
}));

jest.mock('frontend/components/renderings/LivePrice/LivePrice', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockPriceComponent(props);

        return <div data-tid='live-price' />;
    },
}));

const resetMocks = (): IFeaturedHotelCardInfoProps => ({
    hotel: {
        Url: 'Url',
        Image: mockSitecoreField(mockSitecoreImageField('src')),
        Name: 'Name',
        BookFrom: new Date().toDateString(),
        StarRating: '4',
        Region: 'Region',
        Country: 'Country',
        BookFromTitle: 'Title',
        BookFromText: 'Text',
        GiataCode: 'GiataCode',
        livePrice: null,
        isPriceValid: false,
    },
    hasLivePrice: true,
});

const mockPriceComponent = jest.fn();

let mocks;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/usePriceLabels', () =>
    jest.fn(() => ({
        labelBeforePrice: '',
        labelAfterPrice: ' pp',
    })),
);

describe('<FeaturedHotelCardInfo />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({
            queryParamStore: {
                buildSearchQueryByLivePrice: jest.fn(() => 'query'),
            },
            marketStore: {
                currency: 'GBP',
                formatMoney: jest.fn().mockImplementation(value => `£${value}`),
            },
            layoutStore: { isPriceHidden: false },
        });
    });

    it('should render hotel BookFromTitle', () => {
        render(<FeaturedHotelCardInfo {...mocks} />);

        expect(screen.getByTestId('title')).toBeInTheDocument();
    });

    it('should NOT render when hotel is NOT provided', () => {
        mocks.hotel = null;
        const { container } = render(<FeaturedHotelCardInfo {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render number of nights when live price duration is NOT provided and no BookFromTitle', () => {
        mocks.hotel.BookFromTitle = null;
        render(<FeaturedHotelCardInfo {...mocks} />);

        expect(screen.queryByTestId('number-of-nights')).not.toBeInTheDocument();
    });

    it('should NOT render number of nights when setting is disabled and prices are provided', () => {
        mocks.displayNumberOfNights = false;
        mocks.hotel.livePrice = { searchCriteria: { duration: 7 } };
        mocks.hotel.isPriceValid = true;
        mocks.hotel.BookFromTitle = null;

        render(<FeaturedHotelCardInfo {...mocks} />);

        expect(screen.queryByTestId('number-of-nights')).not.toBeInTheDocument();
    });

    it('should render plural number of nights when live price duration is provided', () => {
        mocks.displayNumberOfNights = true;
        mocks.hotel.livePrice = { searchCriteria: { duration: 7 } };
        mocks.hotel.isPriceValid = true;

        render(<FeaturedHotelCardInfo {...mocks} />);

        expect(screen.getByTestId('number-of-nights')).toHaveTextContent(
            SitecoreDictionary.GlobalsLabelsNumberOfNights,
        );
    });

    it('should render singular number of nights when live price duration is provided andd equals 1', () => {
        mocks.displayNumberOfNights = true;
        mocks.hotel.livePrice = { searchCriteria: { duration: 1 } };
        mocks.hotel.isPriceValid = true;

        render(<FeaturedHotelCardInfo {...mocks} />);

        expect(screen.getByTestId('number-of-nights')).toHaveTextContent(SitecoreDictionary.GlobalsLabelsNumberOfNight);
    });

    it('should render both nights and book from titles', () => {
        mocks.displayNumberOfNights = true;
        mocks.hotel.livePrice = { searchCriteria: { duration: 1 } };
        mocks.hotel.isPriceValid = true;
        mocks.hotel.BookFromTitle = 'BookFromTitle';

        render(<FeaturedHotelCardInfo {...mocks} />);

        expect(screen.getByTestId('number-of-nights')).toHaveTextContent(
            SitecoreDictionary.GlobalsLabelsNumberOfNight +
                SitecoreDictionary.GlobalsLabelsFrom.toLowerCase() +
                ' BookFromTitle',
        );
    });

    it('should render only book from title if no nights', () => {
        mocks.displayNumberOfNights = false;
        mocks.hotel.livePrice = { searchCriteria: { duration: 1 } };
        mocks.hotel.isPriceValid = true;
        mocks.hotel.BookFromTitle = 'BookFromTitle';

        render(<FeaturedHotelCardInfo {...mocks} />);

        expect(screen.getByTestId('number-of-nights')).toHaveTextContent('BookFromTitle');
    });

    it('should render promoBlock if it exists', () => {
        mocks.hotel.livePrice = {
            promotion: {
                cardDescription: 'Promo description',
            } as ISinglePromotionInfo,
        } as ILivePrice;

        render(<FeaturedHotelCardInfo {...mocks} />);

        expect(screen.queryByTestId('price-component')).toBeInTheDocument();
    });

    it('should render live prices and from label when hasLivePrice true', () => {
        mocks.hasLivePrice = true;
        mocks.hotel.isPriceValid = true;
        mocks.hotel.livePrice = {};

        render(<FeaturedHotelCardInfo {...mocks} />);

        expect(screen.queryByTestId('live-price')).toBeInTheDocument();
        expect(screen.queryByTestId('from-label')).toBeInTheDocument();
    });

    it('should NOT render prices when hasLivePrice false', () => {
        mocks.hasLivePrice = false;

        render(<FeaturedHotelCardInfo {...mocks} />);

        expect(screen.queryByTestId('live-price')).not.toBeInTheDocument();
        expect(screen.queryByTestId('from-label')).not.toBeInTheDocument();
    });

    it('should NOT render prices when isPricesHidden true', () => {
        (isTradeStore as any).mockReturnValueOnce(true);
        mockStores.layoutStore.isPricesHidden = true;

        render(<FeaturedHotelCardInfo {...mocks} />);

        expect(screen.queryByTestId('live-price')).not.toBeInTheDocument();
        expect(screen.queryByTestId('from-label')).not.toBeInTheDocument();
    });

    describe('Promotion cardDescription tokenization', () => {
        it('should tokenize cardDescription with discount when discountAmountPerBooking exists', () => {
            const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');

            mockTokenizerReplaceToken.mockReturnValue('Save £50 on your booking');
            mockGetDiscount.mockReturnValue('£50');

            mocks.hotel.livePrice = {
                promotion: {
                    cardDescription: 'Save {discount} on your booking',
                    discountAmountPerBooking: 50,
                    percentageDiscountPerBooking: 0,
                } as ISinglePromotionInfo,
            } as ILivePrice;

            render(<FeaturedHotelCardInfo {...mocks} />);

            expect(mockGetDiscount).toHaveBeenCalledWith(
                mocks.hotel.livePrice.promotion,
                'GBP',
                mockStores.marketStore.formatMoney,
            );

            expect(mockTokenizerReplaceToken).toHaveBeenCalledWith(
                'Save {discount} on your booking',
                '{discount}',
                '£50',
            );

            expect(screen.queryByTestId('price-component')).toBeInTheDocument();
        });

        it('should tokenize cardDescription with discount when percentageDiscountPerBooking exists', () => {
            const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');

            mockTokenizerReplaceToken.mockReturnValue('Save 15% on your booking');
            mockGetDiscount.mockReturnValue('15%');

            mocks.hotel.livePrice = {
                promotion: {
                    cardDescription: 'Save {discount} on your booking',
                    discountAmountPerBooking: 0,
                    percentageDiscountPerBooking: 0.15,
                } as ISinglePromotionInfo,
            } as ILivePrice;

            render(<FeaturedHotelCardInfo {...mocks} />);

            expect(mockTokenizerReplaceToken).toHaveBeenCalledWith(
                'Save {discount} on your booking',
                '{discount}',
                '15%',
            );
        });

        it('should NOT tokenize cardDescription when no discount exists', () => {
            const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mocks.hotel.livePrice = {
                promotion: {
                    cardDescription: 'Regular promo description',
                    discountAmountPerBooking: 0,
                    percentageDiscountPerBooking: 0,
                } as ISinglePromotionInfo,
            } as ILivePrice;

            render(<FeaturedHotelCardInfo {...mocks} />);

            expect(mockGetDiscount).not.toHaveBeenCalled();
            expect(mockGetDiscountPerPerson).not.toHaveBeenCalled();
            expect(mockTokenizerReplaceToken).not.toHaveBeenCalled();

            expect(screen.queryByTestId('price-component')).toBeInTheDocument();
        });

        it('should tokenize cardDescription with discountPerPerson when discountAmountPerPerson exists', () => {
            const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceToken.mockReturnValue('Save £80 pp on your booking');
            mockGetDiscountPerPerson.mockReturnValue('£80 pp');

            mocks.hotel.livePrice = {
                promotion: {
                    cardDescription: 'Save {discountPerPerson} on your booking',
                    discountAmountPerPerson: 80,
                } as ISinglePromotionInfo,
            } as ILivePrice;

            render(<FeaturedHotelCardInfo {...mocks} />);

            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                mocks.hotel.livePrice.promotion,
                'GBP',
                mockStores.marketStore.formatMoney,
                '',
                ' pp',
            );

            expect(mockTokenizerReplaceToken).toHaveBeenCalledWith(
                'Save {discountPerPerson} on your booking',
                Tokens.DiscountPerPerson,
                '£80 pp',
            );
        });

        it('should tokenize cardDescription with discountPerPerson when discountPercentagePerPerson exists', () => {
            const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceToken.mockReturnValue('Save 15% pp on your booking');
            mockGetDiscountPerPerson.mockReturnValue('15% pp');

            mocks.hotel.livePrice = {
                promotion: {
                    cardDescription: 'Save {discountPerPerson} on your booking',
                    discountPercentagePerPerson: 0.15,
                } as ISinglePromotionInfo,
            } as ILivePrice;

            render(<FeaturedHotelCardInfo {...mocks} />);

            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                mocks.hotel.livePrice.promotion,
                'GBP',
                mockStores.marketStore.formatMoney,
                '',
                ' pp',
            );

            expect(mockTokenizerReplaceToken).toHaveBeenCalledWith(
                'Save {discountPerPerson} on your booking',
                Tokens.DiscountPerPerson,
                '15% pp',
            );
        });

        it('should prioritize discountAmountPerPerson when both per-person fields are provided', () => {
            const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');
            const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

            mockTokenizerReplaceToken.mockReturnValue('Save £100 pp on your booking');
            mockGetDiscountPerPerson.mockReturnValue('£100 pp');

            mocks.hotel.livePrice = {
                promotion: {
                    cardDescription: 'Save {discountPerPerson} on your booking',
                    discountAmountPerPerson: 100,
                    discountPercentagePerPerson: 0.2,
                } as ISinglePromotionInfo,
            } as ILivePrice;

            render(<FeaturedHotelCardInfo {...mocks} />);

            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                mocks.hotel.livePrice.promotion,
                'GBP',
                mockStores.marketStore.formatMoney,
                '',
                ' pp',
            );

            expect(mockTokenizerReplaceToken).toHaveBeenCalledWith(
                'Save {discountPerPerson} on your booking',
                Tokens.DiscountPerPerson,
                '£100 pp',
            );

            expect(screen.queryByTestId('price-component')).toBeInTheDocument();
        });

        it('should NOT render promoBlock when cardDescription is empty', () => {
            const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');
            mockTokenizerReplaceToken.mockReturnValue('');

            mocks.hotel.livePrice = {
                promotion: {
                    cardDescription: '',
                    discountAmountPerBooking: 50,
                    percentageDiscountPerBooking: 0,
                } as ISinglePromotionInfo,
            } as ILivePrice;

            render(<FeaturedHotelCardInfo {...mocks} />);

            expect(screen.queryByTestId('price-component')).not.toBeInTheDocument();
        });

        it('should NOT render promoBlock when cardDescription is null', () => {
            const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');
            mockTokenizerReplaceToken.mockReturnValue('');

            mocks.hotel.livePrice = {
                promotion: {
                    cardDescription: null,
                    discountAmountPerBooking: 50,
                    percentageDiscountPerBooking: 0,
                } as unknown as ISinglePromotionInfo,
            } as ILivePrice;

            render(<FeaturedHotelCardInfo {...mocks} />);

            expect(screen.queryByTestId('price-component')).not.toBeInTheDocument();
        });
    });
});
