import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import * as utils from 'frontend/utils/offer.utils';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { OfferCardPrices } from './OfferCardPrices';

const TOOLTIP_MESSAGE = 'test tooltip';

const createProps = () => ({
    offer: {
        currency: { code: 'CURRENCY' },
        price: 100,
        pricePP: 50,
        priceExcludingTouristTax: 80,
        pricePPExcludingTouristTax: 40,
    },
    isCarouselCard: false,
    livePrice: { price: 300, pricePP: 150, priceExcludingTouristTax: 250, pricePPExcludingTouristTax: 125 },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/touristTax.utils', () => ({
    ...jest.requireActual('frontend/utils/touristTax.utils'),
    getTouristTaxFieldsFromOffer: jest.fn().mockReturnValue(mockTouristTaxFields),
}));

const mockOfferCardPriceItem = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OfferCardPrices/OfferCardPriceItem', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardPriceItem(props);

        return <div data-tid='offer-card-price-item' />;
    },
}));

jest.spyOn(utils, 'getPricePill').mockReturnValue(TOOLTIP_MESSAGE);
jest.spyOn(utils, 'getTotalDiscount').mockReturnValue(200.5);
jest.spyOn(utils, 'getTotalDiscountPPExcludingInfants').mockReturnValue(100.25);

describe('<OfferCardPrices />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isPriceViewToggleEnabled: true,
                isOffersPriceViewTotal: false,
                isPromoPage: false,
                isSearchResultsPage: false,
                isShortlistPage: false,
                tooltipSettings: {},
                isTradePortal: false,
            },
            shortlistStore: { isAnyShortlistMultiplePersonOfferNotExpired: false },
        });
    });

    it('should render OfferCardPriceItem twice when isPricePPShown is true', () => {
        render(<OfferCardPrices {...mockProps} />);

        expect(screen.getAllByTestId('offer-card-price-item')).toHaveLength(2);
    });

    it('should render OfferCardPriceItem twice when isPricePPShown is true and isPriceViewToggleEnabled is false', () => {
        mockStores.layoutStore.isPriceViewToggleEnabled = true;

        render(<OfferCardPrices {...mockProps} />);

        expect(getTouristTaxFieldsFromOffer).toHaveBeenCalledWith(mockProps.offer);
        expect(screen.getAllByTestId('offer-card-price-item')).toHaveLength(2);
        expect(mockOfferCardPriceItem).toHaveBeenNthCalledWith(1, {
            className: 'total',
            currency: mockProps.offer.currency.code,
            price: mockProps.livePrice.price,
            priceDictionary: undefined,
            priceExcludingTouristTax: mockProps.livePrice.priceExcludingTouristTax,
            pricePP: mockProps.livePrice.pricePP,
            pricePPExcludingTouristTax: mockProps.livePrice.pricePPExcludingTouristTax,
            tooltipMessage: undefined,
            discount: 0,
            isPricePP: false,
            ...mockTouristTaxFields,
        });
        expect(mockOfferCardPriceItem).toHaveBeenNthCalledWith(2, {
            className: 'subprice',
            currency: mockProps.offer.currency.code,
            price: mockProps.livePrice.price,
            priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom,
            priceExcludingTouristTax: mockProps.livePrice.priceExcludingTouristTax,
            pricePP: mockProps.livePrice.pricePP,
            pricePPExcludingTouristTax: mockProps.livePrice.pricePPExcludingTouristTax,
            tooltipMessage: TOOLTIP_MESSAGE,
            discount: 0,
            isPricePP: true,
            ...mockTouristTaxFields,
        });
    });

    it('should render OfferCardPriceItem with discount twice when isPricePPShown is true, isPriceViewToggleEnabled is false and shouldDisplayStrikethroughPrices is true', () => {
        mockStores.layoutStore.isPriceViewToggleEnabled = true;
        mockProps.shouldDisplayStrikethroughPrices = true;

        render(<OfferCardPrices {...mockProps} />);

        expect(screen.getAllByTestId('offer-card-price-item')).toHaveLength(2);
        expect(mockOfferCardPriceItem).toHaveBeenNthCalledWith(1, {
            className: 'total',
            currency: mockProps.offer.currency.code,
            price: mockProps.livePrice.price,
            priceDictionary: undefined,
            priceExcludingTouristTax: mockProps.livePrice.priceExcludingTouristTax,
            pricePP: mockProps.livePrice.pricePP,
            pricePPExcludingTouristTax: mockProps.livePrice.pricePPExcludingTouristTax,
            tooltipMessage: undefined,
            discount: 201,
            isPricePP: false,
            ...mockTouristTaxFields,
        });
        expect(mockOfferCardPriceItem).toHaveBeenNthCalledWith(2, {
            className: 'subprice',
            currency: mockProps.offer.currency.code,
            price: mockProps.livePrice.price,
            priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom,
            priceExcludingTouristTax: mockProps.livePrice.priceExcludingTouristTax,
            pricePP: mockProps.livePrice.pricePP,
            pricePPExcludingTouristTax: mockProps.livePrice.pricePPExcludingTouristTax,
            tooltipMessage: TOOLTIP_MESSAGE,
            discount: 101,
            isPricePP: true,
            ...mockTouristTaxFields,
        });
    });

    it('should render OfferCardPriceItem when isPricePPShown is false and isCarouselCard is true', () => {
        mockProps.isCarouselCard = true;
        mockProps.livePrice.price = 150;

        render(<OfferCardPrices {...mockProps} />);

        expect(screen.getByTestId('offer-card-price-item')).toBeInTheDocument();
        expect(mockOfferCardPriceItem).toHaveBeenCalledWith(
            expect.objectContaining({
                priceDictionary: SitecoreDictionary.GlobalsPriceLabelsFrom,
                tooltipMessage: TOOLTIP_MESSAGE,
            }),
        );
    });

    it('should render OfferCardPriceItem with total price when isOffersPriceViewTotal is true, isShortlistPage is true and isAnyShortlistMultiplePersonOfferNotExpired is true', () => {
        mockStores.layoutStore.isShortlistPage = true;
        mockStores.shortlistStore.isAnyShortlistMultiplePersonOfferNotExpired = true;
        mockStores.layoutStore.isOffersPriceViewTotal = true;

        render(<OfferCardPrices {...mockProps} />);

        expect(screen.getByTestId('offer-card-price-item')).toBeInTheDocument();
        expect(mockOfferCardPriceItem).toHaveBeenCalledWith({
            className: 'total',
            currency: mockProps.offer.currency.code,
            price: mockProps.livePrice.price,
            priceDictionary: SitecoreDictionary.GlobalsPriceLabelsTotalFrom,
            priceExcludingTouristTax: mockProps.livePrice.priceExcludingTouristTax,
            pricePP: mockProps.livePrice.pricePP,
            pricePPExcludingTouristTax: mockProps.livePrice.pricePPExcludingTouristTax,
            tooltipMessage: TOOLTIP_MESSAGE,
            discount: 0,
            isPricePP: !mockStores.layoutStore.isOffersPriceViewTotal,
            ...mockTouristTaxFields,
        });
    });

    it('should render OfferCardPriceItem with discount when shouldDisplayStrikethroughPrices is true', () => {
        mockStores.layoutStore.isShortlistPage = true;
        mockStores.shortlistStore.isAnyShortlistMultiplePersonOfferNotExpired = true;
        mockStores.layoutStore.isOffersPriceViewTotal = true;
        mockProps.shouldDisplayStrikethroughPrices = true;

        render(<OfferCardPrices {...mockProps} />);

        expect(screen.getByTestId('offer-card-price-item')).toBeInTheDocument();
        expect(mockOfferCardPriceItem).toHaveBeenCalledWith({
            className: 'total',
            currency: mockProps.offer.currency.code,
            price: mockProps.livePrice.price,
            priceDictionary: SitecoreDictionary.GlobalsPriceLabelsTotalFrom,
            priceExcludingTouristTax: mockProps.livePrice.priceExcludingTouristTax,
            pricePP: mockProps.livePrice.pricePP,
            pricePPExcludingTouristTax: mockProps.livePrice.pricePPExcludingTouristTax,
            tooltipMessage: TOOLTIP_MESSAGE,
            discount: 201,
            isPricePP: !mockStores.layoutStore.isOffersPriceViewTotal,
            ...mockTouristTaxFields,
        });
    });

    it('should render OfferCardPriceItem with price from offer when isPromoPage is true and live price is null', () => {
        mockProps.livePrice = null;
        mockStores.layoutStore.isPromoPage = true;

        render(<OfferCardPrices {...mockProps} />);

        expect(screen.getByTestId('offer-card-price-item')).toBeInTheDocument();
        expect(mockOfferCardPriceItem).toHaveBeenCalledWith(
            expect.objectContaining({
                price: mockProps.offer.price,
                pricePP: mockProps.offer.pricePP,
                priceExcludingTouristTax: mockProps.offer.priceExcludingTouristTax,
                pricePPExcludingTouristTax: mockProps.offer.pricePPExcludingTouristTax,
            }),
        );
    });

    it('should render OfferCardPriceItem when isSearchResultsPage is true', () => {
        mockStores.layoutStore.isSearchResultsPage = true;

        render(<OfferCardPrices {...mockProps} />);

        expect(screen.getByTestId('offer-card-price-item')).toBeInTheDocument();
    });
});
