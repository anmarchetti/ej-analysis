import { ValidationRule } from 'models/enum/ValidationRule';
import {
    ConditionalOperator,
    IFormDefinition,
    QuestionType,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';

export const formDefinitionMock: IFormDefinition = {
    id: 'assisted-travel-form',
    sections: [
        {
            id: 'assistance-type-section',
            title: 'Assistance Type',
            sitecoreKey: 'SupportNeedsSectionFields',
            questions: [
                {
                    id: 'AT-002',
                    label: 'Select special assistance',
                    description: 'Please select from the list below which assistance you’d like to request.',
                    type: QuestionType.MultiSelect,
                    options: [
                        {
                            id: 'AT-002-01',
                            text: "I'll need mobility assistance at the airport, or I'll be travelling with my own wheelchair or mobility aid.",
                        },
                        {
                            id: 'AT-002-02',
                            text: 'I am blind/visually impaired',
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                },
            ],
        },
        {
            id: 'mobility-section',
            title: 'Mobility Assistance',
            sitecoreKey: 'MobilityAssistanceSectionFields',
            conditionalLogic: [{ questionId: 'AT-002', answerId: 'AT-002-01', operator: ConditionalOperator.Equals }],
            questions: [
                {
                    id: 'AT-037',
                    label: 'Do you know the folded wheelchair dimensions?',
                    type: QuestionType.Radio,
                    options: [
                        {
                            id: 'AT-037-01',
                            text: 'Yes',
                        },
                        {
                            id: 'AT-037-02',
                            text: 'No',
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                },
                {
                    id: 'AT-008',
                    label: 'Do you know the wheelchair dimensions?',
                    type: QuestionType.Radio,
                    conditionalLogic: [
                        {
                            questionId: 'AT-037',
                            answerId: 'AT-037-02',
                            operator: ConditionalOperator.Equals,
                        },
                    ],
                    options: [
                        {
                            id: 'AT-008-01',
                            text: 'Yes',
                        },
                        {
                            id: 'AT-008-02',
                            text: 'No',
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                },
                {
                    id: 'wheelchair-dimensions',
                    label: 'Please fill in the wheelchair details to the best of your knowledge.',
                    type: QuestionType.InputSet,
                    questions: [
                        {
                            id: 'AT-009',
                            description: 'Make (optional)',
                            additionalInfo: 'Enter the wheelchair brand name or any identifying details.',
                            type: QuestionType.TextInput,
                        },
                        {
                            id: 'AT-011',
                            description: 'Length in cm',
                            additionalInfo: 'Add length in centimeters',
                            type: QuestionType.NumberInput,
                            requiredValidation: {
                                required: true,
                                message: 'This field is required',
                            },
                            validation: [
                                { type: ValidationRule.MinValue, value: 0.01, message: '' },
                                { type: ValidationRule.MaxValue, value: 10000, message: '' },
                                { type: ValidationRule.MaxDecimalPlaces, value: 2, message: '' },
                            ],
                        },
                    ],
                    conditionalLogic: [
                        {
                            questionId: 'AT-008',
                            answerId: 'AT-008-01',
                            operator: ConditionalOperator.Equals,
                        },
                        {
                            questionId: 'AT-037',
                            answerId: 'AT-037-01',
                            operator: ConditionalOperator.Equals,
                        },
                    ],
                },
                {
                    id: 'AT-015',
                    label: 'Can walk up and down aircraft',
                    type: QuestionType.Radio,
                    conditionalLogic: [
                        {
                            questionId: 'AT-008',
                            answerId: 'AT-008-02',
                            operator: ConditionalOperator.Equals,
                        },
                        {
                            questionId: 'AT-008',
                            answerId: 'AT-008-01',
                            operator: ConditionalOperator.Equals,
                        },
                        {
                            questionId: 'AT-037',
                            answerId: 'AT-037-01',
                            operator: ConditionalOperator.Equals,
                        },
                        {
                            questionId: 'AT-037',
                            answerId: 'AT-037-02',
                            operator: ConditionalOperator.Equals,
                        },
                    ],
                    options: [
                        {
                            id: 'AT-015-01',
                            text: 'Yes',
                        },
                        {
                            id: 'AT-015-02',
                            text: 'No',
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                },
                {
                    id: 'question-depended-AT-002-02',
                    label: 'Question that depends on AT-002-02',
                    description: 'This question should only show if the answer AT-002-02 is selected.',
                    type: QuestionType.TravelCompanionSelection,
                    conditionalLogic: [
                        {
                            answerId: 'AT-002-02',
                            operator: ConditionalOperator.Equals,
                            questionId: 'AT-002',
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                },
            ],
            progressBarGroup: 'Mobility Assistance',
        },
        {
            id: 'hotel-section',
            title: 'Hotel Assistance',
            sitecoreKey: 'HotelAssistanceSectionFields',
            questions: [],
            sectionGlobalVisibility: {
                isVisible: true,
                settingToCheck: 'HotelSectionIsEnabled',
            },
            progressBarGroup: 'Hotel Assistance',
        },
        {
            id: 'transfer-section',
            title: 'Transfer Assistance',
            sitecoreKey: 'TransferAssistanceSectionFields',
            questions: [],
            sectionGlobalVisibility: {
                isVisible: true,
                settingToCheck: 'TransferSectionIsEnabled',
            },
            progressBarGroup: 'Transfer Assistance',
        },
    ],
};

export const formDefinitionTransformedMock: IFormDefinition = {
    id: 'assisted-travel-form',
    sections: [
        {
            buttonContent: {
                primaryButtonScreenReaderText: {
                    value: 'Continue to Next Section Screen Reader Text',
                },
                primaryButtonText: {
                    value: 'Continue to Next Section',
                },
                secondaryButtonScreenReaderText: {
                    value: 'Go to Previous Section Screen Reader Text',
                },
                secondaryButtonText: {
                    value: 'Go to Previous Section',
                },
            },
            id: 'assistance-type-section',
            questions: [
                {
                    additionalInfo: undefined,
                    description: 'Question AT-002 Description',
                    id: 'AT-002',
                    options: [
                        {
                            id: 'AT-002-01',
                            text: 'Answer AT-002-01 Label',
                            textForSubmission: 'Answer AT-002-01 Text For Submission',
                            textForSummary: 'Answer AT-002-01 Text For Summary',
                        },
                        {
                            id: 'AT-002-02',
                            text: 'Answer AT-002-02 Label',
                            textForSubmission: 'Answer AT-002-02 Text For Submission',
                            textForSummary: 'Answer AT-002-02 Text For Summary',
                        },
                    ],
                    requiredValidation: {
                        message: 'MultiSelectValueRequired',
                        otherOptionMessage: 'OtherValueRequired',
                        required: true,
                    },
                    label: 'Question AT-002 Label',
                    labelSubmission: 'Question AT-002 Text For Submission',
                    labelSummary: 'Question AT-002 Label',
                    type: QuestionType.MultiSelect,
                    triggersQuestions: ['question-depended-AT-002-02'],
                },
            ],
            sitecoreKey: 'SupportNeedsSectionFields',
            title: 'Support Needs Title',
            sectionGlobalVisibility: {
                isVisible: true,
            },
        },
        {
            buttonContent: {
                primaryButtonScreenReaderText: {
                    value: 'Continue to Next Section 2 Screen Reader Text',
                },
                primaryButtonText: {
                    value: 'Continue to Next Section 2',
                },
                secondaryButtonScreenReaderText: {
                    value: 'Go to Previous Section 2 Screen Reader Text',
                },
                secondaryButtonText: {
                    value: 'Go to Previous Section 2',
                },
            },
            conditionalLogic: [
                {
                    answerId: 'AT-002-01',
                    operator: ConditionalOperator.Equals,
                    questionId: 'AT-002',
                },
            ],
            id: 'mobility-section',
            sectionGlobalVisibility: {
                isVisible: true,
            },
            questions: [
                {
                    additionalInfo: undefined,
                    description: 'Question AT-037 Description',
                    id: 'AT-037',
                    options: [
                        {
                            id: 'AT-037-01',
                            text: 'Answer AT-037-01 Label',
                            textForSubmission: 'Answer AT-037-01 Text For Submission',
                            textForSummary: 'Answer AT-037-01 Text For Summary',
                        },
                        {
                            id: 'AT-037-02',
                            text: 'Answer AT-037-02 Label',
                            textForSubmission: 'Answer AT-037-02 Text For Submission',
                            textForSummary: 'Answer AT-037-02 Text For Summary',
                        },
                    ],
                    requiredValidation: {
                        message: 'RadioButtonValueRequired',
                        otherOptionMessage: 'OtherValueRequired',
                        required: true,
                    },
                    label: 'Question AT-037 Label',
                    labelSubmission: 'Question AT-037 Text For Submission',
                    labelSummary: 'Question AT-037 Label',
                    triggersQuestions: ['AT-008', 'wheelchair-dimensions', 'AT-015'],
                    type: QuestionType.Radio,
                },
                {
                    additionalInfo: 'Question AT-008 AdditionalInfo',
                    conditionalLogic: [
                        {
                            answerId: 'AT-037-02',
                            operator: ConditionalOperator.Equals,
                            questionId: 'AT-037',
                        },
                    ],
                    description: 'Question AT-008 Description',
                    id: 'AT-008',
                    options: [
                        {
                            id: 'AT-008-01',
                            text: 'Answer AT-008-01 Label',
                            textForSubmission: 'Answer AT-008-01 Text For Submission',
                            textForSummary: 'Answer AT-008-01 Text For Summary',
                        },
                        {
                            id: 'AT-008-02',
                            text: 'Answer AT-008-02 Label',
                            textForSubmission: 'Answer AT-008-02 Text For Submission',
                            textForSummary: 'Answer AT-008-02 Text For Summary',
                        },
                    ],
                    requiredValidation: {
                        message: 'RadioButtonValueRequired',
                        otherOptionMessage: 'OtherValueRequired',
                        required: true,
                    },
                    label: 'Question AT-008 Label',
                    labelSubmission: 'Question AT-008 Text For Submission',
                    labelSummary: 'Question AT-008 Label',
                    triggersQuestions: ['wheelchair-dimensions', 'AT-015'],
                    type: QuestionType.Radio,
                },
                {
                    conditionalLogic: [
                        {
                            answerId: 'AT-008-01',
                            operator: ConditionalOperator.Equals,
                            questionId: 'AT-008',
                        },
                        {
                            answerId: 'AT-037-01',
                            operator: ConditionalOperator.Equals,
                            questionId: 'AT-037',
                        },
                    ],
                    description: 'Question wheelchair-dimensions Description',
                    id: 'wheelchair-dimensions',
                    questions: [
                        {
                            additionalInfo: undefined,
                            description: 'Question AT-009 Description',
                            id: 'AT-009',
                            options: [],
                            requiredValidation: {
                                message: 'TextInputRequired',
                                otherOptionMessage: 'OtherValueRequired',
                                required: false,
                            },
                            label: 'Question AT-009 Label',
                            labelSubmission: 'Question AT-009 Text For Submission',
                            labelSummary: 'Question AT-009 Label',
                            triggersQuestions: [],
                            type: QuestionType.TextInput,
                        },
                        {
                            additionalInfo: 'Question AT-011 AdditionalInfo',
                            description: 'Question AT-011 Description',
                            id: 'AT-011',
                            options: [],
                            requiredValidation: {
                                message: 'TextInputRequired',
                                otherOptionMessage: 'OtherValueRequired',
                                required: true,
                            },
                            label: 'Question AT-011 Label',
                            labelSubmission: 'Question AT-011 Text For Submission',
                            labelSummary: 'Question AT-011 Label',
                            triggersQuestions: [],
                            type: QuestionType.NumberInput,
                            validation: [
                                { type: ValidationRule.MinValue, value: 0.01, message: 'NumberMinValueError' },
                                { type: ValidationRule.MaxValue, value: 10000, message: 'NumberMaxValueError' },
                                {
                                    type: ValidationRule.MaxDecimalPlaces,
                                    value: 2,
                                    message: '',
                                },
                            ],
                        },
                    ],
                    label: 'Question wheelchair-dimensions Label',
                    type: QuestionType.InputSet,
                },
                {
                    additionalInfo: 'Question AT-015 AdditionalInfo',
                    conditionalLogic: [
                        {
                            answerId: 'AT-008-02',
                            operator: ConditionalOperator.Equals,
                            questionId: 'AT-008',
                        },
                        {
                            answerId: 'AT-008-01',
                            operator: ConditionalOperator.Equals,
                            questionId: 'AT-008',
                        },
                        {
                            answerId: 'AT-037-01',
                            operator: ConditionalOperator.Equals,
                            questionId: 'AT-037',
                        },
                        {
                            answerId: 'AT-037-02',
                            operator: ConditionalOperator.Equals,
                            questionId: 'AT-037',
                        },
                    ],
                    description: 'Question AT-015 Description',
                    id: 'AT-015',
                    labelSubmission: 'Question AT-015 Text For Submission',
                    labelSummary: 'Question AT-015 Label',
                    options: [
                        {
                            id: 'AT-015-01',
                            text: 'Answer AT-015-01 Label',
                            textForSubmission: 'Answer AT-015-01 Text For Submission',
                            textForSummary: 'Answer AT-015-01 Text For Summary',
                        },
                        {
                            id: 'AT-015-02',
                            text: 'Answer AT-015-02 Label',
                            textForSubmission: 'Answer AT-015-02 Text For Submission',
                            textForSummary: 'Answer AT-015-02 Text For Summary',
                        },
                    ],
                    requiredValidation: {
                        message: 'RadioButtonValueRequired',
                        otherOptionMessage: 'OtherValueRequired',
                        required: true,
                    },
                    label: 'Question AT-015 Label',
                    triggersQuestions: [],
                    type: QuestionType.Radio,
                },
                {
                    id: 'question-depended-AT-002-02',
                    label: 'Question question-depended-AT-002-02 Label',
                    labelSubmission: 'Question question-depended-AT-002-02 Label For Submission',
                    labelSummary: 'Question question-depended-AT-002-02 Label',
                    description: 'Question question-depended-AT-002-02 Description',
                    type: QuestionType.TravelCompanionSelection,
                    conditionalLogic: [
                        {
                            answerId: 'AT-002-02',
                            operator: ConditionalOperator.Equals,
                            questionId: 'AT-002',
                        },
                    ],
                    triggersQuestions: [],
                    requiredValidation: {
                        message: 'RadioButtonValueRequired',
                        otherOptionMessage: 'OtherValueRequired',
                        required: true,
                    },
                    options: [],
                },
            ],
            sitecoreKey: 'MobilityAssistanceSectionFields',
            title: 'Mobility Assistance Title',
            progressBarGroup: 'Mobility Assistance',
        },
        {
            buttonContent: {
                primaryButtonScreenReaderText: {
                    value: 'PrimaryButtonScreenReaderText',
                },
                primaryButtonText: {
                    value: 'PrimaryButtonLabel',
                },
                secondaryButtonScreenReaderText: {
                    value: 'SecondaryButtonScreenReaderText',
                },
                secondaryButtonText: {
                    value: 'SecondaryButtonLabel',
                },
            },
            id: 'hotel-section',
            questions: [],
            sectionGlobalVisibility: {
                isVisible: true,
            },
            sitecoreKey: 'HotelAssistanceSectionFields',
            title: 'Title',
            progressBarGroup: 'Hotel Assistance',
        },
        {
            buttonContent: {
                primaryButtonScreenReaderText: {
                    value: 'PrimaryButtonScreenReaderText',
                },
                primaryButtonText: {
                    value: 'PrimaryButtonLabel',
                },
                secondaryButtonScreenReaderText: {
                    value: 'SecondaryButtonScreenReaderText',
                },
                secondaryButtonText: {
                    value: 'SecondaryButtonLabel',
                },
            },
            id: 'transfer-section',
            questions: [],
            sectionGlobalVisibility: {
                isVisible: false,
            },
            sitecoreKey: 'TransferAssistanceSectionFields',
            title: 'Title',
            progressBarGroup: 'Transfer Assistance',
        },
    ],
};
