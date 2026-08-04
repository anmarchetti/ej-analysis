import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { DataStatus } from 'models/enum/DataStatus';
import { EventActions } from 'models/enum/tracking/GenericEventParams';

import useSearchResultMap, { TSearchResultsMapProps } from './SearchResultsMap.utils';

const mockUseState = jest.fn(init => [init, jest.fn()]);
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useState: init => mockUseState(init),
}));

const createProps = (): TSearchResultsMapProps => ({
    fields: {
        IsSearchResultsMapButtonDisabled: mockSitecoreField(false),
        MapImage: mockSitecoreField({ src: 'map-image' }),
        MobileButton: mockSitecoreField('mobile-button'),
        DesktopButton: mockSitecoreField('desktop-button'),
    } as any,
    params: {} as any,
    rendering: {},
});

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

let mockProps: TSearchResultsMapProps;
let mockStores;

describe('useSearchResultMap', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            searchStore: { setIsSelectedPackageFromMap: jest.fn() },
            hotelsStore: {
                getFilteredHotels: jest.fn(),
                status: DataStatus.Loading,
                cleanUpHotels: jest.fn(),
            },
            appStore: {
                breakpoint: 1920,
            },
            searchFiltersStore: { isFiltersLoaded: true },
            queryParamStore: { isMap: false, updateMapInQuery: jest.fn() },
        });
        mockUseMobileViewport = false;
    });

    it('should call getFilteredHotels when isPopupShown is true', () => {
        mockStores.queryParamStore.isMap = true;

        renderHook(() => useSearchResultMap(mockProps));

        expect(mockStores.queryParamStore.updateMapInQuery).toHaveBeenCalledWith(true);
        expect(mockStores.hotelsStore.getFilteredHotels).toHaveBeenCalledTimes(1);
    });

    it('should call setIsSelectedPackageFromMap on unmount', () => {
        const { unmount } = renderHook(() => useSearchResultMap(mockProps));

        unmount();

        expect(mockStores.hotelsStore.cleanUpHotels).toHaveBeenCalled();
        expect(mockStores.searchStore.setIsSelectedPackageFromMap).toHaveBeenCalledWith(false);
    });

    describe('isDisplayed', () => {
        it('should be true when IsSearchResultsMapButtonDisabled is false, isAdvanced is false and breakpoint is less 1919', () => {
            mockStores.appStore.breakpoint = 1918;

            const { result } = renderHook(() => useSearchResultMap(mockProps));

            expect(result.current.isDisplayed).toBe(true);
        });

        it('should be true when IsSearchResultsMapButtonDisabled is false and breakpoint is greater/equal 1919', () => {
            mockStores.appStore.breakpoint = 1919;

            const { result } = renderHook(() => useSearchResultMap(mockProps));

            expect(result.current.isDisplayed).toBe(true);
        });

        it('should be false when IsSearchResultsMapButtonDisabled is true', () => {
            mockProps.fields!.IsSearchResultsMapButtonDisabled.value = true;

            const { result } = renderHook(() => useSearchResultMap(mockProps));

            expect(result.current.isDisplayed).toBe(false);
        });
    });

    describe('iconWrapperStyle', () => {
        it('should be empty when MapImage is empty and isMobile is true', () => {
            mockUseMobileViewport = true;
            mockProps.fields!.MapImage.value.src = '';

            const { result } = renderHook(() => useSearchResultMap(mockProps));

            expect(result.current.iconWrapperStyle).toStrictEqual({});
        });

        it('should contain backgroundImage when isMobile is false and MapImage is NOT empty', () => {
            const { result } = renderHook(() => useSearchResultMap(mockProps));

            expect(result.current.iconWrapperStyle).toStrictEqual({ backgroundImage: 'url(map-image)' });
        });
    });

    describe('button', () => {
        it('should contain MobileButton title when isMobile is true', () => {
            mockUseMobileViewport = true;

            const { result } = renderHook(() => useSearchResultMap(mockProps));

            expect(result.current.button).toStrictEqual({
                isText: true,
                isOutlined: false,
                onClick: expect.any(Function),
                title: mockProps.fields!.MobileButton,
            });
        });

        it('should contain DesktopButton title when isMobile is false', () => {
            const { result } = renderHook(() => useSearchResultMap(mockProps));

            expect(result.current.button).toStrictEqual({
                isText: false,
                isOutlined: true,
                onClick: expect.any(Function),
                title: mockProps.fields!.DesktopButton,
            });
        });
    });

    it('popup should contain truth isMapPopupShown when both isShownPopup is true', () => {
        mockStores.queryParamStore.isMap = true;

        const { result } = renderHook(() => useSearchResultMap(mockProps));

        expect(result.current.popup).toStrictEqual({
            isMapPopupShown: true,
            onCloseMapPopup: expect.any(Function),
        });
    });

    describe('isLoading', () => {
        it('should be true when isLoadingStatus is true and isFiltersLoaded is false', () => {
            mockStores.searchFiltersStore.isFiltersLoaded = false;

            const { result } = renderHook(() => useSearchResultMap(mockProps));

            expect(result.current.isLoading).toBe(true);
        });

        it('should be false when isFiltersLoaded is true', () => {
            const { result } = renderHook(() => useSearchResultMap(mockProps));

            expect(result.current.isLoading).toBe(false);
        });

        it('should be false when isLoadingStatus is false', () => {
            mockStores.searchFiltersStore.isFiltersLoaded = false;
            mockStores.hotelsStore.status = DataStatus.Loaded;

            const { result } = renderHook(() => useSearchResultMap(mockProps));

            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('popup.onCloseMapPopup', () => {
        it('should close popup and call trackMapEvent on click', () => {
            const setIsPopupShown = jest.fn();
            mockUseState.mockReturnValueOnce([true, setIsPopupShown]);
            mockStores.trackingStore.trackMapEvent = jest.fn();
            const ctx = { rootStore: { hotelsStore: { defaultLoadResults: jest.fn() } } };
            mockStores.searchFiltersStore.onChangeSearchFilterStore = jest.fn(({ cb }) => cb?.(ctx));

            const { result } = renderHook(() => useSearchResultMap(mockProps));

            result.current.popup.onCloseMapPopup();

            expect(setIsPopupShown).toHaveBeenCalledWith(false);
            expect(mockStores.trackingStore.trackMapEvent).toHaveBeenCalledWith({ action: EventActions.CloseMapClick });
            expect(mockStores.searchFiltersStore.onChangeSearchFilterStore).toHaveBeenCalledWith({
                cb: expect.any(Function),
            });
            expect(ctx.rootStore.hotelsStore.defaultLoadResults).toHaveBeenCalledTimes(1);
            expect(ctx).toStrictEqual(
                expect.objectContaining({
                    isFiltersLoaded: false,
                    isMapModalDisplayed: false,
                }),
            );
        });
    });
});
