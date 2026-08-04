import React from 'react';

import useExperiment from './hooks/useExperiment';
import useVariantValidate from './hooks/useVariantValidate';
import { IVariantProps } from './Variant';
type TVariantElement = React.ReactElement<IVariantProps, 'Variant'>;

interface IExperimentProps {
    children: TVariantElement | TVariantElement[];
    testId: string | number;
}

export const Experiment = ({ children, testId }: IExperimentProps): JSX.Element | null => {
    const childArray = React.Children.toArray(children);
    const activeVariant = useExperiment(testId);
    const isTestValid = useVariantValidate(activeVariant?.testConfig);

    if (isTestValid) {
        const activeComponent = childArray.find(
            (child: TVariantElement) =>
                React.isValidElement(child) &&
                (activeVariant && isTestValid
                    ? child.props.testVariant === activeVariant?.testVariant
                    : child.props.default),
        ) as TVariantElement | undefined;

        return activeComponent || null;
    }

    return (childArray.find((child: TVariantElement) => child.props.default) as TVariantElement | undefined) || null;
};

export default Experiment;
