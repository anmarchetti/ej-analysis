import { IExperimentConfig } from 'frontend/components/cro/ExperimentOptimizely/models';

import { getActiveVariantAndMatchedConfig } from './experiment.utils';

describe('getActiveVariantAndMatchedConfig', () => {
    it('should return the active variant and config', () => {
        const experimentConfigs: Array<IExperimentConfig> = [
            {
                campaignId: '26704110028',
                experimentId: '26605591062',
                originalVariant: '26576310721',
                pagesId: '26603010759',
                variantA: '26620550450',
            },
        ];

        const optimizelyData = new Map();
        optimizelyData.set('state', {
            getPageStates: jest.fn().mockReturnValue({
                '26603010759': {
                    id: '26603010759',
                    name: 'URL Targeting for LOCAL EHD-240 - TripAdvisor external linking (Desktop)',
                    isActive: true,
                },
            }),
            getExperimentStates: jest.fn().mockReturnValue({
                '26605591062': {
                    isActive: true,
                    experimentName: 'LOCAL EHD-240 - TripAdvisor external linking (Desktop)',
                },
            }),
            getVariationMap: jest.fn().mockReturnValue({
                '26605591062': {
                    id: '26620550450',
                    name: 'Variation #1',
                    index: 1,
                },
            }),
        });

        const result = getActiveVariantAndMatchedConfig(experimentConfigs, optimizelyData);

        const expectedResult = { activeVariantId: '26620550450', config: experimentConfigs[0] };

        expect(result).toEqual(expectedResult);
    });
});
