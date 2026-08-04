import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer, useLocalStore } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { PricePromiseStore } from 'frontend/components/renderings/PricePromise/PricePromiseStore';

import BookingDetailsSection from './components/BookingDetailsSection/BookingDetailsSection';
import CheckboxesSection from './components/CheckboxesSection/CheckboxesSection';
import FileUploadSection from './components/FileUploadSection/FileUploadSection';
import LinkSection from './components/LinkSection/LinkSection';
import PricePromiseSuccessMessage from './components/PricePromiseSuccessMessage/PricePromiseSuccessMessage';
import { IPricePromiseFields } from './interfaces';

import styles from './PricePromise.module.scss';

export type TPricePromiseProps = ISitecoreComponent<IPricePromiseFields>;

export const PricePromise: FC<TPricePromiseProps> = ({ fields }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const store = useLocalStore(() => new PricePromiseStore(!!fields?.ShowABTAMembershipCheckbox.value));

    if (!fields) {
        return null;
    }

    const { Title, TopDescription, Description, RequestText, RequestTitle } = fields;

    const onSubmitForm = async (event?: React.MouseEvent | React.FormEvent): Promise<void> => {
        event?.preventDefault();

        if (store.isFormValid) {
            try {
                await store.submitPricePromise();
            } catch (e) {
                scrollIntoErrors();
            }
        } else {
            scrollIntoErrors();
        }
    };

    const scrollIntoErrors = async (): Promise<void> => {
        // Trigger UI update before scroll
        await store.toggleForceErrors(true);
        // Scroll to invalid element
        scrollToErrorBlock();
    };

    return (
        <div className={styles.pricePromise}>
            {/* Don't remove key! It's used for remounting component. */}
            <form key={store.formKey} onSubmit={onSubmitForm} data-tid='price-promise-forms'>
                <RichTextWithLinks className={styles.text} field={TopDescription} />
                <Text className={styles.title} tag='h2' field={Title} data-tid='form-title' />
                <RichTextWithLinks className={styles.text} field={Description} dataId='form-description' />

                <BookingDetailsSection store={store} fields={fields} />
                <CheckboxesSection store={store} fields={fields} />
                <LinkSection fields={fields} store={store} />
                <FileUploadSection fields={fields} store={store} />

                {store.isPricePromiseFailed && (
                    <ErrorMessage
                        message={getPhrase(SitecoreDictionary.PricePromiseErrorsRequestFailMessage)}
                        description={getPhrase(SitecoreDictionary.PricePromiseErrorsRequestFailDescription)}
                        errorMessageClass={'error'}
                        icon={
                            <i className='error-message__icon'>
                                <SvgWarningFilled />
                            </i>
                        }
                    />
                )}

                <Button
                    onClick={onSubmitForm}
                    hasDisabledStyles={!store.isFormValid}
                    isLoading={store.isPricePromiseSending}
                    isMedium
                    type='submit'
                    className={styles.submit}
                >
                    {getPhrase(SitecoreDictionary.GlobalsSubmitRequest)}
                </Button>
            </form>
            <PricePromiseSuccessMessage
                isSuccessMessageShown={store.isSuccessMessageShown}
                toggleSuccessMessage={store.toggleSuccessMessage}
                SuccessMessagesRequestTitle={RequestTitle}
                SuccessMessagesRequestText={RequestText}
            />
        </div>
    );
};

export default observer(PricePromise);
