import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

import styles from './AmendNoTransfersPopup.module.scss';

interface INoTransfersPopupFields {
    CTA: ISitecoreField<ISitecoreLink>;
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

interface INoTransfersPopupProps extends ISitecoreComponent<INoTransfersPopupFields> {
    onClose: () => void;
    startDate?: string;
}

export const NoTransfersPopup: FC<INoTransfersPopupProps> = ({ startDate, fields, onClose }) => {
    if (!fields) {
        return null;
    }

    const { Title, Description, CTA } = fields;

    const formattedDate = startDate ? formatDateL10n(startDate, DATE_FORMATS.L) : '';
    const description = Tokenizer.replaceToken(Description?.value, Tokens.Date, formattedDate);

    return (
        <Popup bodyClass={styles['popup-body']} id='amend-no-transfer-popup-body' showCloseButton onClose={onClose}>
            {!!Title?.value && (
                <Text data-tid={'amend-no-transfer-popup-title'} className={styles.title} field={Title} tag='h2' />
            )}
            {!!description && (
                <RichTextWithLinks
                    className={styles.description}
                    dataId='amend-no-transfer-popup-description'
                    field={{ value: description }}
                />
            )}
            {!!CTA?.value?.href && (
                <RouterLink link={CTA} dataId={'amend-no-transfer-popup-cta'} className={`btn ${styles.button}`}>
                    {CTA.value.text}
                </RouterLink>
            )}
        </Popup>
    );
};

export default NoTransfersPopup;
