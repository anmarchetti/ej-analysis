export interface ISitecorePersonalizeExperiment extends ISitecorePersonalizeExperimentBase {
    uniqueId: string;
}

export interface ISitecorePersonalizeToken {
    token: string;
    url: string;
}

export interface ISitecorePersonalizeExperimentBase {
    ctas: ISitecorePersonalizeToken[];
    friendlyId: string;
    selectionAttr: string;
}
