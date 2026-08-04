import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { SCREENSHOT_FILE_TYPES } from 'code/validation.config';
import useStore from 'frontend/hooks/useStore';
import { PricePromiseInfoFields } from 'models/data/PricePromiseInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ValidatableFileUploadField from 'frontend/components/common/ValidatableFileUploadField';
import { IPricePromiseFields } from 'frontend/components/renderings/PricePromise/interfaces';
import styles from 'frontend/components/renderings/PricePromise/PricePromise.module.scss';
import { isFieldRequired } from 'frontend/components/renderings/PricePromise/pricePromise.utils';
import { PricePromiseStore } from 'frontend/components/renderings/PricePromise/PricePromiseStore';

export type TFileUploadSectionProps = {
    fields: IPricePromiseFields;
    store: PricePromiseStore;
};

export const FileUploadSection: FC<TFileUploadSectionProps> = ({ store, fields }) => {
    const { isTradePortal, getPhrase } = useStore(stores => ({
        isTradePortal: stores.layoutStore.isTradePortal,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { FileUploadTitle, FileUploadDescription, FileUploadButton } = fields;

    const { validateField, onChangeField, screenshots } = store.pricePromiseInfo;

    return (
        <>
            <Text className={styles.sectionTitle} tag='h3' field={FileUploadTitle} />
            <RichTextWithLinks className={styles.text} field={FileUploadDescription} />

            <ValidatableFileUploadField
                files={screenshots}
                onChange={(files): void => onChangeField(PricePromiseInfoFields.Screenshots, files)}
                label={FileUploadButton.value}
                errors={validateField(PricePromiseInfoFields.Screenshots)}
                forceError={store.forceErrors}
                acceptFileTypes={SCREENSHOT_FILE_TYPES}
                id={PricePromiseInfoFields.Screenshots}
                allowedUploadedFileNumb={5}
                required={isFieldRequired(PricePromiseInfoFields.Screenshots, store)}
                multiple
                isTradePortal={isTradePortal}
                errorLabel={getPhrase(SitecoreDictionary.PricePromiseErrorsScreenshotInvalid)}
            />
        </>
    );
};

export default observer(FileUploadSection);
