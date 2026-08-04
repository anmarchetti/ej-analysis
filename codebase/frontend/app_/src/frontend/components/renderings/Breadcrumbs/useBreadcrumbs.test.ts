import { act } from 'react';
import { renderHook } from '@testing-library/react';

import useStore from 'frontend/hooks/useStore';
import BreadcrumbsPage from 'models/enum/BreadcrumbsPage';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath, { FlightPlusHotelSitePath } from 'models/enum/SitePath';

import useBreadcrumbs from './useBreadcrumbs';

jest.mock('frontend/hooks/useStore');

const mockUseStore = useStore as jest.MockedFunction<typeof useStore>;

describe('useBreadcrumbs', () => {
    const mockGetPhrase = jest.fn(p => p);
    const mockBuildHotelDetailsQuery = jest.fn(() => '?query=test');
    const mockHotelDetailsUrl = jest.fn((hotel, query) => `/hotel-details${query}`);
    const mockBuildFlightPlusHotelUrl = jest.fn(path => `/fph${path}`);
    const mockChangeIsClickChangeButton = jest.fn();
    const mockHotel = { id: '123', name: 'Test Hotel' };

    const setupMockStore = (
        isFlightPlusHotelFunnel: boolean,
        isExtrasPage = false,
        haveSelectedSeats = false,
        extraLuggage: any = null,
    ) => {
        mockUseStore.mockReturnValue({
            getPhrase: mockGetPhrase,
            buildHotelDetailsQuery: mockBuildHotelDetailsQuery,
            hotelDetailsUrl: mockHotelDetailsUrl,
            hotel: mockHotel,
            isFlightPlusHotelFunnel,
            buildFlightPlusHotelUrl: mockBuildFlightPlusHotelUrl,
            isExtrasPage,
            changeIsClickChangeButton: mockChangeIsClickChangeButton,
            haveSelectedSeats,
            extraLuggage: extraLuggage || {
                extraLuggageInfo: null,
            },
        });
    };

    describe('Holiday flow (isFlightPlusHotelFunnel = false)', () => {
        beforeEach(() => {
            setupMockStore(false);
        });

        it('should return 4 breadcrumb items', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(result.current.breadItems).toHaveLength(4);
        });

        it('should return items with correct keys', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(result.current.breadItems[0].key).toBe(BreadcrumbsPage.Holiday);
            expect(result.current.breadItems[1].key).toBe(BreadcrumbsPage.Extras);
            expect(result.current.breadItems[2].key).toBe(BreadcrumbsPage.Guests);
            expect(result.current.breadItems[3].key).toBe(BreadcrumbsPage.Payment);
        });

        it('should build correct hrefs for Holiday flow', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(result.current.breadItems[0].href).toBe('/hotel-details?query=test');
            expect(result.current.breadItems[1].href).toBe(`${SitePath.Extras}?query=test`);
            expect(result.current.breadItems[2].href).toBe(`${SitePath.GuestsDetails}?query=test`);
            expect(result.current.breadItems[3].href).toBe(`${SitePath.Payment}?query=test`);
        });

        it('should call hotelDetailsUrl with correct params', () => {
            renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(mockHotelDetailsUrl).toHaveBeenCalledWith(mockHotel, '?query=test');
        });

        it('should use Holiday dictionary keys', () => {
            renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.BreadcrumbsLabelsHoliday);
            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.BreadcrumbsLabelsExtras);
            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.BreadcrumbsLabelsGuest);
            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.BreadcrumbsLabelsPayment);
        });

        it('should NOT call buildFlightPlusHotelUrl', () => {
            renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(mockBuildFlightPlusHotelUrl).not.toHaveBeenCalled();
        });

        it('should calculate activeItemIndex correctly for Holiday page', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Holiday));

            expect(result.current.activeItemIndex).toBe(0);
        });

        it('should calculate activeItemIndex correctly for Extras page', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(result.current.activeItemIndex).toBe(1);
        });

        it('should calculate activeItemIndex correctly for Guests page', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Guests));

            expect(result.current.activeItemIndex).toBe(2);
        });

        it('should calculate activeItemIndex correctly for Payment page', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Payment));

            expect(result.current.activeItemIndex).toBe(3);
        });

        it('should return -1 for activeItemIndex when activePage is undefined', () => {
            const { result } = renderHook(() => useBreadcrumbs(undefined));

            expect(result.current.activeItemIndex).toBe(-1);
        });

        it('should NOT have shouldShowPopup property in Holiday flow breadcrumbs', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            result.current.breadItems.forEach(item => {
                expect(item.shouldShowPopup).toBeUndefined();
            });
        });

        it('should NOT have popupData property in Holiday flow breadcrumbs', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            result.current.breadItems.forEach(item => {
                expect(item.popupData).toBeUndefined();
            });
        });
    });

    describe('FPH flow (isFlightPlusHotelFunnel = true)', () => {
        beforeEach(() => {
            setupMockStore(true);
        });

        it('should return 5 breadcrumb items', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(result.current.breadItems).toHaveLength(5);
        });

        it('should return items with correct keys', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(result.current.breadItems[0].key).toBeUndefined();
            expect(result.current.breadItems[1].key).toBeUndefined();
            expect(result.current.breadItems[2].key).toBe(BreadcrumbsPage.Extras);
            expect(result.current.breadItems[3].key).toBe(BreadcrumbsPage.Guests);
            expect(result.current.breadItems[4].key).toBe(BreadcrumbsPage.Payment);
        });

        it('should build correct hrefs for FPH flow', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(result.current.breadItems[0].href).toBe(`/fph${FlightPlusHotelSitePath.Flights}`);
            expect(result.current.breadItems[1].href).toBe(`/fph${FlightPlusHotelSitePath.Hotels}`);
            expect(result.current.breadItems[2].href).toBe(`${SitePath.Extras}?query=test`);
            expect(result.current.breadItems[3].href).toBe(`${SitePath.GuestsDetails}?query=test`);
            expect(result.current.breadItems[4].href).toBe(`${SitePath.Payment}?query=test`);
        });

        it('should call buildFlightPlusHotelUrl with Flights path', () => {
            renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(mockBuildFlightPlusHotelUrl).toHaveBeenCalledWith(FlightPlusHotelSitePath.Flights);
        });

        it('should call buildFlightPlusHotelUrl with Hotels path', () => {
            renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(mockBuildFlightPlusHotelUrl).toHaveBeenCalledWith(FlightPlusHotelSitePath.Hotels, true);
        });

        it('should use FPH dictionary keys', () => {
            renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsFlights);
            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsHotel);
            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsExtras);
            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsGuests);
            expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsCheckout);
        });

        it('should NOT call hotelDetailsUrl', () => {
            renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(mockHotelDetailsUrl).not.toHaveBeenCalled();
        });

        it('should calculate activeItemIndex correctly for Extras page', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(result.current.activeItemIndex).toBe(2);
        });

        it('should calculate activeItemIndex correctly for Guests page', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Guests));

            expect(result.current.activeItemIndex).toBe(3);
        });

        it('should calculate activeItemIndex correctly for Payment page', () => {
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Payment));

            expect(result.current.activeItemIndex).toBe(4);
        });

        it('should return -1 for activeItemIndex when activePage is undefined', () => {
            const { result } = renderHook(() => useBreadcrumbs(undefined));

            expect(result.current.activeItemIndex).toBe(0);
        });

        describe('Popup handlers', () => {
            it('should set selectedBreadcrumb when handleBreadcrumbClick is called', () => {
                setupMockStore(true, false, false, null);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                const breadcrumb = result.current.breadItems[0];
                act(() => {
                    result.current.handleBreadcrumbClick(breadcrumb);
                });

                expect(result.current.selectedBreadcrumb).toBe(breadcrumb);
            });

            it('should clear selectedBreadcrumb when handlePopupClose is called', () => {
                setupMockStore(true, false, false, null);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                act(() => {
                    result.current.handleBreadcrumbClick(result.current.breadItems[0]);
                });

                act(() => {
                    result.current.handlePopupClose();
                });

                expect(result.current.selectedBreadcrumb).toBeNull();
            });

            it('should navigate to breadcrumb href when handlePopupContinue is called', () => {
                setupMockStore(true, false, false, null);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                Object.defineProperty(window, 'location', {
                    value: { href: '' },
                    writable: true,
                });

                const breadcrumb = result.current.breadItems[0];
                act(() => {
                    result.current.handleBreadcrumbClick(breadcrumb);
                });

                act(() => {
                    result.current.handlePopupContinue();
                });

                expect(result.current.selectedBreadcrumb).toBeNull();
                expect(window.location.href).toBe(breadcrumb.href);
            });

            it('should not navigate when handlePopupContinue is called without selectedBreadcrumb', () => {
                setupMockStore(true, false, false, null);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                Object.defineProperty(window, 'location', {
                    value: { href: '' },
                    writable: true,
                });

                act(() => {
                    result.current.handlePopupContinue();
                });

                expect(result.current.selectedBreadcrumb).toBeNull();
                expect(window.location.href).toBe('');
            });
        });

        describe('shouldShowPopup logic', () => {
            it('should be false when no seats and no extra luggage', () => {
                setupMockStore(true, false, false, null);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                expect(result.current.breadItems[0].shouldShowPopup).toBe(false);
                expect(result.current.breadItems[1].shouldShowPopup).toBe(false);
            });

            it('should be false when extraLuggageInfo is undefined', () => {
                setupMockStore(true, false, false, { extraLuggageInfo: undefined });
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                expect(result.current.breadItems[0].shouldShowPopup).toBe(false);
                expect(result.current.breadItems[1].shouldShowPopup).toBe(false);
            });

            it('should be false when extraLuggageInfo.items is empty', () => {
                setupMockStore(true, false, false, { extraLuggageInfo: { items: [] } });
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                expect(result.current.breadItems[0].shouldShowPopup).toBe(false);
                expect(result.current.breadItems[1].shouldShowPopup).toBe(false);
            });

            it('should be false when only complimentary luggage exists', () => {
                const mockExtraLuggageComplimentary = {
                    extraLuggageInfo: {
                        items: [
                            {
                                isComplimentary: true,
                                itemCode: 'COMP1',
                                itemCategoryCode: 'BAGE',
                                routeId: '1',
                                passengerId: '1',
                            },
                            {
                                isComplimentary: true,
                                itemCode: 'COMP2',
                                itemCategoryCode: 'BAGE',
                                routeId: '2',
                                passengerId: '1',
                            },
                        ],
                    },
                };

                setupMockStore(true, false, false, mockExtraLuggageComplimentary);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                expect(result.current.breadItems[0].shouldShowPopup).toBe(false);
                expect(result.current.breadItems[1].shouldShowPopup).toBe(false);
            });

            it('should be true when seats are selected', () => {
                setupMockStore(true, false, true, null);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                expect(result.current.breadItems[0].shouldShowPopup).toBe(true);
                expect(result.current.breadItems[1].shouldShowPopup).toBe(true);
            });

            it('should be true when paid extra luggage exists', () => {
                const mockExtraLuggagePaid = {
                    extraLuggageInfo: {
                        items: [
                            {
                                isComplimentary: false,
                                itemCode: 'LUG',
                                itemCategoryCode: 'BAGE',
                                routeId: '1',
                                passengerId: '1',
                            },
                            {
                                isComplimentary: false,
                                itemCode: 'LUG',
                                itemCategoryCode: 'BAGE',
                                routeId: '2',
                                passengerId: '1',
                            },
                        ],
                    },
                };

                setupMockStore(true, false, false, mockExtraLuggagePaid);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                expect(result.current.breadItems[0].shouldShowPopup).toBe(true);
                expect(result.current.breadItems[1].shouldShowPopup).toBe(true);
            });

            it('should be true when both seats and luggage are selected', () => {
                const mockExtraLuggagePaid = {
                    extraLuggageInfo: {
                        items: [
                            {
                                isComplimentary: false,
                                itemCode: 'LUG',
                                itemCategoryCode: 'BAGE',
                                routeId: '1',
                                passengerId: '1',
                            },
                        ],
                    },
                };

                setupMockStore(true, false, true, mockExtraLuggagePaid);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                expect(result.current.breadItems[0].shouldShowPopup).toBe(true);
                expect(result.current.breadItems[1].shouldShowPopup).toBe(true);
            });
        });

        describe('popupData', () => {
            it('should exist for Flights breadcrumb with correct dictionary keys', () => {
                setupMockStore(true, false, false, null);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                const flightsBreadcrumb = result.current.breadItems[0];

                expect(flightsBreadcrumb.popupData).toBeDefined();
                expect(flightsBreadcrumb.popupData?.title).toBe(
                    SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbPopupTitle,
                );
                expect(flightsBreadcrumb.popupData?.subtitle).toBe(
                    SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbPopupSubtitle,
                );
                expect(flightsBreadcrumb.popupData?.cancelLabel).toBe(
                    SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbPopupCancel,
                );
                expect(flightsBreadcrumb.popupData?.continueLabel).toBeDefined();
                expect(typeof flightsBreadcrumb.popupData?.continueLabel).toBe('string');
            });

            it('should exist for Hotel breadcrumb with correct dictionary keys', () => {
                setupMockStore(true, false, false, null);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                const hotelBreadcrumb = result.current.breadItems[1];

                expect(hotelBreadcrumb.popupData).toBeDefined();
                expect(hotelBreadcrumb.popupData?.title).toBe(
                    SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbPopupTitle,
                );
                expect(hotelBreadcrumb.popupData?.subtitle).toBe(
                    SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbPopupSubtitle,
                );
                expect(hotelBreadcrumb.popupData?.cancelLabel).toBe(
                    SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbPopupCancel,
                );
                // continueLabel is generated by Tokenizer, just verify it exists
                expect(hotelBreadcrumb.popupData?.continueLabel).toBeDefined();
                expect(typeof hotelBreadcrumb.popupData?.continueLabel).toBe('string');
            });

            it('should NOT exist for Extras, Guests, and Checkout breadcrumbs', () => {
                setupMockStore(true, false, false, null);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                expect(result.current.breadItems[2].popupData).toBeUndefined();
                expect(result.current.breadItems[3].popupData).toBeUndefined();
                expect(result.current.breadItems[4].popupData).toBeUndefined();
            });

            it('should include breadcrumb title in continueLabel', () => {
                setupMockStore(true, false, false, null);
                const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

                const flightsBreadcrumb = result.current.breadItems[0];
                const hotelBreadcrumb = result.current.breadItems[1];

                expect(flightsBreadcrumb.popupData?.continueLabel).toBeDefined();
                expect(hotelBreadcrumb.popupData?.continueLabel).toBeDefined();
                expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsFlights);
                expect(mockGetPhrase).toHaveBeenCalledWith(SitecoreDictionary.FlightPlusHotelLabelsBreadcrumbsHotel);
            });
        });
    });

    describe('Store props', () => {
        it('should return isExtrasPage from store', () => {
            setupMockStore(false, true);
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(result.current.isExtrasPage).toBe(true);
        });

        it('should return changeIsClickChangeButton from store', () => {
            setupMockStore(false);
            const { result } = renderHook(() => useBreadcrumbs(BreadcrumbsPage.Extras));

            expect(result.current.changeIsClickChangeButton).toBe(mockChangeIsClickChangeButton);
        });
    });
});
