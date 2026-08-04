import { Component, ReactElement, ReactNode } from 'react';
import { inject, observer } from 'mobx-react';

import { TWO } from 'code/commonNumbers';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';

import LeftChevron from './LeftChevron';
import RightChevron from './RightChevron';
import RoundButton from './RoundButton';

export interface IPaginationProps extends IComponentWithDictionary {
    currentPage: number;
    fetchResults: (force: boolean) => void;
    isPromoPage: boolean;
    isPromoPageStorage: () => boolean;
    isScreenSmall: boolean;
    isStaticPromoPage: boolean;
    itemsOnEachPage: number;
    layoutId: string;
    numberOfResults: number;
    paginatePromoPage: (page?: number) => void;

    saveSearchParamsAndFilterToLocalStorage: (layoutId: string) => void;
    setCurrentPage: (page: number) => void;
    isLoadPreviousBtn?: boolean;
    maxLoadedPageNumber?: number;
    mobilePaginationDisabled?: boolean;
    numberOfPages?: number;
    onLoadMore?: () => void;
    onLoadPrevious?: () => void;
    redirectToSearchResultsPage?: (queryParams?: string, backToSearch?: boolean) => void;

    updateDataLayer?: () => void;
}

const MAX_NUMBER_OF_ELEMENTS = 7;
const PAGE_NEIGHBORS = 1;
const SIDE_VALUE_WITHOUT_ELLIPSIS = 3;

export class Pagination extends Component<IPaginationProps> {
    private DOTTED_BUTTON = '...';

    private readonly range = (start: number, end: number): (string | number)[] => {
        if (start === end) {
            return [start];
        }

        return [start, ...this.range(start + 1, end)];
    };

    private get numberOfPages(): number {
        const { numberOfResults, itemsOnEachPage } = this.props;

        return !!this.props.numberOfPages ? this.props.numberOfPages : Math.ceil(numberOfResults / itemsOnEachPage);
    }

    private onPageChange = (pageNumber: number): void => {
        const { currentPage, setCurrentPage, fetchResults } = this.props;

        if (currentPage !== pageNumber) {
            setCurrentPage(pageNumber);

            if (this.props.isStaticPromoPage) {
                this.props.paginatePromoPage(pageNumber);
            }

            if (!this.props.isPromoPage && this.props.redirectToSearchResultsPage) {
                this.props.redirectToSearchResultsPage();
            }

            window.scrollTo(0, 0);
            fetchResults(true);
            this.props.updateDataLayer?.();
        }
    };

    private readonly getPaginationWithoutEllipsis = (currentPage: number, totalPages: number): (string | number)[] => {
        // Searching page numbers for displaying
        const startPage = Math.max(TWO, currentPage - PAGE_NEIGHBORS);
        const endPage = Math.min(totalPages - 1, currentPage + PAGE_NEIGHBORS);
        let pages = this.range(startPage, endPage);

        // spillOffset: number of hidden pages either to the left or to the right

        const spillOffset = MAX_NUMBER_OF_ELEMENTS - (pages.length + SIDE_VALUE_WITHOUT_ELLIPSIS);

        /**
         * hasLeftGaps: has hidden pages to the left
         * hasRightGaps: has hidden pages to the right
         * extraPages: additional pages to show
         */
        const hasLeftGaps = currentPage - 1 > SIDE_VALUE_WITHOUT_ELLIPSIS;
        const hasRightGaps = totalPages - currentPage > SIDE_VALUE_WITHOUT_ELLIPSIS;
        let extraPages;

        switch (true) {
            case hasLeftGaps && !hasRightGaps: {
                // handle: (1) 2 {3} [4] {5}
                if (totalPages - currentPage === SIDE_VALUE_WITHOUT_ELLIPSIS) {
                    extraPages = this.range(endPage + 1, endPage + spillOffset);
                    pages = [this.DOTTED_BUTTON, ...pages, ...extraPages];
                }
                // handle: (1) ... {4} [5] {6}
                else {
                    extraPages = this.range(startPage - spillOffset, startPage - 1);
                    pages = [this.DOTTED_BUTTON, ...extraPages, ...pages];
                }

                break;
            }

            case !hasLeftGaps && hasRightGaps: {
                // handle: {6} [7] {8} 9 (10)
                if (currentPage - 1 === SIDE_VALUE_WITHOUT_ELLIPSIS) {
                    extraPages = this.range(startPage - spillOffset, startPage - 1);
                    pages = [...extraPages, ...pages, this.DOTTED_BUTTON];
                }
                // handle: {4} [5] {6} ... (10)
                else {
                    extraPages = this.range(endPage + 1, endPage + spillOffset);
                    pages = [...pages, ...extraPages, this.DOTTED_BUTTON];
                }

                break;
            }

            // handle: (1) ... {4 5} [6] {7 8} ... (10)
            case hasLeftGaps && hasRightGaps: {
                pages = [this.DOTTED_BUTTON, ...pages, this.DOTTED_BUTTON];
                break;
            }
        }

        return [1, ...pages, totalPages];
    };

    private get renderedDesktopPagination(): ReactNode {
        const { currentPage } = this.props;
        const totalPages = this.numberOfPages;
        const render = [] as ReactElement[];

        if (totalPages > MAX_NUMBER_OF_ELEMENTS) {
            // Render pagination with hidden elements
            const pages = this.getPaginationWithoutEllipsis(currentPage, totalPages);

            return pages.map((item, key) =>
                item == this.DOTTED_BUTTON ? (
                    <RoundButton withoutBg={true} content={this.DOTTED_BUTTON} key={key} disabled={true} />
                ) : (
                    <RoundButton
                        withoutBg={item !== currentPage}
                        content={item}
                        key={key}
                        onClick={(): void => this.onPageChange(Number(item))}
                    />
                ),
            );
        }

        for (let i = 1; i <= totalPages; i++) {
            render.push(
                <RoundButton
                    onClick={(): void => this.onPageChange(i)}
                    key={i}
                    withoutBg={currentPage !== i}
                    content={i}
                />,
            );
        }

        return render;
    }

    private get renderedLoadMoreButton(): ReactNode {
        if (this.props.isLoadPreviousBtn) {
            return (
                <Button onClick={(): void => this.props.onLoadPrevious?.()} isOutlined className='load-previous' isWide>
                    {this.props.getPhrase(SitecoreDictionary.SearchResultsButtonsLoadPrevious)}
                </Button>
            );
        }

        if (this.props.maxLoadedPageNumber && this.props.maxLoadedPageNumber < this.numberOfPages) {
            return (
                <Button onClick={(): void => this.props.onLoadMore?.()} isOutlined className='load-more' isWide>
                    {this.props.getPhrase(SitecoreDictionary.SearchResultsButtonsLoadMore)}
                </Button>
            );
        }

        return null;
    }

    render() {
        const { currentPage, getPhrase } = this.props;

        return (
            <div className='search-pagination' data-tid='search-pagination-wrapper'>
                {!this.props.isScreenSmall && !this.props.mobilePaginationDisabled ? (
                    this.renderedLoadMoreButton
                ) : (
                    <>
                        {currentPage > 1 && (
                            <LeftChevron
                                onClick={(): void => this.onPageChange(currentPage - 1)}
                                ariaLabel={getPhrase(
                                    SitecoreDictionary.AccessibilityAriaLabelsPaginationPreviousButton,
                                )}
                            />
                        )}
                        {this.renderedDesktopPagination}
                        {currentPage < this.numberOfPages && (
                            <RightChevron
                                onClick={(): void => this.onPageChange(currentPage + 1)}
                                ariaLabel={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPaginationNextButton)}
                            />
                        )}
                    </>
                )}
            </div>
        );
    }
}

const ConnectedPagination = inject((stores: TStores) => ({
    isScreenSmall: stores.appStore.isScreenSmall,
    isPromoPage: stores.layoutStore.isPromoPage,
    isStaticPromoPage: stores.layoutStore.isStaticPromoPage,
    getPhrase: stores.layoutStore.getPhrase,
    saveSearchParamsAndFilterToLocalStorage: stores.promoPageStore.saveSearchParamsAndFilterToLocalStorage,
    layoutId: stores.layoutStore.layoutId,
    isPromoPageStorage: stores.promoPageStore.isPromoPageStorage,
    paginatePromoPage: stores.routerStore.paginatePromoPage,
}))(observer(Pagination));

export default ConnectedPagination;
