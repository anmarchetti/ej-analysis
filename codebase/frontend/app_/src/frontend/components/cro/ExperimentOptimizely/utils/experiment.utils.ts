import { IExperimentConfig, TOptimizelyData } from 'frontend/components/cro/ExperimentOptimizely/models';

export interface IActiveExperiment {
    activeVariantId: string;
    config: IExperimentConfig;
}

export const getActiveVariantAndMatchedConfig = (
    experimentConfigs: IExperimentConfig[],
    optimizelyData: TOptimizelyData,
): IActiveExperiment => {
    const activePages = optimizelyData.get('state')!.getPageStates({
        isActive: true,
    });
    const activeExperiments = optimizelyData.get('state')!.getExperimentStates({
        isActive: true,
    });
    const variationMap = optimizelyData.get('state')!.getVariationMap();

    let activeVariantId;
    let config;
    for (let i = 0; i < experimentConfigs.length; i++) {
        const item = experimentConfigs[i];
        const experiment = activeExperiments[item.experimentId];
        const isCurrentPageActive = !!activePages[item.pagesId];
        const variantId = variationMap[item.experimentId]?.id;

        if (experiment?.isActive && isCurrentPageActive && variantId) {
            activeVariantId = variantId;
            config = item;
            break;
        }
    }

    return { activeVariantId, config };
};
