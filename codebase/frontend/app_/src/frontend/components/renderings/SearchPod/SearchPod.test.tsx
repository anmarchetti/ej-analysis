import React from 'react';
import { screen } from '@testing-library/dom';
import { render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { useMoreThenMobileViewport } from 'frontend/hooks/useMediaQuery';
import { isTradeStore } from 'frontend/store/tradePortal';
import SearchPodAlternativeView from 'models/enum/SearchPodAlternativeView';
import { IAirportCountry } from 'models/sitecore/IAirportsData';
import useExperiment from 'frontend/components/cro/Experiment/hooks/useExperiment';

import { ISearchPodDataFields } from './models';
import SearchPod, { BIG_OFFSET, ISearchPodProps } from './SearchPod';

jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: jest.fn(() => false),
}));

const mockedStickyBoxProps = jest.fn();
jest.mock('frontend/components/common/StickyBox', () => ({
    __esModule: true,
    default: ({ render, offsetCompensation, dynamicHeight }) => {
        mockedStickyBoxProps({ offsetCompensation, dynamicHeight });

        return <div data-tid='sticky-box'>{render()}</div>;
    },
}));

jest.mock('frontend/components/renderings/SearchPod/components/StickyBoxDynamicHeight/StickyBoxDynamicHeight', () => ({
    __esModule: true,
    default: ({ render }) => <div data-tid='sticky-box-new'>{render()}</div>,
}));

jest.mock('./components/SearchPodInner/SearchPodInner', () => ({
    __esModule: true,
    default: () => <div data-tid='search-pod-inner' />,
}));

const mockUseClearOnUnmount = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/hooks/useClearOnUnmount', () => ({
    __esModule: true,
    default: props => mockUseClearOnUnmount(props),
}));

const mockUsePrefillSearchPod = jest.fn();
jest.mock('frontend/components/renderings/SearchPod/hooks/usePrefillSearchPod/usePrefillSearchPod', () => ({
    __esModule: true,
    default: props => mockUsePrefillSearchPod(props),
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenMobileViewport: jest.fn(),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/cro/Experiment/hooks/useExperiment');

const resetMocks = (): ISearchPodProps => ({
    fields: {
        airportsGroups: [
            {
                code: 'LGW',
            } as IAirportCountry,
        ],
        data: {} as ISearchPodDataFields,
    },
    params: {
        RedirectToSearchResults: false,
        AlternativeView: SearchPodAlternativeView.SummarisedView,
        IsSticky: false,
        ShowTitle: undefined,
    },
    rendering: null,
});

let props;
let mockStores;
const originalDocument = global.document;

describe('<SearchPod />', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.mocked(useMoreThenMobileViewport).mockReturnValue(true);
        props = resetMocks();
        mockStores = createMockStores({
            searchStore: {
                clearOldSearchParam: jest.fn(),
                clearSearchValues: jest.fn(),
                getValuesFromQueryParamsStore: jest.fn(),
                prefillSearchParams: jest.fn(),
                searchFrom: {
                    setCountries: jest.fn(),
                    updateAvailableOrigins: jest.fn(),
                    updateOriginsDisplayValue: jest.fn(),
                    setAllAvailableOrigins: jest.fn(),
                },
                searchTo: {
                    loadAllDestinations: jest.fn(),
                    syncDestinationItems: jest.fn(),
                    updateAvailableDstCodes: jest.fn(),
                    getTypeAheadDestinations: jest.fn(),
                    changeDestinations: jest.fn(),
                    selectSingleDestination: jest.fn(),
                    updateDestinationsDisplayValue: jest.fn(),
                },
                searchWhen: {
                    from: null,
                    to: null,
                    setIsMonthSearch: jest.fn(),
                    setMonthSearchDuration: jest.fn(),
                    monthSearchDuration: 10,
                    updateAvailableDates: jest.fn(),
                    monthsAvailability: [true, false, true],
                    defaultSearchPodMonthSearchDuration: 7,
                },
            },
            searchFiltersStore: {
                clearFilterStoreValues: jest.fn(),
            },
            layoutStore: {
                isDestinationPage: false,
                isHomePage: true,
                isHotelDetailsBookPage: false,
                isHotelDetailsBookPagePrev: false,
                isSearchResultsPage: false,
                isPromoPagePrev: false,
                isHolidayTypePage: false,
                pageName: 'pageName',
                prevTemplateId: undefined,
                prevPath: '/',
                currentPath: '/',
                destinationCode: 'destinationCode',
                giataHotelCode: 'giataHotelCode',
                prevGiataHotelCode: 'prevGiataHotelCode',
                isDestinationPagePrev: false,
                isHotelDetailsBrowsePage: false,
                allAccommodationCodes: [],
                prevDestinationCode: undefined,
            },
            queryParamStore: {
                parseBrowserQuery: jest.fn(),
                monthSearchDurationFromUrl: 0,
                isPromotingIframe: false,
                isReferer: false,
            },
            bookingStore: {
                grabSearchValuesFromSearchStore: jest.fn(),
                origins: [],
                updateSearchDates: jest.fn(),
                updateSearchOrigins: jest.fn(),
            },
            hotelsStore: {
                fetchOffers: jest.fn(),
                getSearchParamsFromLocalStorage: jest.fn(),
                updateOffersDataStatus: jest.fn(),
            },
            rootStore: {
                syncUrlParamsWithStores: jest.fn(),
            },
            routerStore: {
                hasPromo: false,
            },
            inspireMeStore: {
                quizResults: [
                    {
                        code: 'ESBA',
                        name: 'Barcelona',
                        description: 'description',
                        imageUrl: 'imageUrl',
                        url: 'url',
                    },
                ],
            },
            trackingStore: {
                searchPod: {
                    trackSearchPodMounting: jest.fn(),
                },
            },
        });

        jest.mocked(useExperiment).mockReturnValue(undefined);
    });

    afterEach(() => {
        global.document = originalDocument;
    });

    it('Should NOT render StickyBox and SearchPodInner if there are no fields', () => {
        props.fields = null;
        render(<SearchPod {...props} />);

        expect(screen.queryByTestId('sticky-box')).not.toBeInTheDocument();
        expect(screen.queryByTestId('search-pod-inner')).not.toBeInTheDocument();
    });

    it('Should standard render', () => {
        const mockVariant = { testVariant: 'testVariant', testId: 'testId' };
        jest.mocked(useExperiment).mockReturnValue(mockVariant);

        render(<SearchPod {...props} />);

        expect(screen.queryByTestId('sticky-box')).not.toBeInTheDocument();
        expect(screen.getByTestId('search-pod-inner')).toBeInTheDocument();
        expect(mockStores.hotelsStore.updateOffersDataStatus).not.toHaveBeenCalled();

        expect(useExperiment).toHaveBeenCalledWith('EJHEXP-2416');
        expect(mockStores.layoutStore.setWhenDropdownExperimentTestVariant).toHaveBeenCalledWith('testVariant');
    });

    it('Should sticky render', () => {
        props.params.IsSticky = true;
        render(<SearchPod {...props} />);

        expect(screen.getByTestId('sticky-box-new')).toBeInTheDocument();
    });

    describe('StickyBox', () => {
        it('should render StickyBox with offsetCompensation if isFloating is true and not backend', () => {
            const mockedOffsetTop = 100;
            props.isFloating = true;

            document.getElementById = jest.fn().mockReturnValue({ offsetTop: mockedOffsetTop });

            render(<SearchPod {...props} />);

            expect(screen.getByTestId('sticky-box')).toBeInTheDocument();
            expect(screen.getByTestId('search-pod-inner')).toBeInTheDocument();
            expect(mockedStickyBoxProps).toHaveBeenCalledWith({ offsetCompensation: mockedOffsetTop });
        });

        it('should render StickyBox with big offset if element is not found', () => {
            document.getElementById = jest.fn().mockReturnValue(null);
            props.isFloating = true;
            props.params.ShowTitle = true;

            render(<SearchPod {...props} />);

            expect(screen.getByTestId('sticky-box')).toBeInTheDocument();
            expect(screen.getByTestId('search-pod-inner')).toBeInTheDocument();
            expect(mockedStickyBoxProps).toHaveBeenCalledWith({ offsetCompensation: BIG_OFFSET });
        });

        it('should render StickyBox without offset if element is not found', () => {
            document.getElementById = jest.fn().mockReturnValue(null);
            props.isFloating = true;
            props.params.ShowTitle = true;
            jest.mocked(useMoreThenMobileViewport).mockReturnValue(false);
            props.isParentWrapper = false;

            render(<SearchPod {...props} />);

            expect(screen.getByTestId('sticky-box')).toBeInTheDocument();
            expect(screen.getByTestId('search-pod-inner')).toBeInTheDocument();
            expect(mockedStickyBoxProps).toHaveBeenCalledWith({ offsetCompensation: 0 });
        });

        it('should render StickyBox with small offset if element is not found and on mobile viewport', () => {
            document.getElementById = jest.fn().mockReturnValue(null);
            props.isFloating = true;
            props.params.ShowTitle = true;
            jest.mocked(useMoreThenMobileViewport).mockReturnValue(false);
            props.isParentWrapper = true;

            render(<SearchPod {...props} />);

            expect(screen.getByTestId('sticky-box')).toBeInTheDocument();
            expect(screen.getByTestId('search-pod-inner')).toBeInTheDocument();
            expect(mockedStickyBoxProps).toHaveBeenCalledWith({ offsetCompensation: 1 });
        });

        it('should render StickyBoxDynamicHeight if isFloating is true', () => {
            props.params.IsSticky = true;

            render(<SearchPod {...props} />);

            expect(screen.getByTestId('sticky-box-new')).toBeInTheDocument();
            expect(screen.getByTestId('search-pod-inner')).toBeInTheDocument();
        });
    });

    describe('Hooks', () => {
        it('should call UseClearOnUnmount hook with expected props', () => {
            render(<SearchPod {...props} />);

            expect(mockUseClearOnUnmount).toHaveBeenCalledWith(
                expect.objectContaining({
                    shouldSkipEffect: false,
                    isDestinationPage: mockStores.layoutStore.isDestinationPage,
                    clearOldSearchParam: mockStores.searchStore.clearOldSearchParam,
                    clearSearchValues: mockStores.searchStore.clearSearchValues,
                    clearFilterStoreValues: mockStores.searchFiltersStore.clearFilterStoreValues,
                }),
            );
        });

        it('should call usePrefillOnDestinationAndHotelDetailsBrowsePage hook with expected props', () => {
            render(<SearchPod {...props} />);

            expect(mockUsePrefillSearchPod).toHaveBeenCalledWith(
                expect.objectContaining({
                    shouldSkipEffect: false,
                    setAllAvailableOrigins: mockStores.searchStore.searchFrom.setAllAvailableOrigins,
                    getTypeAheadDestinations: mockStores.searchStore.searchTo.getTypeAheadDestinations,
                    changeDestinations: mockStores.searchStore.searchTo.changeDestinations,
                    selectSingleDestination: mockStores.searchStore.searchTo.selectSingleDestination,
                    destinationCode: mockStores.layoutStore.destinationCode,
                    giataHotelCode: mockStores.layoutStore.giataHotelCode,
                    isDestinationPagePrev: mockStores.layoutStore.isDestinationPagePrev,
                    isHotelDetailsBrowsePage: mockStores.layoutStore.isHotelDetailsBrowsePage,
                    allAccommodationCodes: mockStores.layoutStore.allAccommodationCodes,
                    isPromotingIframe: mockStores.queryParamStore.isPromotingIframe,
                    prevDestinationCode: mockStores.layoutStore.prevDestinationCode,
                    prevGiataHotelCode: mockStores.layoutStore.prevGiataHotelCode,
                }),
            );
        });

        it('should pass null for quizResults when isTradeStore = true', () => {
            jest.mocked(isTradeStore).mockReturnValue(true);

            render(<SearchPod {...props} />);

            expect(mockUsePrefillSearchPod).toHaveBeenCalledWith(
                expect.objectContaining({
                    quizResults: null,
                }),
            );
        });
    });
});
