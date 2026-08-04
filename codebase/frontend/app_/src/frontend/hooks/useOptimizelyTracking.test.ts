import type { DecisionListenerPayload } from '@optimizely/optimizely-sdk';
import * as OptimizelyReactSDK from '@optimizely/react-sdk';
import { act, renderHook, waitFor } from '@testing-library/react';

import { envPublic } from 'code/env';
import settings from 'code/settings';
import { getCookie, listenCookieChange } from 'frontend/utils/cookies.utils';
import { trackOptimizelyDecisions } from 'frontend/utils/optimizely.utils';
import { IOptimizelyDecision } from 'models/optimizely';

import { useOptimizelyTracking } from './useOptimizelyTracking';

jest.mock('@optimizely/react-sdk', () => ({
    ...jest.requireActual('@optimizely/react-sdk'),
    createInstance: jest.fn(),
    setLogLevel: jest.fn(),
}));

jest.mock('frontend/utils/optimizely.utils', () => ({
    trackOptimizelyDecisions: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('frontend/utils/cookies.utils', () => ({
    getCookie: jest.fn(),
    listenCookieChange: jest.fn(),
}));

const mockCreateInstance = OptimizelyReactSDK.createInstance as jest.MockedFunction<
    typeof OptimizelyReactSDK.createInstance
>;
const mockSetLogLevel = OptimizelyReactSDK.setLogLevel as jest.MockedFunction<typeof OptimizelyReactSDK.setLogLevel>;
const mockTrackOptimizelyDecisions = trackOptimizelyDecisions as jest.MockedFunction<typeof trackOptimizelyDecisions>;
const mockGetCookie = getCookie as jest.MockedFunction<typeof getCookie>;
const mockListenCookieChange = listenCookieChange as jest.MockedFunction<typeof listenCookieChange>;

const mockDecideForKeys = jest.fn();
const mockOnReady = jest.fn(() => Promise.resolve({ success: true }));
const mockAddNotificationListener = jest.fn();
const mockRemoveNotificationListener = jest.fn();
const mockClient = {
    decideForKeys: mockDecideForKeys,
    onReady: mockOnReady,
    notificationCenter: {
        addNotificationListener: mockAddNotificationListener,
        removeNotificationListener: mockRemoveNotificationListener,
    },
} as unknown as OptimizelyReactSDK.ReactSDKClient;

const createMockStores = (
    isEnabled: boolean = false,
    userId: string = '',
    userAttributes: Record<string, any> = {},
    settingsDecisions: IOptimizelyDecision[] = [],
    componentDecisions: IOptimizelyDecision[] = [],
    layoutId: string = '',
    componentUserId: string = '',
    componentUserAttributes: Record<string, any> = {},
    trackOptimizelyDecisionData: jest.Mock = jest.fn(),
    untrackedOptimizelyComponentDecisions?: IOptimizelyDecision[],
    addTrackedOptimizelyComponentFeatureKeys: jest.Mock = jest.fn(),
    optimizelyClient: any = null,
    setOptimizelyClient: jest.Mock = jest.fn(),
) => ({
    layoutStore: {
        isOptimizelyEnabled: isEnabled,
        optimizelyUserId: userId,
        optimizelyUserAttributes: userAttributes,
        optimizelySettingsDecisions: settingsDecisions,
        optimizelyComponentDecisions: componentDecisions,
        optimizelyComponentUserId: componentUserId,
        optimizelyComponentUserAttributes: componentUserAttributes,
        layoutId: layoutId,
        untrackedOptimizelyComponentDecisions: untrackedOptimizelyComponentDecisions ?? componentDecisions,
        addTrackedOptimizelyComponentFeatureKeys,
        optimizelyClient,
        setOptimizelyClient,
    },
    trackingStore: {
        trackOptimizelyDecisionData,
    },
});

let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ ...mockStores }),
}));

const mockUserId = 'oeu1754639239050r0.6723461017688855321';
const mockUserAttributes = { site: 'Holidays', language: 'en' };
const mockComponentUserId = 'component-user-456';
const mockComponentUserAttributes = { site: 'Holidays', language: 'en', page: 'hotel-details' };
const mockSettingsDecisions: IOptimizelyDecision[] = [
    {
        featureKey: 'sitesettings',
        variationKey: '50_results',
        experimentKey: 'search_results',
        isDisabled: false,
    },
];
const mockComponentDecisions: IOptimizelyDecision[] = [
    {
        featureKey: 'component_test',
        variationKey: 'variant_a',
        experimentKey: 'test',
        isDisabled: false,
    },
];

const mockSettingsDisabledDecision: IOptimizelyDecision = {
    featureKey: 'disabled_settings_feature',
    variationKey: null,
    experimentKey: null,
    isDisabled: true,
};

const mockComponentDisabledDecision: IOptimizelyDecision = {
    featureKey: 'disabled_component_feature',
    variationKey: null,
    experimentKey: null,
    isDisabled: true,
};

const mockFlagDecisionNotification = {
    type: 'flag',
    userId: mockUserId,
    attributes: mockUserAttributes,
    decisionInfo: {
        flagKey: 'feature_new_search',
        enabled: true,
        variationKey: 'variation_a',
        ruleKey: 'experiment_123',
        reasons: [],
        decisionEventDispatched: true,
        variables: {},
    },
} as DecisionListenerPayload;

const mockAbTestDecisionNotification = {
    type: 'ab-test',
    userId: mockUserId,
    attributes: mockUserAttributes,
    decisionInfo: {
        experimentKey: 'search_results',
        variationKey: '50_results',
    },
} as DecisionListenerPayload;

describe('useOptimizelyTracking', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockCreateInstance.mockReturnValue(mockClient);
        mockSetLogLevel.mockClear();
        mockDecideForKeys.mockClear();
        mockOnReady.mockResolvedValue({ success: true });
        mockTrackOptimizelyDecisions.mockClear();
        mockAddNotificationListener.mockClear();
        mockRemoveNotificationListener.mockClear();
        envPublic.OPTIMIZELY_SDK_KEY = 'test-sdk-key';
        mockGetCookie.mockReturnValue('1');
        mockListenCookieChange.mockClear();
        mockListenCookieChange.mockImplementation(() => jest.fn());
    });

    describe('Initialization', () => {
        it('should not initialize client when SDK key is missing', () => {
            envPublic.OPTIMIZELY_SDK_KEY = '';

            mockStores = createMockStores(true);

            renderHook(() => useOptimizelyTracking());

            expect(mockCreateInstance).not.toHaveBeenCalled();
            expect(mockSetLogLevel).toHaveBeenCalledWith('error');
        });

        it('should initialize client when enabled and SDK key exists', () => {
            const mockSetClient = jest.fn();
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                [],
                '',
                '',
                {},
                jest.fn(),
                undefined,
                jest.fn(),
                null,
                mockSetClient,
            );

            renderHook(() => useOptimizelyTracking());

            expect(mockSetLogLevel).toHaveBeenCalledWith('error');
            expect(mockCreateInstance).toHaveBeenCalledWith({ sdkKey: 'test-sdk-key' });
            expect(mockSetClient).toHaveBeenCalledWith(mockClient);
        });
    });

    describe('Cookie Change Listener', () => {
        it('should setup cookie change listener on mount', () => {
            mockStores = createMockStores(true, mockUserId, mockUserAttributes);

            renderHook(() => useOptimizelyTracking());

            expect(mockListenCookieChange).toHaveBeenCalledWith(
                settings.Cookies.Personalization,
                expect.any(Function),
                1000,
            );
        });

        it('should initialize client when cookie changes from rejected to accepted', () => {
            mockGetCookie.mockReturnValue('0');
            const mockSetClient = jest.fn();
            let capturedCallback: () => void;

            mockListenCookieChange.mockImplementation((name, callback) => {
                capturedCallback = callback as () => void;

                return jest.fn();
            });

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                [],
                '',
                '',
                {},
                jest.fn(),
                undefined,
                jest.fn(),
                null,
                mockSetClient,
            );

            const { rerender } = renderHook(() => useOptimizelyTracking());

            expect(mockCreateInstance).not.toHaveBeenCalled();

            mockGetCookie.mockReturnValue('1');
            act(() => {
                capturedCallback!();
            });

            rerender();

            expect(mockCreateInstance).toHaveBeenCalledTimes(1);
            expect(mockSetClient).toHaveBeenCalledWith(mockClient);
        });

        it('should not reinitialize when cookie was already accepted', () => {
            mockGetCookie.mockReturnValue('1');
            let capturedCallback: () => void;

            mockListenCookieChange.mockImplementation((name, callback) => {
                capturedCallback = callback as () => void;

                return jest.fn();
            });

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                [],
                '',
                '',
                {},
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
                jest.fn(),
            );

            renderHook(() => useOptimizelyTracking());

            act(() => {
                capturedCallback!();
            });

            expect(mockCreateInstance).not.toHaveBeenCalled();
        });

        it('should cleanup cookie listener on unmount', () => {
            const mockCleanup = jest.fn();
            mockListenCookieChange.mockReturnValue(mockCleanup);

            mockStores = createMockStores(true, mockUserId, mockUserAttributes);

            const { unmount } = renderHook(() => useOptimizelyTracking());

            unmount();

            expect(mockCleanup).toHaveBeenCalled();
        });
    });

    describe('Settings Tracking', () => {
        it('should not track settings when client is not initialized', () => {
            mockStores = createMockStores(false, mockUserId, mockUserAttributes, mockSettingsDecisions);

            renderHook(() => useOptimizelyTracking());

            expect(mockTrackOptimizelyDecisions).not.toHaveBeenCalled();
        });

        it('should not track settings when Optimizely is not enabled', () => {
            mockStores = createMockStores(false, mockUserId, mockUserAttributes, mockSettingsDecisions);

            renderHook(() => useOptimizelyTracking());

            expect(mockTrackOptimizelyDecisions).not.toHaveBeenCalled();
        });

        it('should not track settings when no enabled decisions', async () => {
            mockStores = createMockStores(true, mockUserId, mockUserAttributes, []);

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).not.toHaveBeenCalled());
        });

        it('should track all settings feature keys including flag-only features', async () => {
            const flagOnlyDecision: IOptimizelyDecision = {
                featureKey: 'flag_only',
                variationKey: null,
                experimentKey: null,
                isDisabled: false,
            };

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [flagOnlyDecision],
                [],
                '',
                '',
                {},
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));
            expect(mockTrackOptimizelyDecisions).toHaveBeenCalledWith(
                mockClient,
                [flagOnlyDecision],
                mockUserId,
                mockUserAttributes,
            );
        });

        it('should track settings enabled decisions using decideForKeys', async () => {
            const decision: IOptimizelyDecision = {
                featureKey: 'sitesettings',
                variationKey: '50_results',
                experimentKey: 'search_results',
                isDisabled: false,
            };

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [decision],
                [],
                '',
                '',
                {},
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));
            expect(mockTrackOptimizelyDecisions).toHaveBeenCalledWith(
                mockClient,
                [decision],
                mockUserId,
                mockUserAttributes,
            );
        });

        it('should track multiple settings features in one decideForKeys call', async () => {
            const multipleDecisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'sitesettings',
                    variationKey: '50_results',
                    experimentKey: 'search_results',
                    isDisabled: false,
                },
                {
                    featureKey: 'feature2',
                    variationKey: 'variation_b',
                    experimentKey: 'experiment_2',
                    isDisabled: false,
                },
            ];

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                multipleDecisions,
                [],
                '',
                '',
                {},
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));

            expect(mockTrackOptimizelyDecisions).toHaveBeenCalledWith(
                mockClient,
                multipleDecisions,
                mockUserId,
                mockUserAttributes,
            );
        });

        it('should track all settings decisions regardless of experimentKey', async () => {
            const mixedDecisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'flag_only',
                    variationKey: null,
                    experimentKey: null,
                    isDisabled: false,
                },
                {
                    featureKey: 'sitesettings',
                    variationKey: '50_results',
                    experimentKey: 'search_results',
                    isDisabled: false,
                },
            ];

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                mixedDecisions,
                [],
                '',
                '',
                {},
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));
            expect(mockTrackOptimizelyDecisions).toHaveBeenCalledWith(
                mockClient,
                mixedDecisions,
                mockUserId,
                mockUserAttributes,
            );
        });

        it('should only track settings once even with multiple renders', async () => {
            const decision: IOptimizelyDecision = {
                featureKey: 'sitesettings',
                variationKey: '50_results',
                experimentKey: 'search_results',
                isDisabled: false,
            };

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [decision],
                [],
                '',
                '',
                {},
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            const { rerender } = renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));

            rerender();
            expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1);
        });

        it('should wait for client.onReady before tracking settings', async () => {
            const decision: IOptimizelyDecision = {
                featureKey: 'sitesettings',
                variationKey: '50_results',
                experimentKey: 'search_results',
                isDisabled: false,
            };

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [decision],
                [],
                '',
                '',
                {},
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));
        });
    });

    describe('Component Tracking', () => {
        it('should not track components when client is not initialized', () => {
            mockStores = createMockStores(
                false,
                mockUserId,
                mockUserAttributes,
                [],
                mockComponentDecisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
            );

            renderHook(() => useOptimizelyTracking());

            expect(mockTrackOptimizelyDecisions).not.toHaveBeenCalled();
        });

        it('should not track components when no layoutId', async () => {
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                mockComponentDecisions,
                '',
                mockComponentUserId,
                mockComponentUserAttributes,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).not.toHaveBeenCalled());
        });

        it('should not track components when no component decisions', async () => {
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                [],
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).not.toHaveBeenCalled());
        });

        it('should track component decisions on initial render', async () => {
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                mockComponentDecisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));
            expect(mockTrackOptimizelyDecisions).toHaveBeenCalledWith(
                mockClient,
                mockComponentDecisions,
                mockComponentUserId,
                mockComponentUserAttributes,
            );
        });

        it('should track component decisions again when layoutId changes with different decisions', async () => {
            const firstLayoutDecisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'component_test',
                    variationKey: 'variant_a',
                    experimentKey: 'test',
                    isDisabled: false,
                },
            ];

            const secondLayoutDecisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'different_feature',
                    variationKey: 'variant_b',
                    experimentKey: 'test2',
                    isDisabled: false,
                },
            ];

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                firstLayoutDecisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            const { rerender } = renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                secondLayoutDecisions,
                'layout-2',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                secondLayoutDecisions,
                jest.fn(),
                mockClient,
            );

            rerender();

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(2));
            expect(mockTrackOptimizelyDecisions).toHaveBeenNthCalledWith(
                2,
                mockClient,
                secondLayoutDecisions,
                mockComponentUserId,
                mockComponentUserAttributes,
            );
        });

        it('should track component decisions multiple times on multiple layout changes with different features', async () => {
            const layout1Decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature_layout_1',
                    variationKey: 'variant_a',
                    experimentKey: 'test',
                    isDisabled: false,
                },
            ];

            const layout2Decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature_layout_2',
                    variationKey: 'variant_b',
                    experimentKey: 'test2',
                    isDisabled: false,
                },
            ];

            const layout3Decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature_layout_3',
                    variationKey: 'variant_c',
                    experimentKey: 'test3',
                    isDisabled: false,
                },
            ];

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                layout1Decisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            const { rerender } = renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                layout2Decisions,
                'layout-2',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                layout2Decisions,
                jest.fn(),
                mockClient,
            );
            rerender();
            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(2));

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                layout3Decisions,
                'layout-3',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                layout3Decisions,
                jest.fn(),
                mockClient,
            );
            rerender();
            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(3));
        });

        it('should track multiple component features in one decideForKeys call', async () => {
            const multipleComponentDecisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'component_test',
                    variationKey: 'variant_a',
                    experimentKey: 'test',
                    isDisabled: false,
                },
                {
                    featureKey: 'component_test2',
                    variationKey: 'variant_b',
                    experimentKey: 'test2',
                    isDisabled: false,
                },
            ];

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                multipleComponentDecisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));

            expect(mockTrackOptimizelyDecisions).toHaveBeenCalledWith(
                mockClient,
                multipleComponentDecisions,
                mockComponentUserId,
                mockComponentUserAttributes,
            );
        });

        it('should wait for client.onReady before tracking components', async () => {
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                mockComponentDecisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));
        });

        it('should only track untracked component decisions', async () => {
            const allDecisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature_a',
                    variationKey: 'variant_a',
                    experimentKey: 'test_a',
                    isDisabled: false,
                },
                {
                    featureKey: 'feature_b',
                    variationKey: 'variant_b',
                    experimentKey: 'test_b',
                    isDisabled: false,
                },
                {
                    featureKey: 'feature_c',
                    variationKey: 'variant_c',
                    experimentKey: 'test_c',
                    isDisabled: false,
                },
            ];

            const untrackedDecisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature_c',
                    variationKey: 'variant_c',
                    experimentKey: 'test_c',
                    isDisabled: false,
                },
            ];

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                allDecisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                untrackedDecisions,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(1));
            expect(mockTrackOptimizelyDecisions).toHaveBeenCalledWith(
                mockClient,
                untrackedDecisions,
                mockComponentUserId,
                mockComponentUserAttributes,
            );
        });

        it('should add feature keys to tracked set after successful tracking', async () => {
            const mockAddTrackedFn = jest.fn();
            const decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature_a',
                    variationKey: 'variant_a',
                    experimentKey: 'test_a',
                    isDisabled: false,
                },
                {
                    featureKey: 'feature_b',
                    variationKey: 'variant_b',
                    experimentKey: 'test_b',
                    isDisabled: false,
                },
            ];

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                decisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                decisions,
                mockAddTrackedFn,
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockAddTrackedFn).toHaveBeenCalledTimes(1));
            expect(mockAddTrackedFn).toHaveBeenCalledWith(['feature_a', 'feature_b']);
        });

        it('should not track when all component decisions are already tracked', async () => {
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                mockComponentDecisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                [],
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).not.toHaveBeenCalled());
        });
    });

    describe('Integration - Settings and Component Tracking', () => {
        it('should track both settings and components on initial render', async () => {
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                mockSettingsDecisions,
                mockComponentDecisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(2));

            expect(mockTrackOptimizelyDecisions).toHaveBeenNthCalledWith(
                1,
                mockClient,
                mockSettingsDecisions,
                mockUserId,
                mockUserAttributes,
            );
            expect(mockTrackOptimizelyDecisions).toHaveBeenNthCalledWith(
                2,
                mockClient,
                mockComponentDecisions,
                mockComponentUserId,
                mockComponentUserAttributes,
            );
        });

        it('should track settings once but components multiple times on layout change', async () => {
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                mockSettingsDecisions,
                mockComponentDecisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            const { rerender } = renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(2));

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                mockSettingsDecisions,
                mockComponentDecisions,
                'layout-2',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            rerender();

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(3));

            expect(mockTrackOptimizelyDecisions).toHaveBeenNthCalledWith(
                1,
                mockClient,
                mockSettingsDecisions,
                mockUserId,
                mockUserAttributes,
            );

            expect(mockTrackOptimizelyDecisions).toHaveBeenNthCalledWith(
                2,
                mockClient,
                mockComponentDecisions,
                mockComponentUserId,
                mockComponentUserAttributes,
            );
            expect(mockTrackOptimizelyDecisions).toHaveBeenNthCalledWith(
                3,
                mockClient,
                mockComponentDecisions,
                mockComponentUserId,
                mockComponentUserAttributes,
            );
        });

        it('should use settings userId for settings tracking and component userId for component tracking', async () => {
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                mockSettingsDecisions,
                mockComponentDecisions,
                'layout-1',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(2));

            expect(mockTrackOptimizelyDecisions).toHaveBeenNthCalledWith(
                1,
                mockClient,
                mockSettingsDecisions,
                mockUserId,
                mockUserAttributes,
            );
            expect(mockTrackOptimizelyDecisions).toHaveBeenNthCalledWith(
                2,
                mockClient,
                mockComponentDecisions,
                mockComponentUserId,
                mockComponentUserAttributes,
            );
        });

        it('should track settings decisions even when disabled', async () => {
            const mixedDecisions = [...mockSettingsDecisions, mockSettingsDisabledDecision];

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                mixedDecisions,
                [],
                '',
                '',
                {},
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => {
                expect(mockTrackOptimizelyDecisions).toHaveBeenCalledWith(
                    mockClient,
                    mixedDecisions,
                    mockUserId,
                    mockUserAttributes,
                );
            });
        });

        it('should track component decisions even when disabled', async () => {
            const mixedComponentDecisions = [...mockComponentDecisions, mockComponentDisabledDecision];

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                mixedComponentDecisions,
                'layout-123',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => {
                expect(mockTrackOptimizelyDecisions).toHaveBeenCalledWith(
                    mockClient,
                    mixedComponentDecisions,
                    mockComponentUserId,
                    mockComponentUserAttributes,
                );
            });
        });

        it('should track when only disabled decisions are present', async () => {
            const onlyDisabledSettings = [mockSettingsDisabledDecision];
            const onlyDisabledComponent = [mockComponentDisabledDecision];

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                onlyDisabledSettings,
                onlyDisabledComponent,
                'layout-456',
                mockComponentUserId,
                mockComponentUserAttributes,
                jest.fn(),
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockTrackOptimizelyDecisions).toHaveBeenCalledTimes(2));

            expect(mockTrackOptimizelyDecisions).toHaveBeenNthCalledWith(
                1,
                mockClient,
                onlyDisabledSettings,
                mockUserId,
                mockUserAttributes,
            );

            expect(mockTrackOptimizelyDecisions).toHaveBeenNthCalledWith(
                2,
                mockClient,
                onlyDisabledComponent,
                mockComponentUserId,
                mockComponentUserAttributes,
            );
        });
    });

    describe('Decision Notification Listener', () => {
        it('should add notification listener when client is ready', async () => {
            const mockTrackFn = jest.fn();
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                [],
                '',
                '',
                {},
                mockTrackFn,
                undefined,
                jest.fn(),
                mockClient,
            );

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => {
                expect(mockAddNotificationListener).toHaveBeenCalledWith(
                    OptimizelyReactSDK.enums.NOTIFICATION_TYPES.DECISION,
                    expect.any(Function),
                );
            });
        });

        it('should not add notification listener when client is not initialized', () => {
            const mockTrackFn = jest.fn();
            mockStores = createMockStores(false, mockUserId, mockUserAttributes, [], [], '', '', {}, mockTrackFn);

            renderHook(() => useOptimizelyTracking());

            expect(mockAddNotificationListener).not.toHaveBeenCalled();
        });

        it('should call trackOptimizelyDecisionData when decision notification is received', async () => {
            const mockTrackFn = jest.fn();
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                [],
                '',
                '',
                {},
                mockTrackFn,
                undefined,
                jest.fn(),
                mockClient,
            );

            let capturedCallback: (data: DecisionListenerPayload) => void;
            mockAddNotificationListener.mockImplementation((type, callback) => {
                capturedCallback = callback;

                return 'listener-id-123';
            });

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockAddNotificationListener).toHaveBeenCalled());

            capturedCallback!(mockFlagDecisionNotification);

            expect(mockTrackFn).toHaveBeenCalledTimes(1);
            expect(mockTrackFn).toHaveBeenCalledWith(mockFlagDecisionNotification);
        });

        it('should handle multiple decision types (flag, ab-test)', async () => {
            const mockTrackFn = jest.fn();
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                [],
                '',
                '',
                {},
                mockTrackFn,
                undefined,
                jest.fn(),
                mockClient,
            );

            let capturedCallback: (data: DecisionListenerPayload) => void;
            mockAddNotificationListener.mockImplementation((type, callback) => {
                capturedCallback = callback;

                return 'listener-id-123';
            });

            renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockAddNotificationListener).toHaveBeenCalled());

            capturedCallback!(mockFlagDecisionNotification);
            expect(mockTrackFn).toHaveBeenNthCalledWith(1, mockFlagDecisionNotification);

            capturedCallback!(mockAbTestDecisionNotification);
            expect(mockTrackFn).toHaveBeenNthCalledWith(2, mockAbTestDecisionNotification);

            expect(mockTrackFn).toHaveBeenCalledTimes(2);
        });

        it('should remove notification listener when component unmounts', async () => {
            const mockTrackFn = jest.fn();
            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                [],
                '',
                '',
                {},
                mockTrackFn,
                undefined,
                jest.fn(),
                mockClient,
            );

            const listenerId = 'listener-id-456';
            mockAddNotificationListener.mockReturnValue(listenerId);

            const { unmount } = renderHook(() => useOptimizelyTracking());

            await waitFor(() => expect(mockAddNotificationListener).toHaveBeenCalled());

            unmount();

            expect(mockRemoveNotificationListener).toHaveBeenCalledWith(listenerId);
        });
    });

    describe('Client Store Integration', () => {
        it('should store client in layoutStore and make it accessible', () => {
            const mockSetClient = jest.fn();

            mockStores = createMockStores(
                true,
                mockUserId,
                mockUserAttributes,
                [],
                [],
                '',
                '',
                {},
                jest.fn(),
                undefined,
                jest.fn(),
                null,
                mockSetClient,
            );

            renderHook(() => useOptimizelyTracking());

            expect(mockSetClient).toHaveBeenCalledWith(mockClient);
            expect(mockSetClient).toHaveBeenCalledTimes(1);
        });
    });
});
