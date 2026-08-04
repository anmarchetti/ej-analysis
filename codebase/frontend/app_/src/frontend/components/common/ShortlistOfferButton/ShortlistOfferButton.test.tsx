import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { IHotel } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { ShortlistType } from 'models/enum/ShortlistType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ShortlistOfferButton, { IShortlistOfferButtonProps } from './ShortlistOfferButton';

const mockButtonComponent = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        const { children, onClick } = props;
        mockButtonComponent(props);

        return (
            <button data-tid='button' onClick={onClick}>
                {children}
            </button>
        );
    },
}));

jest.mock('frontend/components/common/OfferButton/OfferButton', () => ({ label, onClick }) => (
    <button data-tid='offer-button' onClick={onClick}>
        {label}
    </button>
));

let mockIsShortlistedOfferUnavailableForBooking = false;
jest.mock('frontend/utils/shortlist.utils', () => ({
    __esModule: true,
    isShortlistedOfferUnavailableForBooking: jest.fn(() => mockIsShortlistedOfferUnavailableForBooking),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): IShortlistOfferButtonProps => ({
    link: 'link',
    offer: {
        hotel: { isGreatDeal: false } as IHotel,
        shortlist: {
            type: ShortlistType.Offer,
        },
        currency: { code: CurrencyCode.GBP },
        price: 2000,
        pricePP: 1000,
    } as IOffer,
    onClick: jest.fn(),
    isLivePrice: false,
});

const createStores = () =>
    createMockStores({
        searchStore: { setNeedOpenWhenField: jest.fn() },
        shortlistStore: {
            isOfferFromAnotherMarket: jest.fn(() => false),
        },
    });

let mockProps;
let mockStores = createStores();

describe('<ShortlistOfferButton />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockIsShortlistedOfferUnavailableForBooking = false;
    });

    it('should render button when available offer was saved in other market', () => {
        mockStores.shortlistStore.isOfferFromAnotherMarket.mockReturnValue(true);
        render(<ShortlistOfferButton {...mockProps} />);

        expect(screen.getByTestId('button')).toHaveTextContent(SitecoreDictionary.ShortlistButtonsViewHoliday);
    });

    it('should render button when unavailable offer was saved in other market', () => {
        mockStores.shortlistStore.isOfferFromAnotherMarket.mockReturnValue(true);
        mockIsShortlistedOfferUnavailableForBooking = true;
        render(<ShortlistOfferButton {...mockProps} />);

        expect(screen.getByTestId('button')).toHaveTextContent(SitecoreDictionary.ShortlistButtonsCheckAvailability);
    });

    it('should render button when available hotel was saved in other market', () => {
        mockStores.shortlistStore.isOfferFromAnotherMarket.mockReturnValue(true);
        mockIsShortlistedOfferUnavailableForBooking = true;
        render(<ShortlistOfferButton {...mockProps} />);

        expect(screen.getByTestId('button')).toHaveTextContent(SitecoreDictionary.ShortlistButtonsCheckAvailability);
    });

    it('should call onClickViewHoliday on button click when offer was saved in other market', async () => {
        mockStores.shortlistStore.isOfferFromAnotherMarket.mockReturnValue(true);
        render(<ShortlistOfferButton {...mockProps} />);

        await userEvent.click(screen.getByTestId('button'));

        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should open when field on button click when offer was saved in other market and live price was loaded', async () => {
        mockProps.isLivePrice = true;
        mockStores.shortlistStore.isOfferFromAnotherMarket.mockReturnValue(true);
        render(<ShortlistOfferButton {...mockProps} />);

        await userEvent.click(screen.getByTestId('button'));

        expect(mockStores.searchStore.setNeedOpenWhenField).toHaveBeenCalled();
    });

    it('should call onClick on button click for offers from current market', async () => {
        render(<ShortlistOfferButton {...mockProps} />);

        await userEvent.click(screen.getByTestId('offer-button'));

        expect(mockProps.onClick).toHaveBeenCalled();
        expect(mockStores.searchStore.setNeedOpenWhenField).not.toHaveBeenCalled();
    });

    it('should open when field on button click for unavailable offers from current market', async () => {
        mockIsShortlistedOfferUnavailableForBooking = true;
        render(<ShortlistOfferButton {...mockProps} />);

        await userEvent.click(screen.getByTestId('offer-button'));

        expect(mockStores.searchStore.setNeedOpenWhenField).toHaveBeenCalled();
        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should render offer button for available offers from current market', () => {
        render(<ShortlistOfferButton {...mockProps} />);

        expect(screen.getByTestId('offer-button')).toHaveTextContent(SitecoreDictionary.ShortlistButtonsViewHoliday);
    });

    it('should render offer button for unavailable offers from current market', () => {
        mockIsShortlistedOfferUnavailableForBooking = true;
        render(<ShortlistOfferButton {...mockProps} />);

        expect(screen.getByTestId('offer-button')).toHaveTextContent(
            SitecoreDictionary.ShortlistButtonsCheckAvailability,
        );
    });

    it('should render offer button for available hotels from current market', () => {
        mockIsShortlistedOfferUnavailableForBooking = true;
        render(<ShortlistOfferButton {...mockProps} />);

        expect(screen.getByTestId('offer-button')).toHaveTextContent(
            SitecoreDictionary.ShortlistButtonsCheckAvailability,
        );
    });
});
