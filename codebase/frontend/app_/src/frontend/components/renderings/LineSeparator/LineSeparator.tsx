import { getPaddingSizeClassName } from 'frontend/utils/componentStylesCustomisation.utils';
import { ContainerPaddingOptions } from 'models/enum/CustomisableComponentsParameters';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import styles from './LineSeparator.module.scss';

interface ILineSeparatorParams {
    PaddingSize?: ContainerPaddingOptions;
}

type TLineSeparatorProps = ISitecoreComponent<undefined, ILineSeparatorParams>;

const LineSeparator = ({ params }: TLineSeparatorProps) => (
    <div className={getPaddingSizeClassName(params?.PaddingSize) || ''}>
        <div className={styles.line} data-tid='line-separator' />
    </div>
);

export default LineSeparator;
