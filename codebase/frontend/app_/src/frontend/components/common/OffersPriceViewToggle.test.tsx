import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SiteSettings from 'models/enum/SiteSettings';

import OffersPriceViewToggle from './OffersPriceViewToggle';

const createStores = () => ({
    layoutStore: {
        getSetting: jest.fn(key => settings[key]),
        isPriceViewToggleEnabled: true,
        isOffersPriceViewTotal: false,
        onChangeOffersPriceView: jest.fn(),
        isShortlistPage: true,
        isSearchResultsPage: false,
        isPromoPage: false,
    },
    searchStore: {
        searchWho: { isKidsGoFree: false },
    },
    shortlistStore: {
        isAnyShortlistMultiplePersonOfferNotExpired: true,
    },
    appStore: {
        isScreenLessMedium: false,
    },
    bookingStore: {
        adultsQuantity: 0,
        childrenQuantity: 0,
    },
    searchFiltersStore: { setIsPriceFilterPerPerson: jest.fn() },
});

const createSettings = () => ({
    [SiteSettings.TogglePricePPDesktopLabel]: 'PricePPDesktop',
    [SiteSettings.TogglePricePPMobileLabel]: 'PricePPMobile',
    [SiteSettings.ToggleTotalPriceDesktopLabel]: 'TotalPriceDesktop',
    [SiteSettings.ToggleTotalPriceMobileLabel]: 'TotalPriceMobile',
});

let settings = createSettings();
let mockStores = createStores();

const mockCheckboxProps = jest.fn();
jest.mock('frontend/components/common/Checkbox', () => ({ onChange, ...props }) => {
    mockCheckboxProps(props);

    return <button onClick={onChange} onKeyDown={jest.fn()} data-tid='checkbox' />;
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OffersPriceViewToggle />', () => {
    beforeEach(() => {
        mockStores = createStores();
        settings = createSettings();
    });

    it('should render checked checkbox', () => {
        render(<OffersPriceViewToggle />);

        expect(screen.getByTestId('checkbox')).toBeInTheDocument();
        expect(mockCheckboxProps).toHaveBeenCalledWith({
            checked: true,
            label: 'PricePPDesktop',
            label2: 'TotalPriceDesktop',
            toggle: true,
        });
    });

    it('should NOT render when isPriceViewToggleEnabled is false', () => {
        mockStores.layoutStore.isPriceViewToggleEnabled = false;

        const { container } = render(<OffersPriceViewToggle />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when guestQuantity is 1 and isShortlistPage is false', () => {
        mockStores.layoutStore.isShortlistPage = false;

        const { container } = render(<OffersPriceViewToggle />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when childrenQuantity is 10, isKidsGoFree is true and isShortlistPage is false', () => {
        mockStores.bookingStore.childrenQuantity = 10;
        mockStores.searchStore.searchWho.isKidsGoFree = true;
        mockStores.layoutStore.isShortlistPage = false;

        const { container } = render(<OffersPriceViewToggle />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render checkbox when isSearchResultsPage is true, isPromoPage is false and  and isShortlistPage is false', () => {
        mockStores.bookingStore.childrenQuantity = 2;
        mockStores.layoutStore.isSearchResultsPage = true;

        render(<OffersPriceViewToggle />);

        expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    });

    it('should be unchecked when isOffersPriceViewTotal is true', () => {
        mockStores.layoutStore.isOffersPriceViewTotal = true;
        mockStores.appStore.isScreenLessMedium = true;

        render(<OffersPriceViewToggle />);

        expect(mockCheckboxProps).toHaveBeenCalledWith({
            checked: false,
            label: 'PricePPMobile',
            label2: 'TotalPriceMobile',
            toggle: true,
        });
    });

    it('should called onChangeOffersPriceView when click', async () => {
        render(<OffersPriceViewToggle />);

        await userEvent.click(screen.getByTestId('checkbox'));

        expect(mockStores.layoutStore.onChangeOffersPriceView).toHaveBeenCalled();
        expect(mockStores.searchFiltersStore.setIsPriceFilterPerPerson).toHaveBeenCalledWith(false);
    });
});
