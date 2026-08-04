import { FC } from 'react';

import { ITestConfig } from './models';

export interface IVariantProps {
    children?: JSX.Element;
    default?: boolean;
    testConfig?: ITestConfig;
    testVariant?: string;
}

export const Variant: FC<IVariantProps> = ({ children }) => children ?? null;

export default Variant;
