import { FC } from 'react';

import { ExperimentVariants } from 'models/enum/cro/Experiment';

export interface IVariantProps {
    variant: ExperimentVariants;
    children?: JSX.Element;
}

export const Variant: FC<IVariantProps> = ({ children }) => children ?? null;

export default Variant;
