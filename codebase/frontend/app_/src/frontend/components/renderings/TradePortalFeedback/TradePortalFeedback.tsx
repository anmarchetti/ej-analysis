import React, { FC, useRef, useState } from 'react';
import { Guid } from 'guid-typescript';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { ONE_MB } from 'code/validation.config';
import useStore from 'frontend/hooks/useStore';
import offersService from 'frontend/services/offers.service';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { convertBooleanToString } from 'frontend/utils/string.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import { FeedbackFormInfo, FeedbackFormInfoFields } from 'models/data/FeedbackFormInfo';
import { FileType } from 'models/enum/FileType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import FeedbackFullForm from 'frontend/components/renderings/TradePortalFeedback/components/FeedbackFullForm';
import SubmittedFeedbackForm from 'frontend/components/renderings/TradePortalFeedback/components/SubmittedFeedbackForm';

export interface ITradePortalFeedbackFields {
    AgentDetailsABTANumberLabel: ISitecoreField<string>;
    AgentDetailsBusinessNameLabel: ISitecoreField<string>;
    AgentDetailsEmailLabel: ISitecoreField<string>;
    AgentDetailsNameLabel: ISitecoreField<string>;
    AgentDetailsTitle: ISitecoreField<string>;
    CheckboxesSubtitle: ISitecoreField<string>;
    CheckboxesTitle: ISitecoreField<string>;
    ConfirmationButton: ISitecoreField<string>;
    ConfirmationSubtitle: ISitecoreField<string>;
    ConfirmationTitle: ISitecoreField<string>;
    FeedbackLabel: ISitecoreField<string>;
    FeedbackTitle: ISitecoreField<string>;
    FirstCheckbox: ISitecoreField<string>;
    SecondCheckbox: ISitecoreField<string>;
    SubmitButton: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    SupportingButton: ISitecoreField<string>;
    SupportingSubtitle: ISitecoreField<string>;
    SupportingTitle: ISitecoreField<string>;
    ThirdCheckbox: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TTradePortalFeedbackProps = ISitecoreComponent<ITradePortalFeedbackFields>;

export const TradePortalFeedback: FC<TTradePortalFeedbackProps> = ({ fields }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [forceErrors, setForceErrors] = useState(false);
    const [isFeedbackFormSending, setIsFeedbackFormSending] = useState(false);
    const { getPhrase, getSetting, getSettingAsNumber } = useStore((stores: ITradePortalStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        getSettingAsNumber: stores.layoutStore.getSettingAsNumber,
    }));

    const maxFileCount = getSettingAsNumber(SiteSettings.MaxFileCount);
    const maxFileSize = getSettingAsNumber(SiteSettings.MaxFileSize);
    const fileTypes: FileType[] =
        getSetting<Nullable<string>>(SiteSettings.AllowedFileTypes)
            ?.split(',')
            .map((type: string) => type.trim().toLowerCase()) ?? [];
    const fileTypeNames = fileTypes.map(type => type.split('/').at(-1)!.toUpperCase());

    const fileErrorLabel = Tokenizer.replaceTokens(
        getPhrase(
            fileTypeNames.length > 1
                ? SitecoreDictionary.GlobalsErrorMessagesLoadFilesFieldRequiredWithTokens
                : SitecoreDictionary.GlobalsErrorMessagesLoadFilesFieldRequiredSingularWithTokens,
        ),
        {
            [Tokens.FileTypes]: fileTypeNames.length > 1 ? fileTypeNames.slice(0, -1).join(', ') : fileTypeNames[0],
            [Tokens.FileTypesLast]: fileTypeNames.length > 1 ? fileTypeNames.at(-1)! : '',
            [Tokens.MaxFileSizeMB]: (maxFileSize / ONE_MB).toFixed(0),
            [Tokens.MaxFileCount]: maxFileCount.toString(),
        },
    );

    const feedbackFormInfo = useRef(new FeedbackFormInfo({ fileTypes, fileErrorLabel, maxFileCount, maxFileSize }));

    let formKey: string = Guid.create().toString();

    if (!fields) {
        return null;
    }

    const getFormData = (): FormData => {
        const formData = new FormData();
        const files = feedbackFormInfo.current.Documents?.length ? feedbackFormInfo.current.Documents : null;

        formData.append(FeedbackFormInfoFields.Name, feedbackFormInfo.current.Name);
        formData.append(FeedbackFormInfoFields.TradeAgentName, feedbackFormInfo.current.TradeAgentName);
        formData.append(FeedbackFormInfoFields.ABTANumber, feedbackFormInfo.current.ABTANumber);
        formData.append(FeedbackFormInfoFields.Email, feedbackFormInfo.current.Email);
        formData.append(FeedbackFormInfoFields.FeedbackText, feedbackFormInfo.current.FeedbackText);
        formData.append(
            FeedbackFormInfoFields.IsWebsiteRelated,
            convertBooleanToString(feedbackFormInfo.current.IsWebsiteRelated),
        );
        formData.append(
            FeedbackFormInfoFields.IsTradeFeedback,
            convertBooleanToString(feedbackFormInfo.current.IsTradeFeedback),
        );
        formData.append(
            FeedbackFormInfoFields.IsOtherFeedback,
            convertBooleanToString(feedbackFormInfo.current.IsOtherFeedback),
        );

        if (files?.length) {
            for (let i = 0; i < files.length; i++) {
                formData.append(FeedbackFormInfoFields.Documents, files[i] as Blob, files[i].name);
            }
        }

        return formData;
    };

    const toggleForceErrors = async (state: boolean): Promise<void> => {
        setForceErrors(state);
    };

    const resetForm = (): void => {
        setForceErrors(false);
        formKey = Guid.create().toString();
    };

    const onSubmitForm = async (): Promise<void> => {
        if (feedbackFormInfo.current.isValid) {
            try {
                setIsFeedbackFormSending(true);
                await offersService.sendFeedbackForm(getFormData());
                setIsSubmitted(true);
                resetForm();
            } catch (e) {
                scrollIntoErrors();
            } finally {
                setIsFeedbackFormSending(false);
            }
        } else {
            scrollIntoErrors();
        }
    };

    const scrollIntoErrors = async (): Promise<void> => {
        // Trigger UI update before scroll
        await toggleForceErrors(true);
        // Scroll to invalid element
        scrollToErrorBlock();
    };

    return (
        <div className='feedback-form-trade' key={formKey}>
            {!isSubmitted ? (
                <FeedbackFullForm
                    fields={fields}
                    feedbackFormInfo={feedbackFormInfo.current}
                    forceErrors={forceErrors}
                    onSubmitForm={onSubmitForm}
                    isFeedbackFormSending={isFeedbackFormSending}
                    fileErrorLabel={fileErrorLabel}
                    fileTypes={fileTypes}
                />
            ) : (
                <SubmittedFeedbackForm fields={fields} />
            )}
        </div>
    );
};

export default observer(TradePortalFeedback);
