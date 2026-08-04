import { RefObject } from 'react';
import { waitFor } from '@testing-library/dom';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import { DataStatus } from 'models/enum/DataStatus';

import * as utils from './SearchResults.utils';

jest.mock('scroll-into-view-if-needed');

const {
    SEARCH_RESULTS_FILTERS_Y_OFFSET,
    getPromoPageMobileOffset,
    scrollHandler,
    getOffsetTop,
    getIsScrollableToHotel,
    getIsScrollableUpOrToResults,
} = utils;

const baseProps = {
    setSelectedOfferIndex: jest.fn(),
    isScreenLessMedium: false,
    isPromoPage: false,
    onChangeSearchFilterStore: jest.fn(),
    isFilterActive: false,
    selectedOfferIndex: 1,
    status: DataStatus.Loaded,
    filtersChanged: false,
    totalOffers: 10,
    isModalDisplayed: false,
    pageNumberChanged: false,
};

const mockQuerySelector = jest.spyOn(document, 'querySelector');
const mockScrollIntoView = jest.fn();
const mockBox = {
    current: { getBoundingClientRect: jest.fn(() => ({ top: 0 } as DOMRect)) },
} as unknown as RefObject<HTMLDivElement>;

const mockElement = document.createElement('div');
mockElement.setAttribute('class', 'hotel-search-results-box');
mockElement.scrollIntoView = mockScrollIntoView;

const getElementsByClassName = jest.fn(() => [mockElement]);

Object.defineProperty(document, 'getElementsByClassName', {
    value: getElementsByClassName,
    writable: true,
});

describe('SearchResults.utils', () => {
    beforeEach(() => {
        mockQuerySelector.mockReturnValue({} as Element);
    });

    describe('getOffsetTop', () => {
        it('should return 0 when box is undefined', () => {
            getElementsByClassName.mockImplementationOnce(() => []);

            expect(getOffsetTop({ current: null }, {} as Record<string, boolean>)).toBe(0);
        });

        it('should return 0 when isScreenLessMedium is true and isFilterActive is false', () => {
            getElementsByClassName.mockImplementationOnce(() => []);

            expect(
                getOffsetTop(mockBox, {
                    isScreenLessMedium: true,
                    isFilterActive: false,
                    isPromoPage: true,
                    isScrollableToResults: false,
                }),
            ).toBe(0);
        });

        it('should return 0 when both isScreenLessMedium/isScrollableToResults is false', () => {
            expect(
                getOffsetTop(mockBox, {
                    isScreenLessMedium: false,
                    isScrollableToResults: false,
                }),
            ).toBe(0);
        });

        it('should return correct value when both isScreenLessMedium/isFilterActive and isPromoPage are true', () => {
            expect(
                getOffsetTop(mockBox, {
                    isScreenLessMedium: true,
                    isFilterActive: true,
                    isPromoPage: true,
                    isScrollableToResults: false,
                }),
            ).toBe(0);
        });

        it('should return correct value when both isScreenLessMedium/isFilterActive is true and isPromoPage is false', () => {
            expect(
                getOffsetTop(mockBox, {
                    isScreenLessMedium: true,
                    isFilterActive: true,
                    isPromoPage: false,
                    isScrollableToResults: false,
                }),
            ).toBe(0);
        });

        it('should return correct value when both isScrollableToResults/isPromoPage is true', () => {
            expect(
                getOffsetTop(mockBox, {
                    isScreenLessMedium: false,
                    isScrollableToResults: true,
                    isPromoPage: true,
                    isFilterActive: false,
                }),
            ).toBe(0);
        });

        it('should return correct value when isScrollableToResults is true and isPromoPage is false', () => {
            expect(
                getOffsetTop(mockBox, {
                    isScreenLessMedium: false,
                    isScrollableToResults: true,
                    isPromoPage: false,
                    isFilterActive: false,
                }),
            ).toBe(-SEARCH_RESULTS_FILTERS_Y_OFFSET);
        });
    });

    describe('getIsScrollableToHotel', () => {
        it('should return true when every argument is suitable', () => {
            expect(
                getIsScrollableToHotel(
                    { current: {} } as RefObject<HTMLDivElement>,
                    3,
                    DataStatus.Loaded,
                    3,
                    DataStatus.Loading,
                ),
            ).toBe(true);
        });

        it('should return false when some argument is NOT suitable', () => {
            const element = { current: {} } as RefObject<HTMLDivElement>;

            expect(
                getIsScrollableToHotel({} as RefObject<HTMLDivElement>, 3, DataStatus.Loaded, 3, DataStatus.Loading),
            ).toBe(false);

            expect(getIsScrollableToHotel(element, 1, DataStatus.Loaded, 3, DataStatus.Loading)).toBe(false);

            expect(getIsScrollableToHotel(element, 3, DataStatus.Loaded, 1, DataStatus.Loading)).toBe(false);

            expect(getIsScrollableToHotel(element, -1, DataStatus.Loaded, 1, DataStatus.Loading)).toBe(false);

            expect(getIsScrollableToHotel(element, 3, DataStatus.Loaded, 3, DataStatus.NotLoaded)).toBe(false);

            expect(getIsScrollableToHotel(element, 3, DataStatus.Loading, 3, DataStatus.NotLoaded)).toBe(false);
        });
    });

    describe('getIsScrollableUpOrToResults', () => {
        let props;
        let prevProps;

        beforeEach(() => {
            props = {
                isFilterActive: false,
                filtersChanged: false,
                totalOffers: 10,
                isScreenLessMedium: true,
                isModalDisplayed: false,
                status: DataStatus.NotLoaded,
                pageNumberChanged: false,
            };

            prevProps = {
                prevIsModalDisplayed: false,
                prevStatus: DataStatus.NotLoaded,
            };
        });

        describe('mobile view', () => {
            it('should return correct value when isLoaded is false', () => {
                props.status = DataStatus.Loading;

                expect(getIsScrollableUpOrToResults(props, prevProps)).toStrictEqual({
                    isScrollableToResults: false,
                    isScrollableUpOrToResults: false,
                });

                props.status = DataStatus.Loaded;
                prevProps.prevStatus = DataStatus.NotLoaded;

                expect(getIsScrollableUpOrToResults(props, prevProps)).toStrictEqual({
                    isScrollableToResults: false,
                    isScrollableUpOrToResults: false,
                });
            });

            it('should return correct value when isModalDisplayed is false and isLoaded is true', () => {
                props.isModalDisplayed = false;
                props.status = DataStatus.Loaded;
                prevProps.prevStatus = DataStatus.Loading;

                expect(getIsScrollableUpOrToResults(props, prevProps)).toStrictEqual({
                    isScrollableToResults: false,
                    isScrollableUpOrToResults: true,
                });
            });

            it('should return correct value when pageNumberChanged is true', () => {
                props.isModalDisplayed = false;
                props.pageNumberChanged = true;
                props.status = DataStatus.Loaded;
                prevProps.prevStatus = DataStatus.Loading;

                expect(getIsScrollableUpOrToResults(props, prevProps)).toStrictEqual({
                    isScrollableToResults: false,
                    isScrollableUpOrToResults: true,
                });
            });

            it('should return correct value when isModalDisplayed is false and isFilterChanged is true', () => {
                props.isModalDisplayed = false;
                props.filtersChanges = true;
                prevProps.prevIsModalDisplayed = true;

                props.status = DataStatus.Loading;
                prevProps.prevStatus = DataStatus.Loading;

                expect(getIsScrollableUpOrToResults(props, prevProps)).toStrictEqual({
                    isScrollableToResults: false,
                    isScrollableUpOrToResults: false,
                });
            });
        });

        describe('desktop view', () => {
            beforeEach(() => {
                props.isScreenLessMedium = true;
            });

            it('should return correct value when isModalDisplayed is false', () => {
                props.filtersChanges = false;

                props.status = DataStatus.Loaded;
                prevProps.prevStatus = DataStatus.Loading;

                expect(getIsScrollableUpOrToResults(props, prevProps)).toStrictEqual({
                    isScrollableToResults: false,
                    isScrollableUpOrToResults: true,
                });
            });

            it('should return correct value when totalOffers is 3', () => {
                props.totalOffers = 3;

                props.status = DataStatus.Loaded;
                prevProps.prevStatus = DataStatus.Loading;

                expect(getIsScrollableUpOrToResults(props, prevProps)).toStrictEqual({
                    isScrollableToResults: true,
                    isScrollableUpOrToResults: true,
                });
            });

            it('should return correct value when pageNumberChanged is true', () => {
                props.pageNumberChanged = true;
                props.isScreenLessMedium = false;

                props.status = DataStatus.Loaded;
                prevProps.prevStatus = DataStatus.Loading;

                expect(getIsScrollableUpOrToResults(props, prevProps)).toStrictEqual({
                    isScrollableToResults: true,
                    isScrollableUpOrToResults: true,
                });
            });

            it('should return correct value when isFilterActive is true and filtersChanged is false', () => {
                props.isFilterActive = true;
                props.filtersChanged = false;

                props.status = DataStatus.Loaded;
                prevProps.prevStatus = DataStatus.Loading;

                expect(getIsScrollableUpOrToResults(props, prevProps)).toStrictEqual({
                    isScrollableToResults: true,
                    isScrollableUpOrToResults: true,
                });
            });

            it('should return correct value when isFilterActive is true and filtersChanged is false', () => {
                props.isFilterActive = false;
                props.filtersChanged = false;

                props.status = DataStatus.Loaded;
                prevProps.prevStatus = DataStatus.Loading;

                expect(getIsScrollableUpOrToResults(props, prevProps)).toStrictEqual({
                    isScrollableToResults: false,
                    isScrollableUpOrToResults: true,
                });
            });
        });
    });

    describe('scrollHandler', () => {
        it('should call scrollIntoViewIfNeeded when isScrollableToHotel is true', async () => {
            const setSelectedOfferIndex = jest.fn();

            const props = {
                ...baseProps,
                selectedOfferIndex: 1,
                status: DataStatus.Loaded,
                setSelectedOfferIndex,
            };

            const prevProps = {
                ...baseProps,
                selectedOfferIndex: 1,
                status: DataStatus.Loading,
            };

            scrollHandler(
                { current: {} } as RefObject<HTMLDivElement>,
                {
                    ...props,
                    searchResultBoxRef: mockBox,
                },
                {
                    prevIsModalDisplayed: prevProps.isModalDisplayed,
                    prevSelectedOfferIndex: prevProps.selectedOfferIndex,
                    prevStatus: prevProps.status,
                },
            );

            await waitFor(() =>
                expect(scrollIntoViewIfNeeded).toHaveBeenCalledWith({}, { behavior: 'smooth', block: 'center' }),
            );

            expect(setSelectedOfferIndex).toHaveBeenCalledWith(-1);
        });

        it('should call scrollTo when isScrollableUpOrToResults is true', async () => {
            window.scrollTo = jest.fn();

            const ctx = {};
            const onChangeSearchFilterStore = jest.fn(({ cb }) => cb(ctx));

            const props = {
                ...baseProps,
                selectedOfferIndex: 2,
                status: DataStatus.Loaded,
                onChangeSearchFilterStore,
            };

            const prevProps = {
                ...baseProps,
                selectedOfferIndex: 1,
                status: DataStatus.Loading,
            };

            scrollHandler(
                { current: {} } as RefObject<HTMLDivElement>,
                {
                    ...props,
                    searchResultBoxRef: mockBox,
                },
                {
                    prevIsModalDisplayed: prevProps.isModalDisplayed,
                    prevSelectedOfferIndex: prevProps.selectedOfferIndex,
                    prevStatus: prevProps.status,
                },
            );

            await waitFor(() => {
                expect(window.scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: 0 });
                expect(onChangeSearchFilterStore).toHaveBeenCalledWith({ cb: expect.any(Function) });

                expect(ctx).toStrictEqual({
                    filtersChanged: false,
                    pageNumberChanged: false,
                });
            });
        });

        it('should call neither scrollTo nor scrollIntoViewIfNeeded when both isScrollableToHotel/isScrollableUpOrToResults is false', async () => {
            window.scrollTo = jest.fn();

            const ctx = {};
            const onChangeSearchFilterStore = jest.fn(({ cb }) => cb(ctx));

            const setSelectedOfferIndex = jest.fn();

            const props = {
                ...baseProps,
                selectedOfferIndex: 2,
                status: DataStatus.NotLoaded,
                onChangeSearchFilterStore,
                setSelectedOfferIndex,
            };

            const prevProps = {
                ...baseProps,
                selectedOfferIndex: 1,
                status: DataStatus.NotLoaded,
            };

            scrollHandler(
                { current: {} } as RefObject<HTMLDivElement>,
                {
                    ...props,
                    searchResultBoxRef: mockBox,
                },
                {
                    prevIsModalDisplayed: prevProps.isModalDisplayed,
                    prevSelectedOfferIndex: prevProps.selectedOfferIndex,
                    prevStatus: prevProps.status,
                },
            );

            await waitFor(() => {
                expect(scrollIntoViewIfNeeded).not.toHaveBeenCalled();
                expect(window.scrollTo).not.toHaveBeenCalled();
            });

            expect(onChangeSearchFilterStore).not.toHaveBeenCalled();
            expect(ctx).toStrictEqual({});
        });
    });

    describe('getPromoPageMobileOffset', () => {
        it('should return 0 when SP_FILTERS_WRAPPER_DATA_TID element do NOT exists', () => {
            expect(getPromoPageMobileOffset()).toBe(0);
        });

        it('should return SP_FILTERS_WRAPPER_DATA_TID offsetHeight', () => {
            mockQuerySelector.mockReturnValue({ offsetHeight: 100 } as HTMLDivElement);

            expect(getPromoPageMobileOffset()).toBe(100);
        });
    });

    describe('scrollToPrevLoadPage', () => {
        getElementsByClassName.mockImplementationOnce(() => [mockElement, mockElement, mockElement]);

        it('should call scrollIntoView when element exists', () => {
            utils.scrollToPrevLoadPage(2);

            expect(mockScrollIntoView).toHaveBeenCalled();
        });

        it('should NOT call scrollIntoView when element does NOT exist', () => {
            utils.scrollToPrevLoadPage(10);

            expect(mockScrollIntoView).not.toHaveBeenCalled();
        });
    });
});
