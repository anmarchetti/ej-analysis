import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { createMockStores, mockLivePrice } from 'frontend/__mocks__';
import { mockCompareFields } from 'frontend/__mocks__/compare';
import { mockShortlistFields } from 'frontend/__mocks__/shortlist';
import * as shortlistUtils from 'frontend/utils/shortlist.utils';
import { IHotel } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { ShortlistType } from 'models/enum/ShortlistType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import OfferPrice, { IOfferPriceProps } from './OfferPrice';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockOfferPricePills = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OfferPrice/OfferPricePills', () => ({
    __esModule: true,
    default: props => {
        mockOfferPricePills(props);

        return <div data-tid='offer-price-pills' />;
    },
}));

const mockOfferPriceButton = jest.fn();
jest.mock('frontend/components/common/OfferPriceButton/OfferPriceButton', () => props => {
    mockOfferPriceButton(props);

    return <button data-tid='offer-price-button' />;
});

const mockErrorMessageCall = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => props => {
    mockErrorMessageCall(props);

    return <div data-tid='error-message' />;
});

jest.mock(
    'frontend/components/renderings/SearchResults/components/OfferCardPrices/OfferCardPrices',
    () =>
        ({ offer, livePrice }) =>
            (
                <>
                    <div data-tid='total-price'>{livePrice?.price || offer.price}</div>
                    <div data-tid='price-pp'>{livePrice?.pricePP || offer.pricePP}</div>
                </>
            ),
);

const mockCheckboxProps = jest.fn();
jest.mock('frontend/components/common/Checkbox', () => props => {
    mockCheckboxProps(props);
    const { disabled, checked, onChange } = props;

    return <input type='checkbox' data-tid='checkbox' disabled={disabled} checked={checked} onChange={onChange} />;
});

let mockIsHolidayStore = true;
jest.mock('frontend/store/holidays', () => ({
    isHolidayStore: jest.fn(() => mockIsHolidayStore),
}));

jest.mock('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore'),
    useCompareStore: () => mockLocalStore,
}));

const createProps = (): IOfferPriceProps => ({
    isShortlistHotelType: false,
    link: 'link',
    onClickViewHoliday: jest.fn(),
    offer: {
        hotel: { isGreatDeal: false } as IHotel,
        shortlist: {
            type: ShortlistType.Hotel,
            id: '111',
        },
        currency: { code: CurrencyCode.GBP },
        price: 2000,
        pricePP: 1000,
    } as IOffer,
    hidePills: false,
    ShortlistFields: mockShortlistFields,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isShortlistPage: false,
            isPricesHidden: false,
        },
        shortlistStore: {
            isOfferFromAnotherMarket: jest.fn(() => false),
        },
    });
const createMockLocalStore = () => ({
    isCompareModeEnabled: false,
    isOfferSelectedToCompare: jest.fn(),
    updateComparisonList: jest.fn(),
    hasMaxItemsToCompare: false,
    compareDealsFields: mockCompareFields,
});

let mockProps;
let mockStores;
let mockLocalStore;

describe('<OfferPrice />', () => {
    beforeEach(() => {
        jest.spyOn(shortlistUtils, 'isShortlistOfferUnavailable').mockReturnValue(true);
        mockProps = createProps();
        mockStores = createStores();
        mockLocalStore = createMockLocalStore();
    });

    it('should handle potential null value from useCompareStore', () => {
        mockLocalStore = null;

        const { container } = render(<OfferPrice {...mockProps} />);

        expect(container).not.toBeEmptyDOMElement();
    });

    describe('Price visible', () => {
        it('should render offer prices', () => {
            const { container, getByTestId } = render(<OfferPrice {...mockProps} />);

            expect(container.getElementsByClassName('hotel-price').length).toBe(1);
            expect(getByTestId('total-price')).toHaveTextContent(mockProps.offer.price);
            expect(getByTestId('price-pp')).toHaveTextContent(mockProps.offer.pricePP);
        });

        it('should render live prices', () => {
            mockProps.livePrice = { price: 10, pricePP: 5 };
            const { getByTestId } = render(<OfferPrice {...mockProps} />);

            expect(getByTestId('total-price')).toHaveTextContent(mockProps.livePrice.price);
            expect(getByTestId('price-pp')).toHaveTextContent(mockProps.livePrice.pricePP);
        });

        it('should render offer price pills container', () => {
            const { getByTestId } = render(<OfferPrice {...mockProps} />);

            expect(getByTestId('offer-price-pills')).toBeInTheDocument();
            expect(mockOfferPricePills).toHaveBeenCalledWith({
                offer: mockProps.offer,
                isEcoCertifiedPill: true,
            });
        });

        it('should NOT render offer price pills container', () => {
            mockProps.hidePills = true;
            const { queryByTestId } = render(<OfferPrice {...mockProps} />);

            expect(queryByTestId('offer-price-pills')).not.toBeInTheDocument();
            expect(mockOfferPricePills).not.toHaveBeenCalled();
        });

        it('should NOT render price when offer is unavailable and from another market on shortlist page ', () => {
            mockProps.offer.price = 0;
            mockStores.shortlistStore.isOfferFromAnotherMarket = jest.fn(() => true);
            mockStores.layoutStore.isShortlistPage = true;

            render(<OfferPrice {...mockProps} />);

            expect(screen.queryByTestId('total-price')).not.toBeInTheDocument();
            expect(screen.queryByTestId('price-pp')).not.toBeInTheDocument();
        });

        it('should render price when offer is unavailable on shortlist page', () => {
            mockProps.livePrice = mockLivePrice;
            mockProps.offer.price = 0;
            mockStores.shortlistStore.isOfferFromAnotherMarket = jest.fn(() => false);
            mockStores.layoutStore.isShortlistPage = true;

            render(<OfferPrice {...mockProps} />);

            expect(screen.getByTestId('total-price')).toHaveTextContent(`${mockLivePrice.price}`);
            expect(screen.getByTestId('price-pp')).toHaveTextContent(`${mockLivePrice.pricePP}`);
        });

        it('should NOT render price when offer is unavailable on shortlist page and livePrice is equal to 0', () => {
            mockProps.livePrice = { ...mockLivePrice, price: 0 };
            mockProps.offer.price = 0;
            mockStores.shortlistStore.isOfferFromAnotherMarket = jest.fn(() => true);
            mockStores.layoutStore.isShortlistPage = true;

            render(<OfferPrice {...mockProps} />);

            expect(screen.queryByTestId('total-price')).not.toBeInTheDocument();
            expect(screen.queryByTestId('price-pp')).not.toBeInTheDocument();
        });
    });

    describe('Price NOT visible', () => {
        it('should render ErrorMessage with data for other hotel', () => {
            mockStores.layoutStore.isShortlistPage = true;
            mockStores.shortlistStore.isOfferFromAnotherMarket = jest.fn(() => true);

            render(<OfferPrice {...mockProps} />);

            expect(screen.getByTestId('error-message')).toBeInTheDocument();
            expect(mockErrorMessageCall).toBeCalledWith({
                IfIsNotificationOrange: true,
                dataTid: 'shortlist-warning-message',
                description: SitecoreDictionary.ShortlistErrorsPickNewDates,
                errorMessageClass: 'pick-new-dates__message',
                message: SitecoreDictionary.ShortlistErrorsHolidayExpired,
            });
        });

        it('should render ErrorMessage with data for hotel type', () => {
            mockProps.isShortlistHotelType = true;
            mockStores.layoutStore.isShortlistPage = true;
            mockStores.shortlistStore.isOfferFromAnotherMarket = jest.fn(() => true);

            render(<OfferPrice {...mockProps} />);

            expect(screen.getByTestId('error-message')).toBeInTheDocument();
            expect(mockErrorMessageCall).toBeCalledWith({
                IfIsNotificationOrange: true,
                dataTid: 'shortlist-warning-message',
                description: SitecoreDictionary.ShortlistErrorsShortlistedHotelPickDates,
                errorMessageClass: 'pick-new-dates__message',
                message: SitecoreDictionary.ShortlistErrorsShortlistedHotelMessage,
            });
        });
    });

    describe('offer button', () => {
        it('should render OfferPriceButton on non shortlist pages', () => {
            render(<OfferPrice {...mockProps} />);

            expect(screen.getByTestId('offer-price-button')).toBeInTheDocument();
            expect(mockOfferPriceButton).toHaveBeenCalledWith({
                link: mockProps.link,
                offer: mockProps.offer,
                onClick: mockProps.onClickViewHoliday,
                isLivePrice: !!mockProps.livePrice,
            });
        });

        it('should render OfferPriceButton on shortlist pages when comparison mode is off', () => {
            mockStores.layoutStore.isShortlistPage = true;
            render(<OfferPrice {...mockProps} />);

            expect(screen.getByTestId('offer-price-button')).toBeInTheDocument();
            expect(mockOfferPriceButton).toHaveBeenCalledWith({
                link: mockProps.link,
                offer: mockProps.offer,
                onClick: mockProps.onClickViewHoliday,
                isLivePrice: !!mockProps.livePrice,
            });
        });

        it('should render OfferPriceButton with black color when it is luxury package', () => {
            mockProps.isLuxury = true;
            render(<OfferPrice {...mockProps} />);

            expect(screen.getByTestId('offer-price-button')).toBeInTheDocument();
            expect(mockOfferPriceButton).toHaveBeenCalledWith({
                link: mockProps.link,
                offer: mockProps.offer,
                onClick: mockProps.onClickViewHoliday,
                isLivePrice: !!mockProps.livePrice,
                className: 'btn--black',
            });
        });
    });

    describe('comparison', () => {
        beforeEach(() => {
            mockStores.layoutStore.isShortlistPage = true;
            mockLocalStore.isCompareModeEnabled = true;
        });

        it('should render checkbox on shortlist page when comparison mode is on', () => {
            render(<OfferPrice {...mockProps} />);

            expect(screen.getByTestId('checkbox')).toBeInTheDocument();
            expect(mockCheckboxProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    ariaLabel: mockProps.offer.hotel?.name,
                }),
            );
        });

        it('should render checked checkbox when offer selected for comparison', () => {
            mockLocalStore.isOfferSelectedToCompare.mockReturnValue(true);
            render(<OfferPrice {...mockProps} />);

            expect(screen.getByTestId('checkbox')).toHaveAttribute('checked');
            expect(mockLocalStore.isOfferSelectedToCompare).toHaveBeenCalledWith(mockProps.offer);
        });

        it('should call updateComparisonList when click on checkbox', async () => {
            render(<OfferPrice {...mockProps} />);

            await userEvent.click(screen.getByRole('checkbox'));

            expect(mockLocalStore.updateComparisonList).toHaveBeenCalledWith({
                ...mockProps.offer,
                link: mockProps.link,
                onClickViewHoliday: mockProps.onClickViewHoliday,
            });
        });

        it('should disable compare checkbox when comparison at max', () => {
            mockLocalStore.hasMaxItemsToCompare = true;
            render(<OfferPrice {...mockProps} />);
            expect(screen.getByRole('checkbox')).toBeDisabled();
        });

        it('should render compare warning message when comparison mode is on and shortlist type is hotel type', () => {
            mockStores.layoutStore.isShortlistPage = true;
            mockProps.isShortlistHotelType = true;
            mockLocalStore.isCompareModeEnabled = true;
            render(<OfferPrice {...mockProps} />);
            expect(screen.getByTestId('error-message')).toBeInTheDocument();
            expect(mockErrorMessageCall).toBeCalledWith({
                dataTid: 'compare-warning-message',
                IfIsNotificationOrange: true,
                description: mockProps.ShortlistFields.CompareWarningDescription?.value,
                errorMessageClass: 'pick-new-dates__message',
                message: mockProps.ShortlistFields.CompareWarningTitle?.value,
            });
        });

        it('should render compare warning message when comparison mode is on and offer is unavailable', () => {
            mockProps.offer.price = 0;
            mockStores.layoutStore.isShortlistPage = true;
            mockLocalStore.isCompareModeEnabled = true;
            render(<OfferPrice {...mockProps} />);
            expect(screen.getByTestId('error-message')).toBeInTheDocument();
            expect(mockErrorMessageCall).toBeCalledWith({
                IfIsNotificationOrange: true,
                dataTid: 'compare-warning-message',
                description: mockProps.ShortlistFields.CompareWarningDescription?.value,
                errorMessageClass: 'pick-new-dates__message',
                message: mockProps.ShortlistFields.CompareWarningTitle?.value,
            });
        });

        it('should NOT render compare warning message when comparison mode is on and offer is available', () => {
            mockProps.offer.price = 500;
            mockStores.layoutStore.isShortlistPage = true;
            mockLocalStore.isCompareModeEnabled = true;
            render(<OfferPrice {...mockProps} />);
            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        });
    });

    describe('on trade portal', () => {
        beforeEach(() => {
            mockIsHolidayStore = false;
        });

        it('should render OfferPriceButton on trade portal', () => {
            render(<OfferPrice {...mockProps} />);

            expect(screen.getByTestId('offer-price-button')).toBeInTheDocument();
        });

        it('should not render compare checkbox on trade portal', () => {
            render(<OfferPrice {...mockProps} />);

            expect(screen.queryByTestId('checkbox')).not.toBeInTheDocument();
        });
    });
});
