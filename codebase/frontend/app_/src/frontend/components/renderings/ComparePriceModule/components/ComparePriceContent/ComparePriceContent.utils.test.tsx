import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { comparePriceFieldsMock } from 'frontend/__mocks__/comparePrice';
import {
    FreeForKidsChangeState,
    NewOfferState,
} from 'frontend/store/base/comparePricesCalendar/ComparePricesCalendarStore';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import ComparePriceModuleContentType from 'models/enum/ComparePriceModuleContentType';
import ComparePriceModuleVariant from 'models/enum/ComparePriceModuleVariant';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import * as priceGraphUtils from 'frontend/components/common/PriceGraph/priceGraphUtils';

import useComparePriceContent, { IComparePriceContentProps } from './ComparePriceContent.utils';

const mockUseState = jest.fn(init => [init, jest.fn()]);
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useState: init => mockUseState(init),
}));

const createProps = (): IComparePriceContentProps => ({
    holidayDuration: 6,
    isResetingSelectedOffer: false,
    onClose: jest.fn(),
    resetSelectedOffer: jest.fn(({ handleError }) => handleError && handleError()),
    selectedDate: new Date(),
    fields: {
        ...comparePriceFieldsMock,
        Variant: mockSitecoreField(ComparePriceModuleVariant.CalendarFirstVariant),
    },
    params: {},
    rendering: {},
});

jest.spyOn(priceGraphUtils, 'getHolidayDates').mockReturnValue({
    departure: 'departure-date',
    return: 'return-date',
});

jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));

let props;
let mockStores;

describe('useComparePricePreparedData', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            priceGraphStore: {
                isMobileView: false,
                middleDate: new Date(),
                resetToInitial: jest.fn(),
                clearAlternativeOffers: jest.fn(),
                alternativeOffers: [],
                loadAlternativeOffers: jest.fn(),
            },
            comparePricesCalendarStore: {
                alternativeOffersMap: new Map([['a', {}]]),
                resetToInitial: jest.fn(),
                changesRequired: jest.fn(() => true),
                freeForKidsChangeState: jest.fn(() => FreeForKidsChangeState.Stable),
                getAlternativeAndSelectedOffersInfo: jest.fn(() => ({
                    offer: {},
                    items: [],
                })),
                getBoardAlteration: jest.fn(() => []),
                getRoomAlterations: jest.fn(() => []),
                getAlternativeOfferPrice: jest.fn(() => 10),
                setNewOfferState: jest.fn(),
                newOfferState: NewOfferState.Accepted,
                loadAlternativeOffers: jest.fn(),
            },
            queryParamStore: {
                offerRoomsAllocationFromUrl: [
                    {
                        adults: 2,
                        children: 0,
                        childrenAges: [],
                        infants: 0,
                        roomCode: 'TEST',
                    },
                ],
            },
            searchStore: {
                searchWho: {
                    childrenQuantity: 1,
                },
            },
            layoutStore: {
                isTouristTaxEnabled: true,
            },
        });
    });

    it('should return correct data when variant is NOT nothing', () => {
        const { result, unmount } = renderHook(() => useComparePriceContent(props));

        expect(result.current.isMobileView).toBe(mockStores.priceGraphStore.isMobileView);
        expect(result.current.popupProps).toStrictEqual({
            fullWidth: true,
            onClose: props.onClose,
        });

        expect(result.current.tabsProps).toStrictEqual({
            onChange: expect.any(Function),
            tabs: [
                {
                    content: expect.anything(),
                    key: ComparePriceModuleContentType.Calendar,
                    title: expect.anything(),
                },
                {
                    content: expect.anything(),
                    key: ComparePriceModuleContentType.Graph,
                    title: expect.anything(),
                },
            ],
        });

        expect(result.current.footerProps).toStrictEqual({
            isCancelTransparent: true,
            onCancel: props.onClose,
            isDisabled: true,
            disabled: true,
            onClick: expect.any(Function),
            getPhrase: mockStores.layoutStore.getPhrase,
            confirmButtonText: SitecoreDictionary.PriceGraphButtonsReview,
        });

        unmount();

        expect(mockStores.priceGraphStore.resetToInitial).toHaveBeenCalled();
        expect(mockStores.priceGraphStore.clearAlternativeOffers).toHaveBeenCalled();
        expect(mockStores.comparePricesCalendarStore.resetToInitial).toHaveBeenCalled();
    });

    it('should NOT return full data when variant is nothing', () => {
        props.fields.Variant = mockSitecoreField(ComparePriceModuleVariant.NothingVariant);
        const { result } = renderHook(() => useComparePriceContent(props));

        expect(result.current.isMobileView).toBe(mockStores.priceGraphStore.isMobileView);
        expect(result.current.popupProps).toBe(undefined);
        expect(result.current.tabsProps).toBe(undefined);
        expect(result.current.footerProps).toBe(undefined);
        expect(result.current.isReviewPopupOpened).toBe(false);
        expect(result.current.hideFreeChildPlaceInfoBox).toBe(true);
        expect(result.current.newTotalPrice).toBe(0);
    });

    it('should NOT return full data when fields are NOT provided', () => {
        props.fields.Variant = undefined;
        props.fields.IsBestValueEnabled = undefined;
        props.fields.BackButtonText = undefined;

        const { result } = renderHook(() => useComparePriceContent(props));

        expect(result.current.isMobileView).toBe(mockStores.priceGraphStore.isMobileView);
        expect(result.current.popupProps).toBe(undefined);
        expect(result.current.tabsProps).toBe(undefined);
        expect(result.current.footerProps).toBe(undefined);
        expect(result.current.isReviewPopupOpened).toBe(false);
        expect(result.current.hideFreeChildPlaceInfoBox).toBe(true);
        expect(result.current.newTotalPrice).toBe(0);
        expect(result.current.backButtonText).toBe('');
    });

    it('popupProps.onClose: onClose should be called', () => {
        const {
            result: {
                current: { popupProps },
            },
        } = renderHook(() => useComparePriceContent(props));

        popupProps?.onClose();

        expect(props.onClose).toHaveBeenCalled();
    });

    it('footerProps.onCancel: onClose should be called', () => {
        const {
            result: {
                current: { footerProps },
            },
        } = renderHook(() => useComparePriceContent(props));

        footerProps?.onCancel();

        expect(props.onClose).toHaveBeenCalled();
    });

    it('onReviewPopupClose: should call setIsReviewPopupOpened with false', () => {
        const setIsReviewPopupOpened = jest.fn();

        mockUseState
            .mockReturnValueOnce([new Date(), jest.fn()])
            .mockReturnValueOnce([ComparePriceModuleContentType.Graph, jest.fn()])
            .mockReturnValueOnce([false, setIsReviewPopupOpened]);

        const { result } = renderHook(() => useComparePriceContent(props));

        result.current.onReviewPopupClose && result.current.onReviewPopupClose();

        expect(setIsReviewPopupOpened).toHaveBeenCalledWith(false);
    });

    describe('confirmButtonProps.onClick', () => {
        it('should call resetSelectedOffer and onClose when changesRequired returns false', () => {
            mockStores.comparePricesCalendarStore.changesRequired.mockReturnValue(false);

            const {
                result: {
                    current: { footerProps },
                },
            } = renderHook(() => useComparePriceContent(props));

            footerProps?.onClick();

            expect(props.resetSelectedOffer).toHaveBeenCalledWith({
                newDate: new Date(),
                board: undefined,
                rooms: mockStores.queryParamStore.offerRoomsAllocationFromUrl,
                inboundRouteId: undefined,
                outboundRouteId: undefined,
                handleError: expect.any(Function),
            });
            expect(props.onClose).toHaveBeenCalled();
            expect(mockStores.comparePricesCalendarStore.setNewOfferState).toHaveBeenCalledWith(NewOfferState.Error);
        });

        it('should change room codes in rooms when rooms have different codes than in offerRoomsAllocationFromUrl', () => {
            mockStores.comparePricesCalendarStore.changesRequired.mockReturnValue(false);
            const activeDate = new Date();
            mockStores.comparePricesCalendarStore.alternativeOffersMap = new Map([
                [
                    activeDate.getTime(),
                    {
                        rooms: [
                            {
                                roomCode: 'TEST2',
                            },
                        ],
                        boardType: {
                            code: 'HB',
                        },
                        inboundRouteId: '1',
                        outboundRouteId: '2',
                    },
                ],
            ]);

            mockUseState.mockReturnValueOnce([activeDate, jest.fn()]);

            const {
                result: {
                    current: { footerProps },
                },
            } = renderHook(() => useComparePriceContent(props));

            footerProps?.onClick();

            expect(props.resetSelectedOffer).toHaveBeenCalledWith({
                newDate: new Date(),
                board: 'HB',
                rooms: [{ adults: 2, children: 0, childrenAges: [], infants: 0, roomCode: 'TEST2' }],
                inboundRouteId: '1',
                outboundRouteId: '2',
                handleError: expect.any(Function),
            });
            expect(mockStores.comparePricesCalendarStore.setNewOfferState).toHaveBeenCalledWith(NewOfferState.Error);
        });

        it('should NOT call resetSelectedOffer and onClose when changesRequired returns true', () => {
            const {
                result: {
                    current: { footerProps },
                },
            } = renderHook(() => useComparePriceContent(props));

            footerProps?.onClick();

            expect(props.resetSelectedOffer).not.toHaveBeenCalled();
            expect(props.onClose).not.toHaveBeenCalled();
        });
    });

    it('should return LoseFreeChildPlaceTitle and GainFreeChildPlaceSubtitle when freeChildStatus is removed', () => {
        mockStores.comparePricesCalendarStore.freeForKidsChangeState.mockReturnValue(FreeForKidsChangeState.Removed);

        const {
            result: {
                current: { freeChildPlaceInfoTitle, freeChildPlaceInfoText },
            },
        } = renderHook(() => useComparePriceContent(props));

        expect(freeChildPlaceInfoTitle).toBe(props.fields.LoseFreeChildPlaceTitle);
        expect(freeChildPlaceInfoText).toBe(props.fields.LoseFreeChildPlaceSubtitle);
    });

    describe('tabsProps', () => {
        it('onChange call setActiveTab/setActiveDate', () => {
            const setActiveDate = jest.fn();
            const setActiveTab = jest.fn();

            mockUseState
                .mockReturnValueOnce([new Date(), setActiveDate])
                .mockReturnValueOnce([ComparePriceModuleContentType.Graph, setActiveTab])
                .mockReturnValueOnce([false, jest.fn()]);

            const {
                result: {
                    current: { tabsProps },
                },
            } = renderHook(() => useComparePriceContent(props));

            tabsProps?.onChange(ComparePriceModuleContentType.Graph);

            expect(setActiveTab).toHaveBeenCalledWith(ComparePriceModuleContentType.Graph);
            expect(setActiveDate).toHaveBeenCalledWith(new Date());
        });

        it('tabs should contain graph only when variant is PriceGraphOnlyVariant', () => {
            props.fields.Variant = mockSitecoreField(ComparePriceModuleVariant.PriceGraphOnlyVariant);

            const { result } = renderHook(() => useComparePriceContent(props));

            expect(result.current.tabsProps?.tabs).toHaveLength(1);
        });

        it('tabs should contain calendar only when variant is CalendarOnlyVariant', () => {
            props.fields.Variant = mockSitecoreField(ComparePriceModuleVariant.CalendarOnlyVariant);

            const {
                result: {
                    current: { tabsProps },
                },
            } = renderHook(() => useComparePriceContent(props));

            expect(tabsProps?.tabs).toHaveLength(1);
        });
    });
});
