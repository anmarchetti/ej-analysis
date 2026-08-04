import React from 'react';
import { render, screen } from '@testing-library/react';

import { ExperimentVariants } from 'models/enum/cro/Experiment';

import { IActiveExperiment } from './utils/experiment.utils';
import Experiment from './Experiment';
import { IExperimentConfig } from './models';
import Variant from './Variant';

const experimentConfigs: Array<IExperimentConfig> = [
    {
        campaignId: '26751540118',
        experimentId: '26732560162',
        originalVariant: '26724670134',
        pagesId: '26735980108',
        variantA: '26759020076',
    },
    {
        campaignId: '26704110028',
        experimentId: '26605591062',
        originalVariant: '26576310721',
        pagesId: '26603010759',
        variantA: '26620550450',
    },
];

const ExperimentRender = (experimentConfigs: IExperimentConfig[]) => (
    <Experiment experimentConfigs={experimentConfigs}>
        <Variant variant={ExperimentVariants.OriginalVariant}>
            <div>Original Variant</div>
        </Variant>
        <Variant variant={ExperimentVariants.VariantA}>
            <div>Variant A</div>
        </Variant>
        <Variant variant={ExperimentVariants.VariantB}>
            <div>Variant B</div>
        </Variant>
        <Variant variant={ExperimentVariants.VariantC}>
            <div>Variant C</div>
        </Variant>
        <Variant variant={ExperimentVariants.VariantD}>
            <div>Variant D</div>
        </Variant>
        <Variant variant={ExperimentVariants.VariantE}>
            <div>Variant E</div>
        </Variant>
        <Variant variant={ExperimentVariants.VariantF}>
            <div>Variant F</div>
        </Variant>
    </Experiment>
);

let mockOptimizelyData: IActiveExperiment | undefined;
jest.mock('frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyExperiment', () =>
    jest.fn(() => mockOptimizelyData),
);

describe('Experiment Component', () => {
    beforeEach(() => {
        mockOptimizelyData = undefined;
    });

    it('renders original variant when no configs provided', () => {
        render(ExperimentRender([]));

        expect(screen.getByText('Original Variant')).toBeInTheDocument();
    });

    it('renders original variant when no optimizelyData', () => {
        render(ExperimentRender(experimentConfigs));

        expect(screen.getByText('Original Variant')).toBeInTheDocument();
    });

    it('renders the correct variant based on experimentConfigs', () => {
        mockOptimizelyData = {
            activeVariantId: experimentConfigs[0].variantA,
            config: experimentConfigs[0],
        };
        render(ExperimentRender(experimentConfigs));

        expect(screen.getByText('Variant A')).toBeInTheDocument();
    });
});
