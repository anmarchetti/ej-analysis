import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';

import styles from './BottomAlert.module.scss';

export interface IBottomAlertProps {
    text: ISitecoreField<string>;
}

export const BottomAlert: FC<IBottomAlertProps> = ({ text }) => (
    <div data-tid='no-extra-bags-alert' className={styles.alert}>
        <SvgInfoFilled data-tid='icon' />
        <Text field={text} tag='div' data-tid='text' />
    </div>
);

export default BottomAlert;
