import { FunctionComponent } from 'react';

import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecorePersonalizeExperimentBase } from 'models/sitecore/ISitecorePersonalizeExperiment';
import CreditAnchor from 'frontend/components/common/CreditAnchor/CreditAnchor';
import BoxWithRoundel from 'frontend/components/renderings/GenericHeroBanner/components/BoxWithRoundel/BoxWithRoundel';

import styles from './HeroBannerLightboxWithRoundel.module.scss';

export interface IHeroBannerLightboxWithRoundelProps {
    experiment: ISitecorePersonalizeExperimentBase;
    fields: IHeroBannerFields;
    onClick: (
        e: React.MouseEvent | React.KeyboardEvent,
        link: ISitecoreField<ISitecoreLink>,
        position?: string,
    ) => void;
}

const HeroBannerLightboxWithRoundel: FunctionComponent<IHeroBannerLightboxWithRoundelProps> = ({
    fields,
    experiment,
    onClick,
}) => (
    <div className={styles.wrapper}>
        <BoxWithRoundel fields={fields} experiment={experiment} onClick={onClick} />
        <div className={styles.creditWrapper}>
            <CreditAnchor fields={fields} isPillStyle className={styles.credit} />
        </div>
    </div>
);

export default HeroBannerLightboxWithRoundel;
