import React from 'react';

import { ExperimentVariants } from 'models/enum/cro/Experiment';

import useOptimizelyExperiment from './hooks/useOptimizelyExperiment';
import { IExperimentConfig } from './models';
import { IVariantProps } from './Variant';

type TVariantElement = React.ReactElement<IVariantProps, 'Variant'>;

interface IExperimentProps {
    children: TVariantElement | TVariantElement[];
    experimentConfigs: IExperimentConfig[];
}

export const Experiment = ({ children, experimentConfigs }: IExperimentProps): JSX.Element => {
    const childArray = React.Children.toArray(children);
    const originalVariant = childArray.find(
        (child: TVariantElement) => child.props.variant === ExperimentVariants.OriginalVariant,
    ) as TVariantElement;

    const experiment = useOptimizelyExperiment(experimentConfigs);

    if (!experiment) {
        return originalVariant;
    }

    const { activeVariantId, config } = experiment;

    const getChildVariant = (variant: ExperimentVariants) =>
        childArray.find(
            (child: TVariantElement) => React.isValidElement(child) && child.props.variant === variant,
        ) as TVariantElement;

    const getVariantComponent = (): TVariantElement | undefined => {
        switch (activeVariantId) {
            case config.variantA: {
                return getChildVariant(ExperimentVariants.VariantA);
            }
            case config.variantB: {
                return getChildVariant(ExperimentVariants.VariantB);
            }
            case config.variantC: {
                return getChildVariant(ExperimentVariants.VariantC);
            }
            case config.variantD: {
                return getChildVariant(ExperimentVariants.VariantD);
            }
            case config.variantE: {
                return getChildVariant(ExperimentVariants.VariantE);
            }
            case config.variantF: {
                return getChildVariant(ExperimentVariants.VariantF);
            }
            default:
                return originalVariant;
        }
    };

    let variantComponent;

    if (config && activeVariantId) {
        variantComponent = getVariantComponent();
    }

    return variantComponent || originalVariant;
};

export default Experiment;
