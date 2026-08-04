export const createOptimizelyDataMock = (pageStates, experimentStates, variationMap) => ({
    get: jest.fn().mockReturnValue({
        getPageStates: jest.fn().mockReturnValue(pageStates),
        getExperimentStates: jest.fn().mockReturnValue(experimentStates),
        getVariationMap: jest.fn().mockReturnValue(variationMap),
    }),
});
