import { useEffect, useRef } from 'react';
import type { DecisionListenerPayload } from '@optimizely/optimizely-sdk';
import { createInstance, enums, setLogLevel } from '@optimizely/react-sdk';

import { envPublic } from 'code/env';
import settings from 'code/settings';
import useStore from 'frontend/hooks/useStore';
import { getCookie, listenCookieChange } from 'frontend/utils/cookies.utils';
import { trackOptimizelyDecisions } from 'frontend/utils/optimizely.utils';

const COOKIE_LISTENER_INTERVAL = 1000;

/**
 * Hook to initialize Optimizely Feature Experimentation SDK and fire tracking events
 * Should be called once per app cycle (in Layout.tsx)
 *
 * This hook handles:
 * - Checking if Optimizely is enabled from backend settings
 * - Initializing the SDK client with environment SDK key
 * - Listening for Personalization cookie changes and initializing when accepted
 * - Firing impression tracking events for two types of experiments:
 *   1. Settings-level experiments: Tracked ONCE per app lifecycle
 *   2. Component-level experiments: Tracked ONCE per unique feature key (across all layouts)
 * - Listening for decision notifications from Optimizely SDK and track them in data layer
 * - Note: Backend already made decisions; frontend only tracks impressions
 *
 * This hook has no return value - it only performs side effects
 */
export const useOptimizelyTracking = (): void => {
    const {
        isOptimizelyEnabled,
        optimizelyUserId,
        optimizelyUserAttributes,
        optimizelySettingsDecisions,
        untrackedOptimizelyComponentDecisions,
        optimizelyComponentUserId,
        optimizelyComponentUserAttributes,
        layoutId,
        trackOptimizelyDecisionData,
        addTrackedOptimizelyComponentFeatureKeys,
        optimizelyClient,
        setOptimizelyClient,
    } = useStore(stores => ({
        isOptimizelyEnabled: stores.layoutStore.isOptimizelyEnabled,
        optimizelyUserId: stores.layoutStore.optimizelyUserId,
        optimizelyUserAttributes: stores.layoutStore.optimizelyUserAttributes,
        optimizelySettingsDecisions: stores.layoutStore.optimizelySettingsDecisions,
        untrackedOptimizelyComponentDecisions: stores.layoutStore.untrackedOptimizelyComponentDecisions,
        optimizelyComponentUserId: stores.layoutStore.optimizelyComponentUserId,
        optimizelyComponentUserAttributes: stores.layoutStore.optimizelyComponentUserAttributes,
        layoutId: stores.layoutStore.layoutId,
        trackOptimizelyDecisionData: stores.trackingStore.trackOptimizelyDecisionData,
        addTrackedOptimizelyComponentFeatureKeys: stores.layoutStore.addTrackedOptimizelyComponentFeatureKeys,
        optimizelyClient: stores.layoutStore.optimizelyClient,
        setOptimizelyClient: stores.layoutStore.setOptimizelyClient,
    }));

    const hasTrackedSettings = useRef(false);

    // Initialize SDK client and listen for cookie changes
    useEffect(() => {
        const sdkKey = envPublic.OPTIMIZELY_SDK_KEY;

        const tryInitialize = (): void => {
            if (
                optimizelyClient ||
                !isOptimizelyEnabled ||
                !sdkKey ||
                getCookie(settings.Cookies.Personalization) !== '1'
            ) {
                return;
            }

            const client = createInstance({ sdkKey });
            setOptimizelyClient(client);
        };

        tryInitialize();

        const clearIntervalCallback = listenCookieChange(
            settings.Cookies.Personalization,
            () => {
                tryInitialize();
            },
            COOKIE_LISTENER_INTERVAL,
        );

        return clearIntervalCallback;

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOptimizelyEnabled, setOptimizelyClient]);

    // Set Optimizely log level to suppress console noise
    useEffect(() => {
        setLogLevel('error');
    }, []);

    // Track settings decisions - fires ONCE per app lifecycle
    useEffect(() => {
        if (hasTrackedSettings.current || !optimizelyClient || optimizelySettingsDecisions.length === 0) {
            return;
        }

        trackOptimizelyDecisions(
            optimizelyClient,
            optimizelySettingsDecisions,
            optimizelyUserId,
            optimizelyUserAttributes,
        ).then(() => {
            hasTrackedSettings.current = true;
        });
    }, [optimizelyClient, optimizelySettingsDecisions, optimizelyUserId, optimizelyUserAttributes]);

    // Track component decisions - fires ONCE per unique feature key
    useEffect(() => {
        if (!optimizelyClient || !layoutId || untrackedOptimizelyComponentDecisions.length === 0) {
            return;
        }

        trackOptimizelyDecisions(
            optimizelyClient,
            untrackedOptimizelyComponentDecisions,
            optimizelyComponentUserId,
            optimizelyComponentUserAttributes,
        ).then(() => {
            const featureKeys = untrackedOptimizelyComponentDecisions.map(d => d.featureKey);
            addTrackedOptimizelyComponentFeatureKeys(featureKeys);
        });
    }, [
        layoutId,
        optimizelyClient,
        untrackedOptimizelyComponentDecisions,
        optimizelyComponentUserId,
        optimizelyComponentUserAttributes,
        addTrackedOptimizelyComponentFeatureKeys,
    ]);

    // Listen for decision notifications from Optimizely SDK
    useEffect(() => {
        if (!optimizelyClient) {
            return;
        }

        const onDecision = (notificationData: DecisionListenerPayload): void => {
            trackOptimizelyDecisionData(notificationData);
        };

        const listenerId = optimizelyClient.notificationCenter.addNotificationListener(
            enums.NOTIFICATION_TYPES.DECISION,
            onDecision,
        );

        return () => {
            optimizelyClient.notificationCenter.removeNotificationListener(listenerId);
        };
    }, [optimizelyClient, trackOptimizelyDecisionData]);
};
