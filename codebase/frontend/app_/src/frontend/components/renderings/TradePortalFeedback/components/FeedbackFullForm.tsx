import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import validationService from 'frontend/services/validation.service';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { FeedbackFormInfo, FeedbackFormInfoFields } from 'models/data/FeedbackFormInfo';
import { IValidationError } from 'models/data/validation/IValidationError';
import { FileType } from 'models/enum/FileType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import Button from 'frontend/components/common/Button';
import Checkbox from 'frontend/components/common/Checkbox';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import ValidatableFileUploadField from 'frontend/components/common/ValidatableFileUploadField';
import ValidatableTextarea from 'frontend/components/common/ValidatableTextarea/ValidatableTextarea';
import { ValidationIcon } from 'frontend/components/common/ValidationIcon/ValidationIcon';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';
import { ITradePortalFeedbackFields } from 'frontend/components/renderings/TradePortalFeedback/TradePortalFeedback';

export interface IFeedbackFullFormProps {
    feedbackFormInfo: FeedbackFormInfo;
    fields: ITradePortalFeedbackFields;
    fileErrorLabel: string;
    fileTypes: FileType[];
    forceErrors: boolean;
    isFeedbackFormSending: boolean;
    onSubmitForm: () => void;
}

export const FeedbackFullForm: FC<IFeedbackFullFormProps> = ({
    fields,
    feedbackFormInfo,
    fileErrorLabel,
    forceErrors,
    onSubmitForm,
    isFeedbackFormSending,
    fileTypes,
}) => {
    const { getPhrase, isTradePortal, getSettingAsNumber } = useStore((stores: ITradePortalStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isTradePortal: stores.layoutStore.isTradePortal,
        getSettingAsNumber: stores.layoutStore.getSettingAsNumber,
    }));

    if (!fields) {
        return null;
    }

    const {
        Title,
        Subtitle,
        AgentDetailsTitle,
        AgentDetailsNameLabel,
        AgentDetailsBusinessNameLabel,
        AgentDetailsABTANumberLabel,
        AgentDetailsEmailLabel,
        CheckboxesTitle,
        CheckboxesSubtitle,
        FirstCheckbox,
        SecondCheckbox,
        ThirdCheckbox,
        FeedbackTitle,
        FeedbackLabel,
        SupportingTitle,
        SupportingSubtitle,
        SupportingButton,
        SubmitButton,
    } = fields;

    const getIsValidateField = (field: FeedbackFormInfoFields): IValidationError[] =>
        feedbackFormInfo.validateField(field);

    const getIsFieldRequired = (field: FeedbackFormInfoFields): boolean =>
        validationService.isFieldRequired(feedbackFormInfo, field as keyof FeedbackFormInfo);

    const onChangeField = (field: FeedbackFormInfoFields, value: string): void => {
        feedbackFormInfo.onChangeField(field, value);
    };

    const onChangeCheckboxField = (field: FeedbackFormInfoFields, event: React.ChangeEvent<HTMLInputElement>): void => {
        feedbackFormInfo.onChangeField(field, event.target.checked);

        if (event.target.checked) {
            feedbackFormInfo.IsFeedbackTypeValid = true;
        } else {
            feedbackFormInfo.IsFeedbackTypeValid = false;
        }
    };

    const maxFileCount = getSettingAsNumber(SiteSettings.MaxFileCount);

    return (
        <>
            {Title && Subtitle && (
                <ComponentWrapper params={{ IsGreyBackground: '1', IsTriangleEnd: '1', IsTriangleEndReverse: '1' }}>
                    <Text field={Title} tag='h1' className='feedback-form__title' data-tid='feedback-form-title' />
                    <RichTextWithLinks
                        field={Subtitle}
                        tag='p'
                        className='feedback-form__subtitle'
                        dataId='feedback-form-subtitle'
                    />
                </ComponentWrapper>
            )}
            <ComponentWrapper>
                {AgentDetailsTitle && <Text field={AgentDetailsTitle} tag='h4' data-tid='feedback-agent-title' />}
                <ValidatableField
                    id={FeedbackFormInfoFields.Name}
                    onChange={(value): void => onChangeField(FeedbackFormInfoFields.Name, value)}
                    name={FeedbackFormInfoFields.Name}
                    value={feedbackFormInfo.Name}
                    label={AgentDetailsNameLabel.value}
                    errors={getIsValidateField(FeedbackFormInfoFields.Name)}
                    forceError={forceErrors}
                    autoComplete={false}
                    isVertical
                    required={getIsFieldRequired(FeedbackFormInfoFields.Name)}
                />
                <ValidatableField
                    id={FeedbackFormInfoFields.TradeAgentName}
                    onChange={(value): void => onChangeField(FeedbackFormInfoFields.TradeAgentName, value)}
                    name={FeedbackFormInfoFields.TradeAgentName}
                    value={feedbackFormInfo.TradeAgentName}
                    label={AgentDetailsBusinessNameLabel.value}
                    errors={getIsValidateField(FeedbackFormInfoFields.TradeAgentName)}
                    forceError={forceErrors}
                    autoComplete={false}
                    isVertical
                    required={getIsFieldRequired(FeedbackFormInfoFields.TradeAgentName)}
                />
                <ValidatableField
                    id={FeedbackFormInfoFields.ABTANumber}
                    onChange={(value): void => onChangeField(FeedbackFormInfoFields.ABTANumber, value)}
                    name={FeedbackFormInfoFields.ABTANumber}
                    value={feedbackFormInfo.ABTANumber}
                    label={AgentDetailsABTANumberLabel.value}
                    errors={getIsValidateField(FeedbackFormInfoFields.ABTANumber)}
                    autoComplete={false}
                    isVertical
                    required={false}
                    optionalLabel={getPhrase(SitecoreDictionary.GlobalsLabelsOptional)}
                />
                <ValidatableField
                    onChange={(value): void => onChangeField(FeedbackFormInfoFields.Email, value)}
                    id={FeedbackFormInfoFields.Email}
                    label={AgentDetailsEmailLabel.value}
                    value={feedbackFormInfo.Email}
                    errors={getIsValidateField(FeedbackFormInfoFields.Email)}
                    forceError={forceErrors}
                    autoComplete={false}
                    isVertical
                    required={getIsFieldRequired(FeedbackFormInfoFields.Email)}
                />

                <div
                    className={classNames(
                        'form-field__trade form-field form_checkboxes',
                        forceErrors && !feedbackFormInfo.IsFeedbackTypeValid && 'form-field--error error',
                    )}
                >
                    {CheckboxesTitle && <Text field={CheckboxesTitle} tag='h4' data-tid='feedback-type-title' />}
                    {CheckboxesSubtitle && (
                        <RichTextWithLinks
                            className={classNames(
                                forceErrors && !feedbackFormInfo.IsFeedbackTypeValid && 'form__subtitle--error',
                            )}
                            field={CheckboxesSubtitle}
                            tag='p'
                            dataId='feedback-type-label'
                        />
                    )}
                    <Checkbox
                        onChange={(value): void =>
                            onChangeCheckboxField(FeedbackFormInfoFields.IsWebsiteRelated, value)
                        }
                        checked={feedbackFormInfo.IsWebsiteRelated}
                        label={FirstCheckbox}
                        medium
                        tick
                        textRight
                    />
                    <Checkbox
                        onChange={(value): void => onChangeCheckboxField(FeedbackFormInfoFields.IsTradeFeedback, value)}
                        checked={feedbackFormInfo.IsTradeFeedback}
                        label={SecondCheckbox}
                        medium
                        tick
                        textRight
                    />
                    <Checkbox
                        onChange={(value): void => onChangeCheckboxField(FeedbackFormInfoFields.IsOtherFeedback, value)}
                        checked={feedbackFormInfo.IsOtherFeedback}
                        label={ThirdCheckbox}
                        medium
                        tick
                        textRight
                    />
                    {forceErrors && !feedbackFormInfo.IsFeedbackTypeValid && (
                        <div className='vertical__error form-control__error'>
                            <i className='form-control__error__icon'>
                                <ValidationIcon isTradePortal={isTradePortal} />
                            </i>
                            <span className='form-control__error__label'>
                                {getPhrase(SitecoreDictionary.GlobalsErrorMessagesFeedbackTypeFieldRequired)}
                            </span>
                        </div>
                    )}
                </div>

                {FeedbackTitle && <Text field={FeedbackTitle} tag='h4' data-tid='feedback-title' />}
                <ValidatableTextarea
                    id={FeedbackFormInfoFields.FeedbackText}
                    textareaClass='form-control__textarea'
                    onChange={(value): void => onChangeField(FeedbackFormInfoFields.FeedbackText, value)}
                    label={FeedbackLabel.value}
                    value={feedbackFormInfo.FeedbackText}
                    errors={getIsValidateField(FeedbackFormInfoFields.FeedbackText)}
                    forceError={forceErrors}
                    isVertical
                    required={getIsFieldRequired(FeedbackFormInfoFields.FeedbackText)}
                />

                {SupportingTitle && <Text field={SupportingTitle} tag='h4' data-tid='feedback-support-title' />}
                {SupportingSubtitle && (
                    <RichTextWithLinks field={SupportingSubtitle} tag='p' dataId='feedback-support-subtitle' />
                )}
                <ValidatableFileUploadField
                    files={feedbackFormInfo.Documents}
                    acceptFileTypes={fileTypes}
                    onChange={(files): void => onChangeField(FeedbackFormInfoFields.Documents, files)}
                    label={SupportingButton.value}
                    errors={getIsValidateField(FeedbackFormInfoFields.Documents)}
                    forceError={forceErrors}
                    id={FeedbackFormInfoFields.Documents}
                    required={getIsFieldRequired(FeedbackFormInfoFields.Documents)}
                    multiple
                    allowedUploadedFileNumb={maxFileCount}
                    isTradePortal={isTradePortal}
                    errorLabel={fileErrorLabel}
                />
                <Button
                    className='feedback-submit__btn'
                    onClick={onSubmitForm}
                    type='submit'
                    isLarge
                    isFullWidth
                    isLoading={isFeedbackFormSending}
                    dataTid='feedback-submit-btn'
                >
                    {SubmitButton.value}
                </Button>
            </ComponentWrapper>
        </>
    );
};

export default observer(FeedbackFullForm);
