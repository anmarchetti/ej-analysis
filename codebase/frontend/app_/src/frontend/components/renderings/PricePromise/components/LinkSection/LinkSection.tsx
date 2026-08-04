import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { PricePromiseInfoFields } from 'models/data/PricePromiseInfo';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import Callout from 'frontend/components/common/Callout/Callout';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import { IPricePromiseFields } from 'frontend/components/renderings/PricePromise/interfaces';
import styles from 'frontend/components/renderings/PricePromise/PricePromise.module.scss';
import { getFieldLabel, isFieldRequired } from 'frontend/components/renderings/PricePromise/pricePromise.utils';
import { PricePromiseStore } from 'frontend/components/renderings/PricePromise/PricePromiseStore';

export type TLinkSectionProps = {
    fields: IPricePromiseFields;
    store: PricePromiseStore;
};

export const LinkSection: FC<TLinkSectionProps> = ({ store, fields }) => {
    const { LinkFieldLabel, LinkSectionTitle, LinkTooltip } = fields;

    const { validateField, onChangeField, link } = store.pricePromiseInfo;
    const isLinkFieldRequired = isFieldRequired(PricePromiseInfoFields.Link, store);

    return (
        <>
            <Text className={styles.sectionTitle} tag='h3' field={LinkSectionTitle} />

            <ValidatableField
                onChange={(value): void => onChangeField(PricePromiseInfoFields.Link, value)}
                value={link}
                label={getFieldLabel(LinkFieldLabel.value, isLinkFieldRequired)}
                errors={validateField(PricePromiseInfoFields.Link)}
                forceError={store.forceErrors}
                id={PricePromiseInfoFields.Link}
                autoComplete={false}
                shouldTrimOnBlur
                fieldClass={LinkTooltip.value ? 'form-field--inner-callout' : undefined}
                required={isLinkFieldRequired}
                containerClass={styles.fieldMargin}
            >
                {LinkTooltip.value && (
                    <Callout
                        content={<RichTextWithLinks field={LinkTooltip} />}
                        orientation={CalloutOrientation.Top}
                        position={CalloutPosition.Center}
                        isShownOnHover
                    />
                )}
            </ValidatableField>
        </>
    );
};

export default observer(LinkSection);
