import React, { ComponentType, JSX } from 'react';

import useOptimizelyExperiment from 'frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyExperiment';
import { IExperimentConfig } from 'frontend/components/cro/ExperimentOptimizely/models';

const withOptimizelyExperiment =
    (Component: ComponentType, experimentConfigs: IExperimentConfig[]) =>
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    (props: any): JSX.Element => {
        const experiment = useOptimizelyExperiment(experimentConfigs);

        return <Component experiment={experiment} {...props} />;
    };

export default withOptimizelyExperiment;
