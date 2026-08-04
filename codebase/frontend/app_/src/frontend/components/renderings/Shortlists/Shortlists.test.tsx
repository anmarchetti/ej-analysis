import * as React from 'react';
import { fireEvent } from '@testing-library/dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockShortlistFields } from 'frontend/__mocks__/shortlist';
import { getDestinationLivePriceByCode } from 'frontend/utils/livePrice.utils';
import { getOfferAccomCode, isShortlistedOfferUnavailableForBooking } from 'frontend/utils/shortlist.utils';
import { IOffer } from 'models/data/IOffer';
import { DataStatus } from 'models/enum/DataStatus';

import Shortlists, { TShortlistsProps } from './Shortlists';

const mockOfferCardComponent = jest.fn();
jest.mock('frontend/utils/livePrice.utils', () => ({
    getDestinationLivePriceByCode: jest.fn(),
}));

jest.mock('frontend/utils/shortlist.utils', () => ({
    isShortlistedOfferUnavailableForBooking: jest.fn(),
    getOfferAccomCode: jest.fn(),
}));

jest.mock('frontend/components/common/OffersPriceViewToggle', () => ({
    __esModule: true,
    default: () => <div data-tid='offers-price-view-toggle' />,
}));

jest.mock('frontend/components/common/Pagination/Pagination', () => ({
    __esModule: true,
    default: ({ fetchResults }) => <div data-tid='pagination' onClick={fetchResults} />,
}));

jest.mock('frontend/components/renderings/SearchResults/components/OfferCard', () => ({
    __esModule: true,
    default: ({ offer, onSelect, ...props }) => {
        mockOfferCardComponent(props);

        return <div data-tid='offer-card' onClick={() => onSelect(offer)} />;
    },
}));

jest.mock('frontend/components/renderings/Shortlists/components/ShortlistBanner', () => ({
    __esModule: true,
    default: () => <div data-tid='shortlist-banner' />,
}));

jest.mock('frontend/components/renderings/Shortlists/components/ShortlistRemovePopup', () => ({
    __esModule: true,
    default: ({ onClose, onRemove }) => (
        <div data-tid='shortlist-remove-popup'>
            <button data-tid='close-shortlist-remove-popup' onClick={onClose} />
            <button data-tid='remove-shortlist-remove-popup' onClick={onRemove} />
        </div>
    ),
}));

const mockRedirectPopupProps = jest.fn();
jest.mock('frontend/components/renderings/Shortlists/components/ShortlistRedirectPopup/ShortlistRedirectPopup', () => ({
    __esModule: true,
    default: props => {
        mockRedirectPopupProps(props);

        return (
            <div data-tid='shortlist-redirect-popup'>
                <div data-tid='redirect-popup-close-button' onClick={props.onClose} />
                <div data-tid='redirect-popup-redirect-button' onClick={props.onRedirect} />
            </div>
        );
    },
}));

jest.mock('./components/ShortlistToolbar/ShortlistToolbar', () => ({
    __esModule: true,
    default: () => <div data-tid='shortlist-toolbar' />,
}));

jest.mock('frontend/components/renderings/SearchResults/components/SearchResultsLoadingSkeleton', () => ({
    __esModule: true,
    default: () => <div data-tid='search-results-loading-skeleton' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore', () => ({
    ...jest.requireActual('frontend/components/renderings/CompareDeals/stores/createCompareLocalStore'),
    useCompareStore: () => mockLocalStore,
}));

const resetMocks = (): TShortlistsProps => ({
    fields: mockShortlistFields,
    rendering: null,
    params: null,
});
const createMockLocalStore = () => ({
    isOfferSelectedToCompare: jest.fn(),
    isCompareModeEnabled: false,
});

let mockProps;
let mockStores;
let mockLocalStore;

describe('<Shortlists />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createMockStores({
            shortlistStore: {
                initializeShortlists: jest.fn(),
                offers: [],
                clearShortlist: jest.fn(),
                toggleRemovePopup: jest.fn(),
                toggleRedirectPopup: jest.fn(),
                fetchShortlistOffers: jest.fn(),
                deleteShortlistedItems: jest.fn(async (offers, callback) => await callback()),
                selectedOffers: [],
                clearSelectedOffers: jest.fn(),
                selectShortlistOfferForBooking: jest.fn(),
                offersStatus: DataStatus.NotLoaded,
                totalOffers: 0,
                take: 10,
                page: 1,
                setPageNumber: jest.fn(),
                isShortlistEditMode: false,
                isOfferSelected: jest.fn(),
                toggleOfferSelection: jest.fn(),
                isRemovePopupShown: false,
                isRedirectPopupShown: false,
                onShortlistItemDeleted: jest.fn(),
            },
            trackingStore: {
                trackShortlistView: jest.fn(),
            },
            layoutStore: {
                isShortlistsLivePriceEnabled: false,
            },
            hotelsStore: {
                getLivePrice: jest.fn(),
            },
        });
        mockLocalStore = createMockLocalStore();
    });

    it('Should standart render', () => {
        const { container } = render(<Shortlists {...mockProps} />);

        expect(container).not.toBeEmptyDOMElement();
    });

    it('should NOT render component when no fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<Shortlists {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should call clearShortlist() on unmount', () => {
        const { unmount } = render(<Shortlists {...mockProps} />);
        unmount();

        expect(mockStores.shortlistStore.clearShortlist).toHaveBeenCalled();
    });

    it('Should render only skeleton on loading', () => {
        mockStores.shortlistStore.offersStatus = DataStatus.Loading;
        const { container } = render(<Shortlists {...mockProps} />);

        expect(screen.getByTestId('search-results-loading-skeleton')).toBeInTheDocument();
        expect(container.querySelector('.hotel-search-results')).not.toBeInTheDocument();
        expect(screen.queryByTestId('shortlist-toolbar')).not.toBeInTheDocument();
    });

    it('Should render cards and toolbar if offers are loaded', () => {
        mockStores.shortlistStore.offersStatus = DataStatus.Loaded;
        mockStores.shortlistStore.offers = [{}] as IOffer[];
        mockStores.shortlistStore.totalOffers = 1;
        const { container } = render(<Shortlists {...mockProps} />);

        expect(screen.queryByTestId('search-results-loading-skeleton')).not.toBeInTheDocument();
        expect(container.querySelector('.hotel-search-results')).toBeInTheDocument();
        expect(screen.getByTestId('shortlist-toolbar')).toBeInTheDocument();
    });

    it('Should not render cards and toolbar if empty offers list is loaded', () => {
        mockStores.shortlistStore.offersStatus = DataStatus.Loaded;
        mockStores.shortlistStore.offers = [];
        mockStores.shortlistStore.totalOffers = 0;
        const { container } = render(<Shortlists {...mockProps} />);

        expect(container.querySelector('.hotel-search-results')).not.toBeInTheDocument();
        expect(screen.queryByTestId('shortlist-toolbar')).not.toBeInTheDocument();
    });

    it('Should call selectShortlistOfferForBooking', () => {
        const offer = { id: 'test' } as IOffer;
        mockStores.shortlistStore.offersStatus = DataStatus.Loaded;
        mockStores.shortlistStore.offers = [offer];
        render(<Shortlists {...mockProps} />);

        fireEvent.click(screen.getByTestId('offer-card'));
        expect(mockStores.shortlistStore.selectShortlistOfferForBooking).toHaveBeenCalledWith(offer);
    });

    describe('Pagination', () => {
        it('Should render pagination', () => {
            mockStores.shortlistStore.offersStatus = DataStatus.Loaded;
            mockStores.shortlistStore.offers = [{}] as IOffer[];
            mockStores.shortlistStore.take = 10;
            mockStores.shortlistStore.totalOffers = 20;
            render(<Shortlists {...mockProps} />);

            expect(screen.getByTestId('pagination')).toBeInTheDocument();
        });

        it('Should not render pagination', () => {
            mockStores.shortlistStore.offersStatus = DataStatus.Loaded;
            mockStores.shortlistStore.offers = [{}] as IOffer[];
            mockStores.shortlistStore.take = 10;
            mockStores.shortlistStore.totalOffers = 1;
            render(<Shortlists {...mockProps} />);

            expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
        });

        it('Should call fetchOffers when loadNextPage is called', async () => {
            mockStores.shortlistStore.offersStatus = DataStatus.Loaded;
            mockStores.shortlistStore.offers = [{}] as IOffer[];
            mockStores.shortlistStore.take = 10;
            mockStores.shortlistStore.totalOffers = 20;
            render(<Shortlists {...mockProps} />);

            await fireEvent.click(screen.getByTestId('pagination'));

            expect(mockStores.shortlistStore.fetchShortlistOffers).toHaveBeenCalled();
        });
    });

    describe('Shortlist Remove Popup', () => {
        it('Should render popup', () => {
            mockStores.shortlistStore.isRemovePopupShown = true;
            render(<Shortlists {...mockProps} />);

            expect(screen.getByTestId('shortlist-remove-popup')).toBeInTheDocument();
        });

        it('Should call onShortlistItemDeleted() on remove event', () => {
            mockStores.shortlistStore.isRemovePopupShown = true;
            render(<Shortlists {...mockProps} />);

            fireEvent.click(screen.getByTestId('remove-shortlist-remove-popup'));
            expect(mockStores.shortlistStore.deleteShortlistedItems).toHaveBeenCalled();
            expect(mockStores.shortlistStore.onShortlistItemDeleted).toHaveBeenCalled();
        });

        it('Should close pop up and reset selected offers on close event', () => {
            mockStores.shortlistStore.isRemovePopupShown = true;
            render(<Shortlists {...mockProps} />);

            fireEvent.click(screen.getByTestId('close-shortlist-remove-popup'));
            expect(mockStores.shortlistStore.toggleRemovePopup).toHaveBeenCalledWith(false);
            expect(mockStores.shortlistStore.clearSelectedOffers).toHaveBeenCalled();
        });
    });

    describe('Shortlist Redirect Popup', () => {
        it('Should render popup', () => {
            mockStores.shortlistStore.isRedirectPopupShown = true;
            render(<Shortlists {...mockProps} />);

            expect(mockRedirectPopupProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    bodyContent: mockProps.fields.RedirectDescription,
                    offer: mockStores.shortlistStore.selectedOffers[0],
                    redirectLabel: mockProps.fields.RedirectButtonLabel,
                    title: mockProps.fields.RedirectTitle,
                }),
            );

            expect(screen.getByTestId('shortlist-redirect-popup')).toBeInTheDocument();
        });

        it('Should call clearSelectedOffers when click on redirect button', () => {
            mockStores.shortlistStore.isRedirectPopupShown = true;
            render(<Shortlists {...mockProps} />);

            fireEvent.click(screen.getByTestId('redirect-popup-redirect-button'));

            expect(mockStores.shortlistStore.clearSelectedOffers).toHaveBeenCalled();
        });

        it('Should call clearSelectedOffers when click on close button', () => {
            mockStores.shortlistStore.isRedirectPopupShown = true;
            render(<Shortlists {...mockProps} />);

            fireEvent.click(screen.getByTestId('redirect-popup-close-button'));

            expect(mockStores.shortlistStore.clearSelectedOffers).toHaveBeenCalled();
            expect(mockStores.shortlistStore.toggleRedirectPopup).toHaveBeenCalledWith(false);
        });
    });

    describe('Check live prices', () => {
        beforeEach(() => {
            mockStores.layoutStore.isShortlistsLivePriceEnabled = true;
            mockStores.shortlistStore.offersStatus = DataStatus.Loaded;
        });

        it('Should NOT fetch live prices when it is disabled in settings', async () => {
            mockStores.layoutStore.isShortlistsLivePriceEnabled = false;

            const { rerender } = render(<Shortlists {...mockProps} />);

            mockStores.shortlistStore.offers = [{}] as IOffer[];

            rerender(<Shortlists {...mockProps} />);

            await waitFor(() => {
                expect(mockStores.hotelsStore.getLivePrice).not.toHaveBeenCalled();
            });
        });

        it('Should use giata codes from offer when needed to fetch live prices', async () => {
            (isShortlistedOfferUnavailableForBooking as any).mockResolvedValue(true);
            mockStores.shortlistStore.offers = [{ giataCode: '12345' }, { giataCode: '12345' }, {}] as IOffer[];

            render(<Shortlists {...mockProps} />);

            await waitFor(() => {
                expect(mockStores.hotelsStore.getLivePrice).toHaveBeenCalledWith(['12345']);
            });
        });

        it('should call getDestinationLivePriceByCode with accom code and live price response in args and set the correct live price in the offer card', async () => {
            const shortlistAccomCode = '12345';
            const expectedLivePriceProp = '1';
            const livePriceRes = [{ geog: '123', price: 10, pricePP: 5 }];

            mockStores.hotelsStore.getLivePrice.mockResolvedValue(livePriceRes);
            mockStores.shortlistStore.offers = [{ accom: {}, giataCode: '123' }] as IOffer[];

            (getOfferAccomCode as any).mockReturnValue(shortlistAccomCode);
            (getDestinationLivePriceByCode as any).mockReturnValue(expectedLivePriceProp);
            (isShortlistedOfferUnavailableForBooking as any).mockReturnValue(false);

            render(<Shortlists {...mockProps} />);

            await waitFor(() => {
                expect(mockStores.hotelsStore.getLivePrice).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(getDestinationLivePriceByCode).toHaveBeenCalledWith(shortlistAccomCode, livePriceRes);
                expect(mockOfferCardComponent).toHaveBeenNthCalledWith(
                    1,
                    expect.objectContaining({ livePrice: expectedLivePriceProp }),
                );
            });
        });

        it('should call getDestinationLivePriceByCode with giata code and live price response in args', async () => {
            const shortlistGiataCode = '123';
            const livePriceRes = [{ geog: '123', price: 10, pricePP: 5 }];

            mockStores.hotelsStore.getLivePrice.mockResolvedValue(livePriceRes);
            mockStores.shortlistStore.offers = [{ accom: {}, giataCode: shortlistGiataCode }] as IOffer[];

            (isShortlistedOfferUnavailableForBooking as any).mockReturnValue(true);

            render(<Shortlists {...mockProps} />);

            await waitFor(() => {
                expect(mockStores.hotelsStore.getLivePrice).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(getDestinationLivePriceByCode).toHaveBeenCalledWith(shortlistGiataCode, livePriceRes);
            });
        });

        describe('Check live prices', () => {
            beforeEach(() => {
                mockStores.layoutStore.isShortlistsLivePriceEnabled = true;
                mockStores.shortlistStore.offersStatus = DataStatus.Loaded;
            });

            it('should NOT call trackShortlistView when there are no offers', async () => {
                render(<Shortlists {...mockProps} />);

                await waitFor(() => {
                    expect(mockStores.trackingStore.trackShortlistView).not.toHaveBeenCalled();
                });
            });

            it('should call trackShortlistView when offers are exist', async () => {
                mockStores.shortlistStore.offers = [{}] as IOffer[];

                render(<Shortlists {...mockProps} />);

                await waitFor(() => {
                    expect(mockStores.trackingStore.trackShortlistView).toHaveBeenCalledTimes(1);
                });
            });

            it('should call trackShortlistView on pagination click when offers are provided', async () => {
                mockStores.shortlistStore.totalOffers = 20;
                mockStores.shortlistStore.offers = [{}] as IOffer[];
                render(<Shortlists {...mockProps} />);

                const pagination = screen.getByTestId('pagination');
                await userEvent.click(pagination);

                expect(mockStores.trackingStore.trackShortlistView).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('shortlist icon', () => {
        it('Should call OfferCard with hasShortlistBookmark true when edit and compare mode are off', async () => {
            mockStores.shortlistStore.offersStatus = DataStatus.Loaded;
            mockStores.shortlistStore.offers = [mockedOffer];
            render(<Shortlists {...mockProps} />);

            expect(mockOfferCardComponent).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ hasShortlistBookmark: true }),
            );
        });

        it('Should call OfferCard with hasShortlistBookmark false when edit mode is on', async () => {
            mockStores.shortlistStore.offersStatus = DataStatus.Loaded;
            mockStores.shortlistStore.offers = [mockedOffer];
            mockLocalStore.isCompareModeEnabled = true;
            render(<Shortlists {...mockProps} />);

            expect(mockOfferCardComponent).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ hasShortlistBookmark: false }),
            );
        });

        it('Should call OfferCard with hasShortlistBookmark false when compare mode are onn', async () => {
            mockStores.shortlistStore.offersStatus = DataStatus.Loaded;
            mockStores.shortlistStore.offers = [mockedOffer];
            mockStores.shortlistStore.isShortlistEditMode = true;
            render(<Shortlists {...mockProps} />);

            expect(mockOfferCardComponent).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ hasShortlistBookmark: false }),
            );
        });
    });
});
