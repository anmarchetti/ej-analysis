import React, { FC, useMemo } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { TWO } from 'code/commonNumbers';
import useStore from 'frontend/hooks/useStore';
import { PricePromiseInfoFields } from 'models/data/PricePromiseInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Checkbox from 'frontend/components/common/Checkbox';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { IPricePromiseFields } from 'frontend/components/renderings/PricePromise/interfaces';
import styles from 'frontend/components/renderings/PricePromise/PricePromise.module.scss';
import {
    getCheckBoxes,
    getFieldLabel,
    isFieldRequired,
} from 'frontend/components/renderings/PricePromise/pricePromise.utils';
import { PricePromiseStore } from 'frontend/components/renderings/PricePromise/PricePromiseStore';

export type TCheckboxesSectionProps = {
    fields: IPricePromiseFields;
    store: PricePromiseStore;
};

export const CheckboxesSection: FC<TCheckboxesSectionProps> = ({ store, fields }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const checkBoxes = useMemo(() => getCheckBoxes(fields), [fields]);

    const { CheckboxSectionTitle, CheckboxSectionDescription } = fields;

    /** Show checkbox error after clicking on submit (i.e. forceError = true)  */
    const hasCheckboxError = (field: PricePromiseInfoFields): boolean =>
        store.forceErrors && !store.pricePromiseInfo.isValidField(field);

    const { onChangeField, isValidCheckboxSet } = store.pricePromiseInfo;
    const isErrorVisible = store.forceErrors && !isValidCheckboxSet;

    return (
        <div className={styles.checkboxes} data-tid='checkboxes-section'>
            <Text className={styles.sectionTitle} tag='h3' field={CheckboxSectionTitle} />
            <RichTextWithLinks className={styles.text} field={CheckboxSectionDescription} />

            {checkBoxes.map(({ checkbox, label }, index) => {
                const isCheckboxFieldRequired = isFieldRequired(checkbox, store);

                if (!label) {
                    return null;
                }

                return (
                    <>
                        <Checkbox
                            key={checkbox}
                            onChange={(e): void => onChangeField(checkbox, e.target.checked)}
                            checked={!!store.pricePromiseInfo[checkbox]}
                            label={getFieldLabel(label, isCheckboxFieldRequired)}
                            hasError={hasCheckboxError(checkbox)}
                            small
                            tick
                            textRight
                            className={styles.checkbox}
                        />
                        {index === checkBoxes.length - TWO && isErrorVisible && (
                            <ErrorMessage
                                message={getPhrase(SitecoreDictionary.PricePromiseErrorsCheckboxesRequired)}
                                errorMessageClass={classNames(styles.checkboxError, 'error')}
                                IsDesc
                                icon={
                                    <i className='error-message__icon'>
                                        <SvgWarningFilled />
                                    </i>
                                }
                            />
                        )}
                    </>
                );
            })}
        </div>
    );
};

export default observer(CheckboxesSection);
