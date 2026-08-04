import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IPaginationProps, Pagination } from './Pagination';

const scrollTo = jest.fn();
Object.defineProperty(global, 'scrollTo', { value: scrollTo });

jest.mock('frontend/components/common/Pagination/LeftChevron', () => ({
    __esModule: true,
    default: ({ onClick, ariaLabel }) => (
        <button data-tid='left-chevron' onClick={onClick} onKeyDown={jest.fn()}>
            {ariaLabel}
        </button>
    ),
}));

jest.mock('frontend/components/common/Pagination/RightChevron', () => ({
    __esModule: true,
    default: ({ onClick, ariaLabel }) => (
        <button data-tid='right-chevron' onClick={onClick} onKeyDown={jest.fn()}>
            {ariaLabel}
        </button>
    ),
}));

jest.mock('frontend/components/common/Pagination/RoundButton', () => ({
    __esModule: true,
    default: ({ onClick, content }) => (
        <button data-tid='round-button' onClick={onClick} onKeyDown={jest.fn()}>
            {content}
        </button>
    ),
}));

jest.mock('frontend/components/common/Button/Button', () => ({
    __esModule: true,
    default: ({ onClick, children }) => (
        <button data-tid='button-component' onClick={onClick} onKeyDown={jest.fn()}>
            {children}
        </button>
    ),
}));

describe('<Pagination />', () => {
    const resetMocks = (): IPaginationProps => ({
        numberOfResults: 10,
        currentPage: 1,
        itemsOnEachPage: 4,
        fetchResults: jest.fn(),
        setCurrentPage: jest.fn(),
        redirectToSearchResultsPage: jest.fn(),
        updateDataLayer: jest.fn(),
        isScreenSmall: true,
        isPromoPage: false,
        isStaticPromoPage: false,
        maxLoadedPageNumber: 1,
        getPhrase: jest.fn(p => p),
        layoutId: '1',
        saveSearchParamsAndFilterToLocalStorage: jest.fn(),
        isPromoPageStorage: jest.fn(),
        paginatePromoPage: jest.fn(),
        onLoadMore: jest.fn(),
        onLoadPrevious: jest.fn(),
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render pagination with search-pagination class', () => {
        render(<Pagination {...mocks} />);

        expect(screen.getByTestId('search-pagination-wrapper')).toHaveClass('search-pagination');
    });

    it('should render dotted button when number of result is 10000', () => {
        mocks.numberOfResults = 10000;

        render(<Pagination {...mocks} />);

        expect(screen.getByText('...')).toBeInTheDocument();
    });

    describe('Right & Left chevrons', () => {
        it('should render only right chevron when currentPage equals 1', () => {
            mocks.currentPage = 1;

            render(<Pagination {...mocks} />);

            expect(screen.queryByTestId('left-chevron')).not.toBeInTheDocument();
            expect(screen.getByTestId('right-chevron')).toBeInTheDocument();
        });

        it('should NOT render right chevron on last page', () => {
            mocks.currentPage = 3;

            render(<Pagination {...mocks} />);

            expect(screen.queryByTestId('right-chevron')).not.toBeInTheDocument();
            expect(screen.getByTestId('left-chevron')).toBeInTheDocument();
        });

        it('should render right & left chevrons on any page except 1', () => {
            mocks.currentPage = 2;

            render(<Pagination {...mocks} />);

            expect(screen.getByTestId('right-chevron')).toHaveTextContent(
                SitecoreDictionary.AccessibilityAriaLabelsPaginationNextButton,
            );
            expect(screen.getByTestId('left-chevron')).toHaveTextContent(
                SitecoreDictionary.AccessibilityAriaLabelsPaginationPreviousButton,
            );
        });

        it('should call setCurrentPage on chevron click', async () => {
            render(<Pagination {...mocks} />);

            await userEvent.click(screen.getByTestId('right-chevron'));

            expect(mocks.setCurrentPage).toHaveBeenCalled();
        });
    });

    describe('Pagination buttons render', () => {
        it('should render right number of pages', () => {
            render(<Pagination {...mocks} />);

            expect(screen.getAllByTestId('round-button')).toHaveLength(3);
        });

        it('should render 2 pages buttons when numberOfResults is 8', () => {
            mocks.numberOfResults = 8;

            render(<Pagination {...mocks} />);

            expect(screen.getAllByTestId('round-button')).toHaveLength(2);
        });
    });

    describe('Pagination buttons onClick action', () => {
        it('should NOT call setCurrentPage when user clicks current page', async () => {
            render(<Pagination {...mocks} />);

            await userEvent.click(screen.getAllByTestId('round-button')[0]);

            expect(mocks.setCurrentPage).not.toHaveBeenCalled();
        });

        it('should call setCurrentPage, redirectToSearchResultsPage and fetchResults on rounded button click', async () => {
            render(<Pagination {...mocks} />);

            await userEvent.click(screen.getAllByTestId('round-button')[1]);

            expect(mocks.setCurrentPage).toHaveBeenCalled();
            expect(mocks.redirectToSearchResultsPage).toHaveBeenCalled();
            expect(mocks.fetchResults).toHaveBeenCalled();
        });
    });

    describe('Promo Page pagination functionality', () => {
        it('should call paginatePromoPage on static promo page (isStaticPromoPage = true)', async () => {
            mocks.isPromoPage = true;
            mocks.isStaticPromoPage = true;

            render(<Pagination {...mocks} />);

            await userEvent.click(screen.getAllByTestId('round-button')[1]);

            expect(mocks.paginatePromoPage).toHaveBeenCalledTimes(1);
            expect(mocks.paginatePromoPage).toHaveBeenCalledWith(2);
            expect(mocks.redirectToSearchResultsPage).not.toHaveBeenCalled();
        });

        it('should NOT call paginatePromoPage on dynamic promo page (isStaticPromoPage = false)', async () => {
            mocks.isPromoPage = true;
            mocks.isStaticPromoPage = false;

            render(<Pagination {...mocks} />);

            await userEvent.click(screen.getAllByTestId('round-button')[1]);

            expect(mocks.paginatePromoPage).not.toHaveBeenCalled();
            expect(mocks.redirectToSearchResultsPage).not.toHaveBeenCalled();
            expect(mocks.setCurrentPage).toHaveBeenCalledWith(2);
            expect(mocks.fetchResults).toHaveBeenCalledWith(true);
        });

        it('should call redirectToSearchResultsPage on regular search page (isPromoPage = false)', async () => {
            mocks.isPromoPage = false;
            mocks.isStaticPromoPage = false;

            render(<Pagination {...mocks} />);

            await userEvent.click(screen.getAllByTestId('round-button')[1]);

            expect(mocks.paginatePromoPage).not.toHaveBeenCalled();
            expect(mocks.redirectToSearchResultsPage).toHaveBeenCalled();
            expect(mocks.setCurrentPage).toHaveBeenCalledWith(2);
            expect(mocks.fetchResults).toHaveBeenCalledWith(true);
        });
    });

    describe('Load More button', () => {
        beforeEach(() => {
            mocks.isScreenSmall = false;
        });

        it('should render Load More button', () => {
            mocks.numberOfResults = 20;

            render(<Pagination {...mocks} />);

            expect(screen.getByTestId('button-component')).toHaveTextContent(
                SitecoreDictionary.SearchResultsButtonsLoadMore,
            );
        });

        it('should call onLoadMore on load more button click', async () => {
            mocks.maxLoadedPageNumber = 1;

            render(<Pagination {...mocks} />);

            await userEvent.click(screen.getByTestId('button-component'));

            expect(mocks.onLoadMore).toHaveBeenCalled();
        });
    });

    describe('Load Previous button', () => {
        beforeEach(() => {
            mocks.isScreenSmall = false;
            mocks.isLoadPreviousBtn = true;
        });

        it('should render load previous button', () => {
            render(<Pagination {...mocks} />);

            expect(screen.getByTestId('button-component')).toHaveTextContent(
                SitecoreDictionary.SearchResultsButtonsLoadPrevious,
            );
        });

        it('should call onLoadPrevious on load previous button click', async () => {
            render(<Pagination {...mocks} />);

            await userEvent.click(screen.getByTestId('button-component'));

            expect(mocks.onLoadPrevious).toHaveBeenCalled();
        });
    });
});
