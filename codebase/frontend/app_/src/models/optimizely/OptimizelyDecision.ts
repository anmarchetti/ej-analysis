export interface IOptimizelyDecision {
    experimentKey: string | null;
    featureKey: string;
    isDisabled: boolean;
    variationKey: string | null;
    source?: OptimizelyDecisionSource;
}

export enum OptimizelyDecisionSource {
    Default = 'Default',
    ComponentPersonalization = 'ComponentPersonalization',
    ComponentParamFlag = 'ComponentParamFlag',
}
