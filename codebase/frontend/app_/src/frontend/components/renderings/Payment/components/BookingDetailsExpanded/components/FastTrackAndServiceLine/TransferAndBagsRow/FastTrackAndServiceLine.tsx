import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import SvgFastTrackFilled from 'frontend/components/icons-new/FastTrackFilled';
import SvgPhoneFilled from 'frontend/components/icons-new/PhoneFilled';

import styles from './FastTrackAndServiceLine.module.scss';

export interface IFastTrackAndServiceLineFields {
    FastTrackLabel?: ISitecoreField<string>;
    ServiceLineLabel?: ISitecoreField<string>;
}
export type TFastTrackAndServiceLineProps = IFastTrackAndServiceLineFields;

export const FastTrackAndServiceLine: FC<TFastTrackAndServiceLineProps> = ({ FastTrackLabel, ServiceLineLabel }) => (
    <div className={styles.row}>
        <div className={styles.blockItem} data-tid='fast-track-service-line'>
            <SvgFastTrackFilled className={styles.icon} data-tid='icon' />
            <Text field={FastTrackLabel} tag='span' className={styles.blockTitle} data-tid='label' />
        </div>
        <div className={styles.blockItem} data-tid='service-line'>
            <SvgPhoneFilled className={styles.icon} data-tid='icon' />
            <Text field={ServiceLineLabel} tag='span' className={styles.blockTitle} data-tid='label' />
        </div>
    </div>
);

export default FastTrackAndServiceLine;
