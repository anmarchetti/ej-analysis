export interface IExperimentConfig {
    experimentId: string;
    originalVariant: string;
    pagesId: string;
    variantA: string;
    campaignId?: string;
    variantB?: string;
    variantC?: string;
    variantD?: string;
    variantE?: string;
    variantF?: string;
}

export type TOptimizelyData = Map<
    'state',
    {
        getExperimentStates: (arg: object) => void;
        getPageStates: (arg: object) => void;
        getVariationMap: () => void;
    }
>;
