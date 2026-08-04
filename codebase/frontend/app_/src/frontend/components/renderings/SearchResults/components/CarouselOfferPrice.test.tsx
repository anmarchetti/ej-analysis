import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import * as shortlistUtils from 'frontend/utils/shortlist.utils';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { CarouselOfferPrice, ICarouselOfferPriceProps } from './CarouselOfferPrice';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockOfferCardPriceItem = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OfferCardPrices/OfferCardPriceItem', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardPriceItem(props);

        return <div data-tid='offer-card-price-item' />;
    },
}));

const mockErrorMessage = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: props => {
        mockErrorMessage(props);

        return <div data-tid='error-message' />;
    },
}));

jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='link'>{children}</div>,
}));

jest.mock('frontend/utils/touristTax.utils', () => ({
    ...jest.requireActual('frontend/utils/touristTax.utils'),
    getTouristTaxFieldsFromOffer: jest.fn().mockReturnValue(mockTouristTaxFields),
}));

const mockIsShortlistOfferUnavailable = jest.spyOn(shortlistUtils, 'isShortlistOfferUnavailable');

const createStores = () =>
    createMockStores({
        layoutStore: {
            isShortlistPage: false,
            isSmartSeerCarouselCTANoFollowLinkEnabled: false,
        },
        searchStore: {
            setNeedOpenWhenField: jest.fn(),
        },
    });

const resetMocks = (): ICarouselOfferPriceProps => ({
    onClickViewHoliday: jest.fn(),
    link: '',
    offer: {
        price: 100,
        pricePP: 50,
        priceExcludingTouristTax: 90,
        pricePPExcludingTouristTax: 45,
        hotel: { country: { code: 'test' } },
    } as any,
});

let mocks;
let mockStores = createStores();

describe('<CarouselOfferPrice />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
        mockIsShortlistOfferUnavailable.mockReturnValue(true);
    });

    it('should render OfferCardPriceItems', () => {
        render(<CarouselOfferPrice {...mocks} />);

        expect(getTouristTaxFieldsFromOffer).toHaveBeenCalledWith(mocks.offer);
        expect(screen.getByTestId('offer-card-price-item')).toBeInTheDocument();
        expect(mockOfferCardPriceItem).toHaveBeenCalledWith({
            className: 'price',
            wrapperClassName: 'offerCardPriceWrapper',
            currency: undefined,
            price: mocks.offer.price,
            priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom,
            priceExcludingTouristTax: mocks.offer.priceExcludingTouristTax,
            pricePP: mocks.offer.pricePP,
            pricePPExcludingTouristTax: mocks.offer.pricePPExcludingTouristTax,
            taxTooltipTriggerClassName: 'taxTooltipTrigger',
            isPricePP: true,
            ...mockTouristTaxFields,
        });
    });

    it('should render ErrorMessage when isShortlistPage and isShortlistOfferUnavailable is true', () => {
        mockStores.layoutStore.isShortlistPage = true;

        render(<CarouselOfferPrice {...mocks} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(mockErrorMessage).toHaveBeenCalledWith({
            IfIsNotificationOrange: true,
            description: SitecoreDictionary.ShortlistErrorsPickNewDates,
            message: SitecoreDictionary.ShortlistErrorsHolidayExpired,
            errorMessageClass: 'pick-new-dates__message',
        });
    });

    it('should NOT render ErrorMessage when livePrice is provided', () => {
        mocks.livePrice = {} as ILivePrice;

        render(<CarouselOfferPrice {...mocks} />);

        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should render link with SearchResultsButtonsViewHoliday text when isShortlistPage is false', () => {
        mockStores.layoutStore.isSmartSeerCarouselCTANoFollowLinkEnabled = true;
        mocks.isRecommendedCarousel = true;

        render(<CarouselOfferPrice {...mocks} />);

        expect(screen.getByTestId('link')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.SearchResultsButtonsViewHoliday)).toBeInTheDocument();
        expect(screen.getByTestId('view-holiday-link')).toHaveAttribute('rel', 'nofollow');
    });

    it('should render link with ShortlistButtonsCheckAvailability text when isShortlistPage is true and isShortlistOfferUnavailable is true', () => {
        mockStores.layoutStore.isShortlistPage = true;

        render(<CarouselOfferPrice {...mocks} />);

        expect(screen.getByTestId('link')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.ShortlistButtonsCheckAvailability)).toBeInTheDocument();
        expect(screen.getByTestId('view-holiday-link')).not.toHaveAttribute('rel');
    });

    it('should render link with ShortlistButtonsViewHoliday text when isShortlistPage is true and isShortlistOfferUnavailable is false', () => {
        mockStores.layoutStore.isShortlistPage = true;
        mockIsShortlistOfferUnavailable.mockReturnValue(false);

        render(<CarouselOfferPrice {...mocks} />);

        expect(screen.getByTestId('link')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.ShortlistButtonsViewHoliday)).toBeInTheDocument();
    });

    it('should call onClickViewHoliday on viewHolidayButtonLabel click when isPriceVisible is true', async () => {
        render(<CarouselOfferPrice {...mocks} />);

        await userEvent.click(screen.getByText(SitecoreDictionary.SearchResultsButtonsViewHoliday));

        expect(mocks.onClickViewHoliday).toHaveBeenCalled();
    });

    it('should call setNeedOpenWhenField on viewHolidayButtonLabel click when isPriceVisible is false', async () => {
        mockStores.layoutStore.isShortlistPage = true;

        render(<CarouselOfferPrice {...mocks} />);

        await userEvent.click(screen.getByText(SitecoreDictionary.ShortlistButtonsCheckAvailability));

        expect(mockStores.searchStore.setNeedOpenWhenField).toHaveBeenCalled();
    });

    it('should render hotel link with target _blank when openLinkInNewTab props is true', () => {
        mocks.openLinkInNewTab = true;
        render(<CarouselOfferPrice {...mocks} />);

        expect(screen.getByText(SitecoreDictionary.SearchResultsButtonsViewHoliday)).toHaveAttribute(
            'target',
            '_blank',
        );
    });

    it('should render hotel link with target _self when openLinkInNewTab props is false', () => {
        render(<CarouselOfferPrice {...mocks} />);

        expect(screen.getByText(SitecoreDictionary.SearchResultsButtonsViewHoliday)).toHaveAttribute('target', '_self');
    });

    describe('isPricesHidden prop', () => {
        it('should NOT render OfferCardPriceItem when isPricesHidden is true', () => {
            mocks.isPricesHidden = true;

            render(<CarouselOfferPrice {...mocks} />);

            expect(screen.queryByTestId('offer-card-price-item')).not.toBeInTheDocument();
        });

        it('should render OfferCardPriceItem when isPricesHidden is false', () => {
            mocks.isPricesHidden = false;

            render(<CarouselOfferPrice {...mocks} />);

            expect(screen.getByTestId('offer-card-price-item')).toBeInTheDocument();
        });

        it('should NOT render OfferCardPriceItem when isPricesHidden is true even on shortlist page with unavailable offer', () => {
            mockStores.layoutStore.isShortlistPage = true;
            mockIsShortlistOfferUnavailable.mockReturnValue(true);
            mocks.isPricesHidden = true;

            render(<CarouselOfferPrice {...mocks} />);

            expect(screen.queryByTestId('offer-card-price-item')).not.toBeInTheDocument();
        });

        it('should render OfferCardPriceItem when isPricesHidden is false and livePrice is available', () => {
            mocks.isPricesHidden = false;
            mocks.livePrice = { pricePP: 100 } as ILivePrice;

            render(<CarouselOfferPrice {...mocks} />);

            expect(screen.getByTestId('offer-card-price-item')).toBeInTheDocument();
        });

        it('should NOT render ErrorMessage when isPricesHidden is true on shortlist page', () => {
            mockStores.layoutStore.isShortlistPage = true;
            mockIsShortlistOfferUnavailable.mockReturnValue(true);
            mocks.isPricesHidden = true;

            render(<CarouselOfferPrice {...mocks} />);

            expect(screen.getByTestId('error-message')).toBeInTheDocument();
        });

        it('should call setNeedOpenWhenField when isPricesHidden is true and button clicked', async () => {
            mocks.isPricesHidden = true;

            render(<CarouselOfferPrice {...mocks} />);

            await userEvent.click(screen.getByText(SitecoreDictionary.SearchResultsButtonsViewHoliday));

            expect(mockStores.searchStore.setNeedOpenWhenField).toHaveBeenCalledWith(true);
            expect(mocks.onClickViewHoliday).toHaveBeenCalled();
        });
    });
});
