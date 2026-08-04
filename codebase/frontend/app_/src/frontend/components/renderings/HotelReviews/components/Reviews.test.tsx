import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import * as mediaUtils from 'frontend/hooks/useMediaQuery';
import { IReviewsData } from 'frontend/store/base';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IReviewsProps, Reviews } from './Reviews';

const reviewsData = {
    averageRating: 1,
    totalReviewsAmount: 1,
    reviewRatingAmounts: [],
    subratings: [],
    reviews: [
        {
            title: 'test',
            ratingNum: 4.1,
            publishedDate: 'test',
            author: 'test',
            text: 'test',
        },
    ],
    certificates: [],
};

const createStores = () =>
    createMockStores({
        hotelReviewsStore: {
            data: reviewsData,
            fetchReviews: jest.fn(() => reviewsData),
            resetStore: jest.fn(),
        },
        layoutStore: {
            isSearchResultsPage: false,
            setIsBodyScrollLocked: jest.fn(),
            layout: {
                sitecore: {
                    route: {
                        itemId: 'test',
                    },
                },
            },
        },
        bookingStore: {
            selectedOffer: {
                price: 100,
                pricePP: 50,
            },
        },
    });

const createProps = (): IReviewsProps => ({
    anchor: 'test',
    reviews: 2,
    rating: 3.2,
    tripadvisorId: '4224692',
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTripadvisorRating = jest.fn();
jest.mock('frontend/components/common/TripadvisorRating/TripadvisorRating', () => ({
    __esModule: true,
    default: props => {
        mockTripadvisorRating(props);

        return <div data-tid='tripadvisor-rating' />;
    },
}));

const mockRatingBarItem = jest.fn();
jest.mock('frontend/components/renderings/HotelReviews/components/RatingBarItem', () => ({
    __esModule: true,
    default: props => {
        mockRatingBarItem(props);

        return <div data-tid='rating-bar-item' />;
    },
}));

const mockRatingCategoryItem = jest.fn();
jest.mock('frontend/components/renderings/HotelReviews/components/RatingCategoryItem', () => ({
    __esModule: true,
    default: props => {
        mockRatingCategoryItem(props);

        return <div data-tid='rating-category-item' />;
    },
}));

const mockTripAdvisorCertificates = jest.fn();
jest.mock('frontend/components/renderings/HotelReviews/components/TripAdvisorCertificates', () => ({
    __esModule: true,
    default: props => {
        mockTripAdvisorCertificates(props);

        return <div data-tid='tripadvisor-certificates' />;
    },
}));

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, dataTid, ...props }) => {
        mockButton(props);

        return (
            <button onClick={onClick} data-tid={dataTid}>
                {children}
            </button>
        );
    },
}));

const mockReviewsDrawer = jest.fn();
jest.mock('frontend/components/renderings/HotelReviews/components/ReviewsDrawer', () => ({
    __esModule: true,
    default: ({ onClose, ...props }) => {
        mockReviewsDrawer(props);

        return (
            <div data-tid='reviews-drawer'>
                <button onClick={onClose} onKeyDown={jest.fn()} data-tid='reviews-drawer-close' />
            </div>
        );
    },
}));

const mockReviewsList = jest.fn();
jest.mock('frontend/components/renderings/HotelReviews/components/ReviewsList', () => ({
    __esModule: true,
    default: props => {
        mockReviewsList(props);

        return <div data-tid='reviews-list' />;
    },
}));

const spyUseXSMobileViewport = jest.spyOn(mediaUtils, 'useXSMobileViewport');

describe('<Reviews />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        spyUseXSMobileViewport.mockReturnValue(false);
    });

    it('should NOT render when tripadvisorId is NOT provided ', () => {
        mockProps.tripadvisorId = null;

        const { container } = render(<Reviews {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render correct dictionary item due to reviews amount of 1', () => {
        mockProps.reviews = 1;
        render(<Reviews {...mockProps} />);
        expect(mockStores.layoutStore.getPhrase).toBeCalledWith(
            SitecoreDictionary.HotelReviewsLabelsBasedOnReviewSingular,
        );
    });

    it('should render correct dictionary item due to reviews amount of 1+', () => {
        mockProps.reviews = 2;
        render(<Reviews {...mockProps} />);
        expect(mockStores.layoutStore.getPhrase).toBeCalledWith(
            SitecoreDictionary.HotelReviewsLabelsBasedOnReviewsPlural,
        );
    });

    it('should render list @ desktop', () => {
        render(<Reviews {...mockProps} />);

        expect(screen.getByTestId('reviews-feed-section')).toBeInTheDocument();
        expect(screen.queryByTestId('reviews-drawer-section')).not.toBeInTheDocument();
    });

    it('should close reviews by default', () => {
        render(<Reviews {...mockProps} />);

        expect(screen.getByTestId('reviews-feed-section')).not.toHaveClass('is-open');
    });

    it('should open reviews onClick @ desktop', async () => {
        render(<Reviews {...mockProps} />);

        const reviewsContainer = screen.getByTestId('reviews-feed-section');

        expect(reviewsContainer).not.toHaveClass('is-open');

        await userEvent.click(screen.getByText(SitecoreDictionary.HotelReviewsLabelsOpenReviewsList));
        expect(reviewsContainer).toHaveClass('is-open');
    });

    it('should close reviews onClick @ desktop', async () => {
        render(<Reviews {...mockProps} />);

        const reviewsContainer = screen.getByTestId('reviews-feed-section');

        await userEvent.click(screen.getByText(SitecoreDictionary.HotelReviewsLabelsOpenReviewsList));
        expect(reviewsContainer).toHaveClass('is-open');

        await userEvent.click(screen.getByText(SitecoreDictionary.HotelReviewsLabelsCloseReviewsList));
        expect(reviewsContainer).not.toHaveClass('is-open');
    });

    it('should close reviews on desktop/mobile change', async () => {
        const { rerender } = render(<Reviews {...mockProps} />);

        await userEvent.click(screen.getByText(SitecoreDictionary.HotelReviewsLabelsOpenReviewsList));
        expect(screen.getByTestId('reviews-list')).toBeInTheDocument();

        spyUseXSMobileViewport.mockReturnValue(true);

        rerender(<Reviews {...mockProps} />);
        expect(mockReviewsDrawer).toHaveBeenCalledWith(
            expect.objectContaining({
                isExpanded: false,
            }),
        );
    });

    it('should render drawer @ mobile', () => {
        spyUseXSMobileViewport.mockReturnValue(true);

        render(<Reviews {...mockProps} />);

        expect(screen.queryByTestId('reviews-feed-section')).not.toBeInTheDocument();
        expect(screen.getByTestId('reviews-drawer-section')).toBeInTheDocument();
    });

    it('should open and close drawer @ mobile', async () => {
        spyUseXSMobileViewport.mockReturnValue(true);

        render(<Reviews {...mockProps} />);

        expect(mockReviewsDrawer).toHaveBeenCalledWith(
            expect.objectContaining({
                isExpanded: false,
            }),
        );

        await userEvent.click(screen.getByText(SitecoreDictionary.HotelReviewsLabelsOpenReviewsDrawer));

        expect(mockReviewsDrawer).toHaveBeenCalledWith(
            expect.objectContaining({
                isExpanded: true,
            }),
        );

        await userEvent.click(screen.getByTestId('reviews-drawer-close'));

        expect(mockReviewsDrawer).toHaveBeenCalledWith(
            expect.objectContaining({
                isExpanded: false,
            }),
        );
    });

    it('should render default variant and show reviews on the page', async () => {
        render(<Reviews {...mockProps} />);

        expect(screen.getByTestId('hotel-reviews-button-open')).toBeInTheDocument();

        await userEvent.click(screen.getByText(SitecoreDictionary.HotelReviewsLabelsOpenReviewsList));
        expect(screen.getByTestId('reviews-feed-section')).toBeInTheDocument();
    });

    it('should render TripadvisorRating when rating is provided', () => {
        render(<Reviews {...mockProps} />);

        expect(mockTripadvisorRating).toHaveBeenCalledWith({
            hasIcon: true,
            showRatingValue: undefined,
            rating: mockProps.rating,
        });
        expect(screen.getByTestId('tripadvisor-rating')).toBeInTheDocument();
    });

    it('should NOT render TripadvisorRating when rating is NOT provided', () => {
        mockProps.rating = null;

        render(<Reviews {...mockProps} />);

        expect(mockTripadvisorRating).not.toHaveBeenCalled();
        expect(screen.queryByTestId('tripadvisor-rating')).not.toBeInTheDocument();
    });

    it('should call resetStore on mount and unmount', () => {
        const { unmount } = render(<Reviews {...mockProps} />);

        expect(mockStores.hotelReviewsStore.resetStore).toHaveBeenCalledTimes(1);
        unmount();
        expect(mockStores.hotelReviewsStore.resetStore).toHaveBeenCalledTimes(2);
    });

    it('should add and remove scroll listener', () => {
        const addSpy = jest.spyOn(document, 'addEventListener');
        const removeSpy = jest.spyOn(document, 'removeEventListener');

        const { unmount } = render(<Reviews {...mockProps} />);

        expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
        unmount();
        expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('should call fetchReviews when isTopReached returns true', () => {
        Object.defineProperty(window, 'innerHeight', { value: 100, writable: true });
        Object.defineProperty(document.documentElement, 'scrollTop', { value: 200, writable: true });
        jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ top: 50 } as DOMRect));

        mockProps.SSRData = null;

        render(<Reviews {...mockProps} />);

        act(() => {
            document.dispatchEvent(new Event('scroll'));
        });

        expect(mockStores.hotelReviewsStore.fetchReviews).toHaveBeenCalledTimes(1);
    });

    it('should not call fetchReviews if SSRData exists', () => {
        Object.defineProperty(window, 'innerHeight', { value: 100, writable: true });
        Object.defineProperty(document.documentElement, 'scrollTop', { value: 200, writable: true });
        jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ top: 50 } as DOMRect));

        mockProps.SSRData = {} as IReviewsData;

        render(<Reviews {...mockProps} />);

        act(() => {
            document.dispatchEvent(new Event('scroll'));
        });

        expect(mockStores.hotelReviewsStore.fetchReviews).not.toHaveBeenCalled();
    });
});
