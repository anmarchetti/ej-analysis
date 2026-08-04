import { mockSitecoreCompositeField, mockSitecoreField } from 'frontend/utils/tests.utils';
import { IPopupFields } from 'models/data/BaseFields';
import {
    IAssistedTravelFormFields,
    ICustomerSelectionSectionFields,
    IDynamicSectionFields,
    IFormHeaderFields,
    IIntroductionSectionFields,
    ISummarySectionFields,
    IValidationErrorMessageFields,
} from 'frontend/components/renderings/AssistedTravelForm/models/interface';

export const formHeaderFieldsMock: IFormHeaderFields = {
    HeaderSubtitle: mockSitecoreField('HeaderSubtitle'),
    HeaderTitle: mockSitecoreField('HeaderTitle'),
    ProgressIndicator: mockSitecoreField('ProgressIndicator'),
};

export const popupFieldsMock: IPopupFields = {
    Title: { value: 'Test Title' },
    Description: { value: '<p>Test Description</p>' },
    PrimaryButtonLabel: { value: 'Confirm' },
    PrimaryButtonScreenReaderText: { value: 'Confirm action' },
    SecondaryButtonLabel: { value: 'Cancel' },
    SecondaryButtonScreenReaderText: { value: 'Cancel action' },
    Icon: { value: { src: '/test-icon.png', alt: 'Test Icon' } },
};

export const customerSelectionSectionFieldsMock: ICustomerSelectionSectionFields = {
    Description: mockSitecoreField('Description'),
    Title: mockSitecoreField('Title'),
    Under18Label: mockSitecoreField('Under18Label'),
    SecondaryButtonLabel: mockSitecoreField('SecondaryButtonLabel'),
    SecondaryButtonScreenReaderText: mockSitecoreField('SecondaryButtonScreenReaderText'),
    AssistedRequestedOnLabel: mockSitecoreField('AssistedRequestedOnLabel {date}'),
};

export const introductionSectionFieldsMock: IIntroductionSectionFields = {
    IntroductionText: mockSitecoreField('IntroductionText'),
    PrimaryButtonLabel: mockSitecoreField('PrimaryButtonLabel'),
    PrimaryButtonScreenReaderText: mockSitecoreField('PrimaryButtonScreenReaderText'),
    SecondaryButtonLabel: mockSitecoreField('SecondaryButtonLabel'),
    SecondaryButtonScreenReaderText: mockSitecoreField('SecondaryButtonScreenReaderText'),
};

export const dynamicSectionFieldsMock: IDynamicSectionFields = {
    Questions: [
        mockSitecoreCompositeField('Questions 1', {
            Code: mockSitecoreField('Code'),
            Description: mockSitecoreField('Description'),
            Label: mockSitecoreField('Label'),
            QuestionTextForSubmission: mockSitecoreField('QuestionTextForSubmission'),
            LabelSubmission: mockSitecoreField('LabelSubmission'),
        }),
        mockSitecoreCompositeField('Questions 2', {
            Code: mockSitecoreField('Code'),
            Description: mockSitecoreField('Description'),
            Label: mockSitecoreField('Label'),
            QuestionTextForSubmission: mockSitecoreField('QuestionTextForSubmission'),
            LabelSubmission: mockSitecoreField('LabelSubmission'),
        }),
    ],
    Title: mockSitecoreField('Title'),
    PrimaryButtonLabel: mockSitecoreField('PrimaryButtonLabel'),
    PrimaryButtonScreenReaderText: mockSitecoreField('PrimaryButtonScreenReaderText'),
    SecondaryButtonLabel: mockSitecoreField('SecondaryButtonLabel'),
    SecondaryButtonScreenReaderText: mockSitecoreField('SecondaryButtonScreenReaderText'),
};

export const validationErrorMessageFieldsMock: IValidationErrorMessageFields = {
    MultiSelectValueRequired: mockSitecoreField('MultiSelectValueRequired'),
    NumberMaxValueError: mockSitecoreField('NumberMaxValueError'),
    NumberMinValueError: mockSitecoreField('NumberMinValueError'),
    RadioButtonValueRequired: mockSitecoreField('RadioButtonValueRequired'),
    TextInputRequired: mockSitecoreField('TextInputRequired'),
    OtherValueRequired: mockSitecoreField('OtherValueRequired'),
};

const supportNeedsSectionFieldsMock: IDynamicSectionFields = {
    PrimaryButtonLabel: mockSitecoreField('Continue to Next Section'),
    PrimaryButtonScreenReaderText: mockSitecoreField('Continue to Next Section Screen Reader Text'),
    SecondaryButtonLabel: mockSitecoreField('Go to Previous Section'),
    SecondaryButtonScreenReaderText: mockSitecoreField('Go to Previous Section Screen Reader Text'),
    Questions: [
        {
            id: 'AT-002',
            fields: {
                Code: mockSitecoreField('AT-002'),
                Description: mockSitecoreField('Question AT-002 Description'),
                Label: mockSitecoreField('Question AT-002 Label'),
                Answers: [
                    {
                        id: 'AT-002-01',
                        fields: {
                            Code: mockSitecoreField('AT-002-01'),
                            Label: mockSitecoreField('Answer AT-002-01 Label'),
                            LabelSubmission: mockSitecoreField('Answer AT-002-01 Text For Submission'),
                            LabelSummary: mockSitecoreField('Answer AT-002-01 Text For Summary'),
                        },
                    },
                    {
                        id: 'AT-002-02',
                        fields: {
                            Code: mockSitecoreField('AT-002-02'),
                            Label: mockSitecoreField('Answer AT-002-02 Label'),
                            LabelSubmission: mockSitecoreField('Answer AT-002-02 Text For Submission'),
                            LabelSummary: mockSitecoreField('Answer AT-002-02 Text For Summary'),
                        },
                    },
                ],
                LabelSubmission: mockSitecoreField('Question AT-002 Text For Submission'),
            },
        },
    ],
    Title: mockSitecoreField('Support Needs Title'),
};

const mobilityAssistanceSectionFieldsMock: IDynamicSectionFields = {
    PrimaryButtonLabel: mockSitecoreField('Continue to Next Section 2'),
    PrimaryButtonScreenReaderText: mockSitecoreField('Continue to Next Section 2 Screen Reader Text'),
    SecondaryButtonLabel: mockSitecoreField('Go to Previous Section 2'),
    SecondaryButtonScreenReaderText: mockSitecoreField('Go to Previous Section 2 Screen Reader Text'),
    Questions: [
        {
            id: 'AT-037',
            fields: {
                Code: mockSitecoreField('AT-037'),
                Description: mockSitecoreField('Question AT-037 Description'),
                Label: mockSitecoreField('Question AT-037 Label'),
                LabelSubmission: mockSitecoreField('Question AT-037 Text For Submission'),
                Answers: [
                    {
                        id: 'AT-037-01',
                        fields: {
                            Code: mockSitecoreField('AT-037-01'),
                            Label: mockSitecoreField('Answer AT-037-01 Label'),
                            LabelSubmission: mockSitecoreField('Answer AT-037-01 Text For Submission'),
                            LabelSummary: mockSitecoreField('Answer AT-037-01 Text For Summary'),
                        },
                    },
                    {
                        id: 'AT-037-02',
                        fields: {
                            Code: mockSitecoreField('AT-037-02'),
                            Label: mockSitecoreField('Answer AT-037-02 Label'),
                            LabelSubmission: mockSitecoreField('Answer AT-037-02 Text For Submission'),
                            LabelSummary: mockSitecoreField('Answer AT-037-02 Text For Summary'),
                        },
                    },
                ],
            },
        },
        {
            id: 'AT-008',
            fields: {
                Code: mockSitecoreField('AT-008'),
                Description: mockSitecoreField('Question AT-008 Description'),
                Label: mockSitecoreField('Question AT-008 Label'),
                AdditionalInfo: mockSitecoreField('Question AT-008 AdditionalInfo'),
                LabelSubmission: mockSitecoreField('Question AT-008 Text For Submission'),
                Answers: [
                    {
                        id: 'AT-008-01',
                        fields: {
                            Code: mockSitecoreField('AT-008-01'),
                            Label: mockSitecoreField('Answer AT-008-01 Label'),
                            LabelSubmission: mockSitecoreField('Answer AT-008-01 Text For Submission'),
                            LabelSummary: mockSitecoreField('Answer AT-008-01 Text For Summary'),
                        },
                    },
                    {
                        id: 'AT-008-02',
                        fields: {
                            Code: mockSitecoreField('AT-008-02'),
                            Label: mockSitecoreField('Answer AT-008-02 Label'),
                            LabelSubmission: mockSitecoreField('Answer AT-008-02 Text For Submission'),
                            LabelSummary: mockSitecoreField('Answer AT-008-02 Text For Summary'),
                        },
                    },
                ],
            },
        },
        {
            id: 'wheelchair-dimensions',
            fields: {
                Code: mockSitecoreField('wheelchair-dimensions'),
                Description: mockSitecoreField('Question wheelchair-dimensions Description'),
                Label: mockSitecoreField('Question wheelchair-dimensions Label'),
                LabelSubmission: mockSitecoreField('Question wheelchair-dimensions Text For Submission'),
                Questions: [
                    {
                        id: 'AT-009',
                        fields: {
                            Code: mockSitecoreField('AT-009'),
                            Description: mockSitecoreField('Question AT-009 Description'),
                            Label: mockSitecoreField('Question AT-009 Label'),
                            LabelSubmission: mockSitecoreField('Question AT-009 Text For Submission'),
                        },
                    },
                    {
                        id: 'AT-011',
                        fields: {
                            Code: mockSitecoreField('AT-011'),
                            Description: mockSitecoreField('Question AT-011 Description'),
                            Label: mockSitecoreField('Question AT-011 Label'),
                            AdditionalInfo: mockSitecoreField('Question AT-011 AdditionalInfo'),
                            LabelSubmission: mockSitecoreField('Question AT-011 Text For Submission'),
                        },
                    },
                ],
            },
        },
        {
            id: 'AT-015',
            fields: {
                Code: mockSitecoreField('AT-015'),
                Description: mockSitecoreField('Question AT-015 Description'),
                Label: mockSitecoreField('Question AT-015 Label'),
                AdditionalInfo: mockSitecoreField('Question AT-015 AdditionalInfo'),
                LabelSubmission: mockSitecoreField('Question AT-015 Text For Submission'),
                Answers: [
                    {
                        id: 'AT-015-01',
                        fields: {
                            Code: mockSitecoreField('AT-015-01'),
                            Label: mockSitecoreField('Answer AT-015-01 Label'),
                            LabelSubmission: mockSitecoreField('Answer AT-015-01 Text For Submission'),
                            LabelSummary: mockSitecoreField('Answer AT-015-01 Text For Summary'),
                        },
                    },
                    {
                        id: 'AT-015-02',
                        fields: {
                            Code: mockSitecoreField('AT-015-02'),
                            Label: mockSitecoreField('Answer AT-015-02 Label'),
                            LabelSubmission: mockSitecoreField('Answer AT-015-02 Text For Submission'),
                            LabelSummary: mockSitecoreField('Answer AT-015-02 Text For Summary'),
                        },
                    },
                ],
            },
        },
        {
            id: 'question-depended-AT-002-02',
            fields: {
                Code: mockSitecoreField('question-depended-AT-002-02'),
                Description: mockSitecoreField('Question question-depended-AT-002-02 Description'),
                Label: mockSitecoreField('Question question-depended-AT-002-02 Label'),
                LabelSubmission: mockSitecoreField('Question question-depended-AT-002-02 Label For Submission'),
            },
        },
    ],
    Title: mockSitecoreField('Mobility Assistance Title'),
};

export const summarySectionFieldsMock: ISummarySectionFields = {
    CustomerLabelSummary: mockSitecoreField('CustomerLabelSummary'),
    Description: mockSitecoreField('Description'),
    InformationAccurateDescription: mockSitecoreField('InformationAccurateDescription'),
    InformationAccurateRequiredErrorMessage: mockSitecoreField('InformationAccurateRequiredErrorMessage'),
    InformationAccurateTitle: mockSitecoreField('InformationAccurateTitle'),
    Title: mockSitecoreField('SummaryTitle'),
    PrimaryButtonLabel: mockSitecoreField('PrimaryButtonLabel'),
    PrimaryButtonScreenReaderText: mockSitecoreField('PrimaryButtonScreenReaderText'),
    SecondaryButtonLabel: mockSitecoreField('SecondaryButtonLabel'),
    SecondaryButtonScreenReaderText: mockSitecoreField('SecondaryButtonScreenReaderText'),
};

export const assistedTravelFormFieldsMock: IAssistedTravelFormFields = {
    ...formHeaderFieldsMock,
    ...validationErrorMessageFieldsMock,
    ContactUsPopupFields: mockSitecoreCompositeField<IPopupFields>('ContactUsPopupFields', popupFieldsMock),
    WarningPopupBackButtonFields: mockSitecoreCompositeField<IPopupFields>(
        'WarningPopupBackButtonFields',
        popupFieldsMock,
    ),
    SafetyConfirmationPopup: mockSitecoreCompositeField<IPopupFields>('SafetyConfirmationPopup', popupFieldsMock),
    SubmissionFailedPopupFields: mockSitecoreCompositeField<IPopupFields>(
        'SubmissionFailedPopupFields',
        popupFieldsMock,
    ),
    SubmissionSuccessPopupFields: mockSitecoreCompositeField<IPopupFields>(
        'SubmissionSuccessPopupFields',
        popupFieldsMock,
    ),
    GoBackToStartWarningPopupFields: mockSitecoreCompositeField<IPopupFields>(
        'GoBackToStartWarningPopupFields',
        popupFieldsMock,
    ),
    NoTravelCompanionPopupFields: mockSitecoreCompositeField<IPopupFields>(
        'NoTravelCompanionPopupFields',
        popupFieldsMock,
    ),
    FailedToLoadPopupFields: mockSitecoreCompositeField<IPopupFields>(
        'FailedToLoadAssistedTravelRequestsPopupFields',
        popupFieldsMock,
    ),
    CustomerSelectionSectionFields: mockSitecoreCompositeField<ICustomerSelectionSectionFields>(
        'CustomerSelectionSectionFields',
        customerSelectionSectionFieldsMock,
    ),
    IntroductionSectionFields: mockSitecoreCompositeField<IIntroductionSectionFields>(
        'IntroductionSectionFields',
        introductionSectionFieldsMock,
    ),
    SupportNeedsSectionFields: mockSitecoreCompositeField<IDynamicSectionFields>(
        'SupportNeedsSectionFields',
        supportNeedsSectionFieldsMock,
    ),

    MobilityAssistanceSectionFields: mockSitecoreCompositeField<IDynamicSectionFields>(
        'MobilityAssistanceSectionFields',
        mobilityAssistanceSectionFieldsMock,
    ),
    HotelAssistanceSectionFields: mockSitecoreCompositeField<IDynamicSectionFields>(
        'HotelAssistanceSectionFields',
        dynamicSectionFieldsMock,
    ),
    TransferAssistanceSectionFields: mockSitecoreCompositeField<IDynamicSectionFields>(
        'TransferAssistanceSectionFields',
        dynamicSectionFieldsMock,
    ),
    BlindDeafNonVisibleDisabilitySectionFields: mockSitecoreCompositeField<IDynamicSectionFields>(
        'BlindDeafNonVisibleDisabilitySectionFields',
        dynamicSectionFieldsMock,
    ),
    SafetyDeclarationSectionFields: mockSitecoreCompositeField<IDynamicSectionFields>(
        'SafetyDeclarationSectionFields',
        dynamicSectionFieldsMock,
    ),
    AssistanceDogSectionFields: mockSitecoreCompositeField<IDynamicSectionFields>(
        'AssistanceDogSectionFields',
        dynamicSectionFieldsMock,
    ),
    SummarySectionFields: mockSitecoreCompositeField<ISummarySectionFields>(
        'SummarySectionFields',
        summarySectionFieldsMock,
    ),
    HotelSectionIsEnabled: mockSitecoreField<boolean>(true),
    TransferSectionIsEnabled: mockSitecoreField<boolean>(false),
};
