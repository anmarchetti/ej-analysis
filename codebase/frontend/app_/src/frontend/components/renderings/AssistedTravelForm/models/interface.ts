import { IPopupFields, IPrimaryButtonFields, ISecondaryButtonFields } from 'models/data/BaseFields';
import { ISitecoreCompositeField, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface IAssistedTravelFormFields
    extends IFormHeaderFields,
        IAssistedTravelSectionsFields,
        IValidationErrorMessageFields,
        ISettingFields {
    ContactUsPopupFields: ISitecoreCompositeField<IPopupFields>;
    CustomerSelectionSectionFields: ISitecoreCompositeField<ICustomerSelectionSectionFields>;
    FailedToLoadPopupFields: ISitecoreCompositeField<IPopupFields>;
    GoBackToStartWarningPopupFields: ISitecoreCompositeField<IPopupFields>;
    IntroductionSectionFields: ISitecoreCompositeField<IIntroductionSectionFields>;
    NoTravelCompanionPopupFields: ISitecoreCompositeField<IPopupFields>;
    SafetyConfirmationPopup: ISitecoreCompositeField<IPopupFields>;
    SubmissionFailedPopupFields: ISitecoreCompositeField<IPopupFields>;
    SubmissionSuccessPopupFields: ISitecoreCompositeField<IPopupFields>;
    WarningPopupBackButtonFields: ISitecoreCompositeField<IPopupFields>;
}

export interface IAssistedTravelSectionsFields {
    AssistanceDogSectionFields: ISitecoreCompositeField<IDynamicSectionFields>;
    BlindDeafNonVisibleDisabilitySectionFields: ISitecoreCompositeField<IDynamicSectionFields>;
    HotelAssistanceSectionFields: ISitecoreCompositeField<IDynamicSectionFields>;
    MobilityAssistanceSectionFields: ISitecoreCompositeField<IDynamicSectionFields>;
    SafetyDeclarationSectionFields: ISitecoreCompositeField<IDynamicSectionFields>;
    SummarySectionFields: ISitecoreCompositeField<ISummarySectionFields>;
    SupportNeedsSectionFields: ISitecoreCompositeField<IDynamicSectionFields>;
    TransferAssistanceSectionFields: ISitecoreCompositeField<IDynamicSectionFields>;
}

export interface ISettingFields {
    HotelSectionIsEnabled: ISitecoreField<boolean>;
    TransferSectionIsEnabled: ISitecoreField<boolean>;
}

export interface IIntroductionSectionFields extends IPrimaryButtonFields, ISecondaryButtonFields {
    IntroductionText: ISitecoreField<string>;
}

export interface ICustomerSelectionSectionFields extends ISecondaryButtonFields {
    AssistedRequestedOnLabel: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    Under18Label: ISitecoreField<string>;
}

export interface ISummarySectionFields extends IPrimaryButtonFields, ISecondaryButtonFields {
    CustomerLabelSummary: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    InformationAccurateDescription: ISitecoreField<string>;
    InformationAccurateRequiredErrorMessage: ISitecoreField<string>;
    InformationAccurateTitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}
export interface IDynamicSectionFields extends IPrimaryButtonFields, ISecondaryButtonFields {
    Questions: ISitecoreCompositeField<IQuestionItem>[];
    Title: ISitecoreField<string>;
}
export interface IQuestionItem {
    Code: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Label: ISitecoreField<string>;
    LabelSubmission: ISitecoreField<string>;
    AdditionalInfo?: ISitecoreField<string>;
    Answers?: ISitecoreCompositeField<IAnswerItem>[];
    LabelSummary?: ISitecoreField<string>;
    PlaceholderLabel?: ISitecoreField<string>;
    Questions?: ISitecoreCompositeField<IQuestionItem>[];
}
export interface IAnswerItem {
    Code: ISitecoreField<string>;
    Label: ISitecoreField<string>;
    LabelSubmission: ISitecoreField<string>;
    LabelSummary: ISitecoreField<string>;
}

export interface IFormHeaderFields {
    HeaderSubtitle: ISitecoreField<string>;
    HeaderTitle: ISitecoreField<string>;
    ProgressIndicator: ISitecoreField<string>;
}

export interface IValidationErrorMessageFields {
    MultiSelectValueRequired: ISitecoreField<string>;
    NumberMaxValueError: ISitecoreField<string>;
    NumberMinValueError: ISitecoreField<string>;
    OtherValueRequired: ISitecoreField<string>;
    RadioButtonValueRequired: ISitecoreField<string>;
    TextInputRequired: ISitecoreField<string>;
}
