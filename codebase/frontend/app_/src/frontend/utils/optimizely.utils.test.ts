import type { ReactSDKClient } from '@optimizely/react-sdk';

import { IOptimizelyDecision } from 'models/optimizely';

import { trackOptimizelyDecisions } from './optimizely.utils';

describe('optimizely.utils', () => {
    describe('trackOptimizelyDecisions', () => {
        let mockClient: ReactSDKClient;
        let mockDecideForKeys: jest.Mock;
        let mockOnReady: jest.Mock;

        beforeEach(() => {
            mockDecideForKeys = jest.fn();
            mockOnReady = jest.fn(() => Promise.resolve({ success: true }));
            mockClient = {
                decideForKeys: mockDecideForKeys,
                onReady: mockOnReady,
            } as unknown as ReactSDKClient;
        });

        it('should call decideForKeys with correct parameters', async () => {
            const decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature1',
                    variationKey: 'var_a',
                    experimentKey: 'exp1',
                    isDisabled: false,
                },
            ];
            const userId = 'user123';
            const userAttributes = { site: 'Holidays' };

            await trackOptimizelyDecisions(mockClient, decisions, userId, userAttributes);

            expect(mockDecideForKeys).toHaveBeenCalledWith(['feature1'], [], userId, userAttributes);
        });

        it('should wait for client.onReady before tracking', async () => {
            const decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature1',
                    variationKey: 'var_a',
                    experimentKey: 'exp1',
                    isDisabled: false,
                },
            ];

            await trackOptimizelyDecisions(mockClient, decisions, 'user123', {});

            expect(mockOnReady).toHaveBeenCalled();
            expect(mockDecideForKeys).toHaveBeenCalled();
        });

        it('should not call decideForKeys when decisions array is empty', async () => {
            await trackOptimizelyDecisions(mockClient, [], 'user123', {});

            expect(mockOnReady).toHaveBeenCalled();
            expect(mockDecideForKeys).not.toHaveBeenCalled();
        });

        it('should track multiple decisions in a single call', async () => {
            const decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature1',
                    variationKey: 'var_a',
                    experimentKey: 'exp1',
                    isDisabled: false,
                },
                {
                    featureKey: 'feature2',
                    variationKey: 'var_b',
                    experimentKey: 'exp2',
                    isDisabled: false,
                },
            ];

            await trackOptimizelyDecisions(mockClient, decisions, 'user123', {});

            expect(mockDecideForKeys).toHaveBeenCalledWith(['feature1', 'feature2'], [], 'user123', {});
        });

        it('should handle decisions with null experimentKey (flag-only features)', async () => {
            const decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'flag_only',
                    variationKey: null,
                    experimentKey: null,
                    isDisabled: false,
                },
            ];

            await trackOptimizelyDecisions(mockClient, decisions, 'user123', {});

            expect(mockDecideForKeys).toHaveBeenCalledWith(['flag_only'], [], 'user123', {});
        });

        it('should handle decideForKeys errors gracefully', async () => {
            mockDecideForKeys.mockImplementation(() => {
                throw new Error('Tracking failed');
            });

            const decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature1',
                    variationKey: 'var_a',
                    experimentKey: 'exp1',
                    isDisabled: false,
                },
            ];

            await expect(trackOptimizelyDecisions(mockClient, decisions, 'user123', {})).resolves.not.toThrow();

            expect(mockDecideForKeys).toHaveBeenCalled();
        });

        it('should handle onReady errors gracefully', async () => {
            mockOnReady.mockRejectedValue(new Error('Client not ready'));

            const decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature1',
                    variationKey: 'var_a',
                    experimentKey: 'exp1',
                    isDisabled: false,
                },
            ];

            await expect(trackOptimizelyDecisions(mockClient, decisions, 'user123', {})).resolves.not.toThrow();

            expect(mockDecideForKeys).not.toHaveBeenCalled();
        });

        it('should preserve userId and userAttributes in tracking call', async () => {
            const decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'feature1',
                    variationKey: 'var_a',
                    experimentKey: 'exp1',
                    isDisabled: false,
                },
            ];
            const userId = 'oeu1754639239050r0.6723461017688855321';
            const userAttributes = { site: 'Holidays', language: 'en' };

            await trackOptimizelyDecisions(mockClient, decisions, userId, userAttributes);

            expect(mockDecideForKeys).toHaveBeenCalledWith(['feature1'], [], userId, userAttributes);
        });

        it('should work with real-world settings decision structure', async () => {
            const decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'sitesettings',
                    variationKey: '50_results',
                    experimentKey: 'search_results',
                    isDisabled: false,
                },
            ];

            await trackOptimizelyDecisions(mockClient, decisions, 'user123', { site: 'Holidays' });

            expect(mockDecideForKeys).toHaveBeenCalledWith(['sitesettings'], [], 'user123', { site: 'Holidays' });
        });

        it('should work with real-world component decision structure', async () => {
            const decisions: IOptimizelyDecision[] = [
                {
                    featureKey: 'component_test',
                    variationKey: 'variant_a',
                    experimentKey: 'test',
                    isDisabled: false,
                },
            ];

            await trackOptimizelyDecisions(mockClient, decisions, 'user123', { language: 'en' });

            expect(mockDecideForKeys).toHaveBeenCalledWith(['component_test'], [], 'user123', { language: 'en' });
        });
    });
});
