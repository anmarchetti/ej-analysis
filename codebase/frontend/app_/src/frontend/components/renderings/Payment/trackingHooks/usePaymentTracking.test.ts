import { waitFor } from '@testing-library/dom';
import { renderHook } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { envPublic } from 'code/env';
import { setCookie } from 'frontend/utils/cookies.utils';
import { getBusinessChannel, getBusinessType, getVersion } from 'frontend/utils/tracking/tracking.utils';
import { CookiesKeys } from 'models/enum/CookiesKeys';
import { sendTrackingEvent } from 'frontend/components/renderings/Payment/Payment.utils';

import { buildParams, usePaymentPriceJumpTracking, usePaymentTracking } from './usePaymentTracking';

const buildParamsMocks = {
    page_title: `page_title|EN`, ////title should be unique for each payment page, and language should be dynamically changed based on site's language
    page_category: 'page_category',
    content_group: 'page_category', //pageCategory property
    logged_in_status: 'Yes',
    currency: CurrencyCode.GBP,
    business_type: getBusinessType(), //Example value dimension3 property
    business_channel: getBusinessChannel(), //Example value dimension2 property
    platform_language: 'EN', //language should be dynamically changed based on site's language - dimension6
    screen_orientation: 'Landscape', //Example value dimension8 property
    responsive_page_break_view: 'Extra large', //Example value dimension9 property
    referral_page_name: 'prev_name', //Example value dimension10 property
    referral_page_category: 'prev_category', //Example value dimension11 property
    environment: window.location.origin, //dimension4 property
    site_version: getVersion(), //dimension5 property
    test_variant: '123', //dimension12 property
};

let mockStores;
const createRootStore = () => ({
    trackingStore: {
        getTrackPaymentData: jest.fn(),
    },
    routerStore: {
        referralUrl: 'prevUrlTest',
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/Payment/Payment.utils', () => ({
    sendTrackingEvent: jest.fn(),
}));

function mockFetch(data: any) {
    return jest.fn().mockImplementation(() =>
        Promise.resolve({
            ok: true,
            json: () => data,
        }),
    );
}

const setPersonalizationCookies = () => {
    setCookie(CookiesKeys.EjPersonalisationCookie, '1');
    setCookie('_ga', '1.234.456.23');
};

describe('usePaymentLanding', () => {
    beforeEach(() => {
        mockStores = createRootStore();
        window.fetch = mockFetch(null);
    });

    describe('buildParams', () => {
        it('should return empty object', async () => {
            setCookie(CookiesKeys.EjPersonalisationCookie, '0');
            const res = await buildParams(() => Promise.resolve(buildParamsMocks), mockStores.routerStore.referralUrl);
            expect(res).toEqual({});
        });

        it('should generate data correctly', async () => {
            setPersonalizationCookies();
            const buildResult = await buildParams(
                () => Promise.resolve(buildParamsMocks),
                mockStores.routerStore.referralUrl,
            );

            if (buildResult.params) {
                buildResult.params.user_agent = 'user_agent';
            }

            const { timestamp, ...receivedParamsWithoutTimestamp } = buildResult.params || {};
            const { timestamp: expectedTimestamp, ...expectedParamsWithoutTimestamp } = {
                ...buildParamsMocks,
                consent_config: '1|1|',
                page_location: 'http://localhost/',
                page_referral_url: 'prevUrlTest',
                page_url: 'http://localhost/',
                session_id: undefined,
                timestamp: +new Date(),
                user_agent: 'user_agent',
            };

            expect(receivedParamsWithoutTimestamp).toEqual(expectedParamsWithoutTimestamp);
        });
    });

    it('should call request when isInitialized is true', () => {
        setCookie(CookiesKeys.EjPersonalisationCookie, '1');
        renderHook(() => usePaymentTracking(true));
        expect(mockStores.trackingStore.getTrackPaymentData).toHaveBeenCalled();
    });

    it('should not call request when no cookie', () => {
        setCookie(CookiesKeys.EjPersonalisationCookie, '0');
        renderHook(() => usePaymentTracking(true));

        expect(mockStores.trackingStore.getTrackPaymentData).not.toHaveBeenCalled();
    });

    it('should not call request when isInitialized is false', () => {
        setCookie(CookiesKeys.EjPersonalisationCookie, '1');
        renderHook(() => usePaymentTracking(false));

        expect(mockStores.trackingStore.getTrackPaymentData).not.toHaveBeenCalled();
    });

    it('should not call getTrackPaymentData when no personalization cookie is set', () => {
        setCookie(CookiesKeys.EjPersonalisationCookie, '0');
        renderHook(() => usePaymentTracking(true));
        expect(mockStores.trackingStore.getTrackPaymentData).not.toHaveBeenCalled();
    });

    it('should not call getTrackPaymentData when isInitialized is false', () => {
        setCookie(CookiesKeys.EjPersonalisationCookie, '1');
        renderHook(() => usePaymentTracking(false));
        expect(mockStores.trackingStore.getTrackPaymentData).not.toHaveBeenCalled();
    });

    it('should call pushTrackingEvent with eventParams when pushTrackingEvent is called', async () => {
        setPersonalizationCookies();

        const { result } = renderHook(() => usePaymentTracking(true));

        const mockEventParams = {
            event_category: 'test_category',
            event_action: 'test_action',
        };

        await result.current.pushTrackingEvent(mockEventParams);

        expect(mockStores.trackingStore.getTrackPaymentData).toHaveBeenCalled();
    });

    it('should call sendTrackingEvent with custom eventParams when pushTrackingEvent is called', async () => {
        setPersonalizationCookies();
        mockStores.trackingStore.getTrackPaymentData.mockResolvedValue(buildParamsMocks);

        const mockEventParams = {
            event_action: 'test_action',
        };

        const { result } = renderHook(() => usePaymentTracking());

        await result.current.pushTrackingEvent(mockEventParams);

        await waitFor(() => {
            expect(sendTrackingEvent).toHaveBeenCalledWith(
                '456.23',
                expect.arrayContaining([
                    expect.objectContaining({
                        params: expect.objectContaining({
                            event_action: 'test_action',
                            event_category: 'page_title',
                        }),
                    }),
                ]),
            );
        });
    });

    it('should not call sendTrackingEvent when getTrackPaymentData is undefined', async () => {
        setPersonalizationCookies();
        mockStores.trackingStore.getTrackPaymentData = undefined;

        const mockEventParams = {
            event_action: 'test_action',
        };

        const { result } = renderHook(() => usePaymentTracking());

        await result.current.pushTrackingEvent(mockEventParams);

        await waitFor(() => {
            expect(sendTrackingEvent).not.toHaveBeenCalled();
        });
    });

    it('should pass currency parameter if event_currency is set', async () => {
        setPersonalizationCookies();
        mockStores.trackingStore.getTrackPaymentData.mockResolvedValue(buildParamsMocks);

        const mockEventParams = {
            event_action: 'test_action',
            event_currency: CurrencyCode.EUR,
        };

        const { result } = renderHook(() => usePaymentTracking());

        await result.current.pushTrackingEvent(mockEventParams);

        await waitFor(() => {
            expect(sendTrackingEvent).toHaveBeenCalledWith(
                '456.23',
                expect.arrayContaining([
                    expect.objectContaining({
                        params: expect.objectContaining({
                            event_action: 'test_action',
                            event_category: 'page_title',
                            currency: CurrencyCode.EUR,
                        }),
                    }),
                ]),
            );
        });
    });

    it('should use referralUrl from store and sent in event if document.referral is empty and store referral url is available', async () => {
        setPersonalizationCookies();

        const { result } = renderHook(() => usePaymentTracking(true));

        const mockEventParams = {
            event_action: 'test_action',
        };

        await result.current.pushTrackingEvent(mockEventParams);

        await waitFor(() => {
            expect(sendTrackingEvent).toHaveBeenCalledWith(
                '456.23',
                expect.arrayContaining([
                    expect.objectContaining({
                        params: expect.objectContaining({
                            page_referral_url: mockStores.routerStore.referralUrl,
                        }),
                    }),
                ]),
            );
        });
    });

    it('should use document.referrer in event when it is available', async () => {
        Object.defineProperty(document, 'referrer', {
            value: 'test-reference-url',
            configurable: true,
        });

        setCookie(CookiesKeys.EjPersonalisationCookie, '1');
        setCookie('_ga', '1.234.456.23');

        const { result } = renderHook(() => usePaymentTracking(true));

        const mockEventParams = {
            event_action: 'test_action',
        };

        await result.current.pushTrackingEvent(mockEventParams);

        await waitFor(() => {
            expect(sendTrackingEvent).toHaveBeenCalledWith(
                '456.23',
                expect.arrayContaining([
                    expect.objectContaining({
                        params: expect.objectContaining({
                            page_referral_url: 'test-reference-url',
                        }),
                    }),
                ]),
            );
        });
    });

    it('should call sendTrackingEvent with empty page ref on trackPaymentPriceJump when referralUrl is undefined', async () => {
        Object.defineProperty(document, 'referrer', {
            value: undefined,
            configurable: true,
        });

        mockStores.routerStore.referralUrl = undefined;

        const { result } = renderHook(() => usePaymentPriceJumpTracking());

        const mockEventParams = {
            event_action: 'test_action',
        };

        await result.current.trackPaymentPriceJump(mockEventParams);

        await waitFor(() => {
            expect(sendTrackingEvent).toHaveBeenCalledWith(
                '456.23',
                expect.arrayContaining([
                    expect.objectContaining({
                        params: expect.objectContaining({
                            page_referral_url: '',
                        }),
                    }),
                ]),
            );
        });
    });

    it('should call sendTrackingEvent with correct data on trackPaymentPriceJump', async () => {
        Object.defineProperty(document, 'referrer', {
            value: 'test-reference-url',
            configurable: true,
        });

        const { result } = renderHook(() => usePaymentPriceJumpTracking());

        const mockEventParams = {
            event_action: 'test_action',
        };

        await result.current.trackPaymentPriceJump(mockEventParams);

        await waitFor(() => {
            expect(sendTrackingEvent).toHaveBeenCalledWith(
                '456.23',
                expect.arrayContaining([
                    expect.objectContaining({
                        params: expect.objectContaining({
                            page_referral_url: 'test-reference-url',
                        }),
                    }),
                ]),
            );
        });
    });

    describe('session_id from cookie', () => {
        it('should have correct value with new cookie', async () => {
            envPublic.GA_MEASUREMENT_ID = 'G-0D87FRSSR7';
            setPersonalizationCookies();
            setCookie(
                '_ga_' + envPublic.GA_MEASUREMENT_ID.split('-')[1],
                'GS2.1.s1747053801$o1$g1$t1747054330$j0$l0$h0',
            );

            mockStores.trackingStore.getTrackPaymentData.mockResolvedValue(buildParamsMocks);

            const mockEventParams = {
                event_action: 'test_action',
            };

            const { result } = renderHook(() => usePaymentTracking());

            await result.current.pushTrackingEvent(mockEventParams);

            await waitFor(() => {
                expect(sendTrackingEvent).toHaveBeenCalledWith(
                    '456.23',
                    expect.arrayContaining([
                        expect.objectContaining({
                            params: expect.objectContaining({
                                session_id: '1747053801',
                            }),
                        }),
                    ]),
                );
            });
        });

        it('should have correct value with old cookie', async () => {
            envPublic.GA_MEASUREMENT_ID = 'G-0D87FRSSR7';
            setPersonalizationCookies();
            setCookie('_ga_' + envPublic.GA_MEASUREMENT_ID.split('-')[1], 'GS1.1.1683907200.1.1.1683907200.60');

            mockStores.trackingStore.getTrackPaymentData.mockResolvedValue(buildParamsMocks);

            const mockEventParams = {
                event_action: 'test_action',
            };

            const { result } = renderHook(() => usePaymentTracking());

            await result.current.pushTrackingEvent(mockEventParams);

            await waitFor(() => {
                expect(sendTrackingEvent).toHaveBeenCalledWith(
                    '456.23',
                    expect.arrayContaining([
                        expect.objectContaining({
                            params: expect.objectContaining({
                                session_id: '1683907200',
                            }),
                        }),
                    ]),
                );
            });
        });
    });
});
