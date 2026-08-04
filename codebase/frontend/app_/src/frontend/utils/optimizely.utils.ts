import type { ReactSDKClient } from '@optimizely/react-sdk';

import { IOptimizelyDecision } from 'models/optimizely';

/**
 * Track Optimizely decisions by firing impression events
 *
 * Note: This function only tracks impressions. The backend has already made
 * all decisions - the frontend's job is just to fire tracking events.
 *
 * @param client - Optimizely SDK client instance
 * @param decisions - Array of decisions to track (from backend)
 * @param userId - User ID for tracking attribution
 * @param userAttributes - User attributes for segmentation
 * @returns Promise that resolves when tracking completes or fails silently
 */
export const trackOptimizelyDecisions = async (
    client: ReactSDKClient,
    decisions: IOptimizelyDecision[],
    userId: string,
    userAttributes: Record<string, any>,
): Promise<void> => {
    try {
        await client.onReady();

        const featureKeys = decisions.map(decision => decision.featureKey);

        if (featureKeys.length === 0) {
            return;
        }

        client.decideForKeys(featureKeys, [], userId, userAttributes);
    } catch {
        // Silently fail - tracking errors should not break the app
    }
};
