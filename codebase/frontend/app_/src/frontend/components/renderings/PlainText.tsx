import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import styles from './PlainText.module.scss';

export interface IPlainTextSitecoreFields {
    'Plain Text': ISitecoreField<string>;
}

export interface IPlainTextSitecoreParams {
    Tag: string;
}

const PlainText: FC<ISitecoreComponent<IPlainTextSitecoreFields, IPlainTextSitecoreParams>> = props =>
    props.fields?.['Plain Text'] ? (
        <Text field={props.fields['Plain Text']} tag={props.params.Tag} className={styles.plainText} />
    ) : null;

export default PlainText;
