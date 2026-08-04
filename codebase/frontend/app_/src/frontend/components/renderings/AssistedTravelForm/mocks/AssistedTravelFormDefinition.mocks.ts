import { ValidationRule } from 'models/enum/ValidationRule';
import {
    AnswerActionConditionType,
    AnswerActionType,
    ConditionalOperator,
    IFormDefinition,
    PopupType,
    QuestionType,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';

export const ASSISTED_TRAVEL_FORM_DEFINITION: IFormDefinition = {
    id: 'assisted-travel-form',
    sections: [
        {
            id: 'assistance-type-section',
            title: 'Airport requirements',
            sitecoreKey: 'SupportNeedsSectionFields',
            summaryGroup: 'airport-requirements',
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
                        {
                            id: 'AT-002-03',
                            text: 'I am deaf/hard of hearing',
                        },
                        {
                            id: 'AT-002-04',
                            text: 'I require support due to a non-visible disability',
                        },
                        {
                            id: 'AT-002-05',
                            text: 'I will be travelling with a recognised assistance dog',
                        },
                        {
                            id: 'AT-002-06',
                            text: 'I have a severe nut allergy',
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
            title: 'Airport requirements',
            sitecoreKey: 'MobilityAssistanceSectionFields',
            progressBarGroup: 'airport-requirements',
            conditionalLogic: [{ questionId: 'AT-002', answerId: 'AT-002-01', operator: ConditionalOperator.Equals }],
            questions: [
                {
                    id: 'AT-003',
                    label: 'Are you bringing a mobility aid?',
                    type: QuestionType.MultiSelect,
                    options: [
                        {
                            id: 'AT-003-01',
                            text: "Yes, it's a manual wheelchair",
                        },
                        {
                            id: 'AT-003-02',
                            text: "Yes, it's an electric wheelchair or electric mobility aid",
                        },
                        {
                            id: 'AT-003-03',
                            text: "Yes, it's a walking frame or rollator",
                        },
                        {
                            id: 'AT-003-04',
                            text: 'No',

                            clearOtherSelections: true,
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                },
                {
                    id: 'AT-004',
                    label: 'What type of battery does your electric wheelchair or electric mobility aid use?',
                    type: QuestionType.Radio,
                    additionalInfo: 'Wet cell batteries are not allowed on planes',
                    conditionalLogic: [
                        { questionId: 'AT-003', answerId: 'AT-003-02', operator: ConditionalOperator.Equals },
                    ],
                    options: [
                        {
                            id: 'AT-004-01',
                            text: 'Sealed/non-spillable (Gel, AGM, Dry cell) 3',
                        },
                        {
                            id: 'AT-004-02',
                            text: 'Lithium-ion battery',
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                },
                {
                    id: 'AT-005',
                    label: 'Battery capacity (Watt-hours/Wh)',
                    description: 'Wattage',
                    additionalInfo: 'Add Wattage in Watt/hours',
                    type: QuestionType.NumberInput,
                    conditionalLogic: [
                        { questionId: 'AT-004', answerId: 'AT-004-02', operator: ConditionalOperator.Equals },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                    validation: [
                        { type: ValidationRule.MinValue, value: 0.01, message: '' },
                        { type: ValidationRule.MaxValue, value: 20000, message: '' },
                        { type: ValidationRule.MaxDecimalPlaces, value: 2, message: '' },
                    ],
                },
                {
                    id: 'AT-006',
                    label: 'Do you know how to inhibit the circuits or isolate battery?',
                    type: QuestionType.Radio,
                    conditionalLogic: [
                        { questionId: 'AT-004', answerId: 'AT-004-02', operator: ConditionalOperator.Equals },
                        { questionId: 'AT-004', answerId: 'AT-004-01', operator: ConditionalOperator.Equals },
                    ],
                    options: [
                        {
                            id: 'AT-006-01',
                            text: 'Yes',
                        },
                        {
                            id: 'AT-006-02',
                            text: 'No',
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                },
                {
                    id: 'AT-039',
                    label: 'Brieﬂy describe how the battery is turned oﬀ, disconnected, or isolated (e.g. isolation switch, unplugging, or removal).',
                    description: 'Description',
                    type: QuestionType.Textarea,
                    additionalInfo: 'For example isolation switch, unplugging, or removal',
                    conditionalLogic: [
                        { questionId: 'AT-006', answerId: 'AT-006-01', operator: ConditionalOperator.Equals },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                    validation: [{ type: ValidationRule.MaxLength, value: 1000, message: '' }],
                },
                {
                    id: 'AT-007',
                    label: 'Can it be folded or partially dissembled for transport?',
                    type: QuestionType.Radio,
                    conditionalLogic: [
                        { questionId: 'AT-003', answerId: 'AT-003-01', operator: ConditionalOperator.Equals },
                        { questionId: 'AT-003', answerId: 'AT-003-03', operator: ConditionalOperator.Equals },
                        { questionId: 'AT-006', answerId: '', operator: ConditionalOperator.IsAnswered },
                    ],
                    options: [
                        {
                            id: 'AT-007-01',
                            text: 'Yes',
                        },
                        {
                            id: 'AT-007-02',
                            text: 'No',
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                },
                {
                    id: 'AT-037',
                    label: 'Do you know the folded wheelchair dimensions?',
                    type: QuestionType.Radio,
                    conditionalLogic: [
                        { questionId: 'AT-007', answerId: 'AT-007-01', operator: ConditionalOperator.Equals },
                    ],
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
                        { questionId: 'AT-007', answerId: 'AT-007-02', operator: ConditionalOperator.Equals },
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
                            validation: [{ type: ValidationRule.MaxLength, value: 200, message: '' }],
                        },
                        {
                            id: 'AT-010',
                            description: 'Model (optional)',
                            additionalInfo: 'Enter the wheelchair model name or any identifying details.',
                            type: QuestionType.TextInput,
                            validation: [{ type: ValidationRule.MaxLength, value: 200, message: '' }],
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
                        {
                            id: 'AT-012',
                            description: 'Height in cm',
                            additionalInfo: 'Add height in centimeters',
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
                        {
                            id: 'AT-013',
                            description: 'Width in cm',
                            additionalInfo: 'Add width in centimeters',
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
                        {
                            id: 'AT-014',
                            description: 'Weight in kg',
                            additionalInfo: 'Add weight in kilograms',
                            type: QuestionType.NumberInput,
                            requiredValidation: {
                                required: true,
                                message: 'This field is required',
                            },
                            validation: [
                                { type: ValidationRule.MinValue, value: 0.01, message: '' },
                                { type: ValidationRule.MaxValue, value: 5000, message: '' },
                                { type: ValidationRule.MaxDecimalPlaces, value: 2, message: '' },
                            ],
                        },
                    ],
                    conditionalLogic: [
                        { questionId: 'AT-008', answerId: 'AT-008-01', operator: ConditionalOperator.Equals },
                        { questionId: 'AT-037', answerId: 'AT-037-01', operator: ConditionalOperator.Equals },
                    ],
                },

                {
                    id: 'AT-015',
                    label: 'Can walk up and down aircraft',
                    type: QuestionType.Radio,
                    conditionalLogic: [
                        { questionId: 'AT-003', answerId: 'AT-003-04', operator: ConditionalOperator.Equals },
                        { questionId: 'AT-008', answerId: '', operator: ConditionalOperator.IsAnswered },
                        { questionId: 'AT-037', answerId: '', operator: ConditionalOperator.IsAnswered },
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
                    id: 'AT-016',
                    label: 'Can you move within the aircraft',
                    type: QuestionType.Radio,
                    conditionalLogic: [
                        { questionId: 'AT-015', answerId: 'AT-015-02', operator: ConditionalOperator.Equals },
                    ],
                    options: [
                        {
                            id: 'AT-016-01',
                            text: 'Yes',
                        },
                        {
                            id: 'AT-016-02',
                            text: 'No',
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
            id: 'dpna-section',
            title: 'Airport requirements',
            sitecoreKey: 'BlindDeafNonVisibleDisabilitySectionFields',
            progressBarGroup: 'airport-requirements',
            questions: [
                {
                    id: 'AT-017',
                    label: 'Are you travelling with an adult companion?',
                    type: QuestionType.Radio,
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                    options: [
                        {
                            id: 'AT-017-01',
                            text: 'Yes',
                            action: {
                                type: AnswerActionType.ShowPopup,
                                popupType: PopupType.NoTravelCompanion,
                                condition: {
                                    type: AnswerActionConditionType.NoOptionsAvailable,
                                    questionId: 'AT-018',
                                },
                            },
                        },
                        {
                            id: 'AT-017-02',
                            text: 'No',
                        },
                    ],
                },
                {
                    id: 'AT-018',
                    label: 'Please select the adult travelling with you who will act as your companion',
                    type: QuestionType.TravelCompanionSelection,
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                    conditionalLogic: [
                        { questionId: 'AT-017', answerId: 'AT-017-01', operator: ConditionalOperator.Equals },
                    ],
                },
            ],
            conditionalLogic: [
                { questionId: 'AT-002', answerId: 'AT-002-02', operator: ConditionalOperator.Equals },
                { questionId: 'AT-002', answerId: 'AT-002-03', operator: ConditionalOperator.Equals },
                { questionId: 'AT-002', answerId: 'AT-002-04', operator: ConditionalOperator.Equals },
                { questionId: 'AT-015', answerId: 'AT-015-01', operator: ConditionalOperator.Equals },
                { questionId: 'AT-016', answerId: '', operator: ConditionalOperator.IsAnswered },
            ],
        },
        {
            id: 'assistance-dog-section',
            title: 'Airport requirements',
            sitecoreKey: 'AssistanceDogSectionFields',
            progressBarGroup: 'airport-requirements',
            questions: [
                {
                    id: 'assistance-dog',
                    type: QuestionType.InfoOnly,
                    label: 'Eligibility rules for assistance dogs',
                    options: [
                        {
                            id: 'assistance-dog-understood',
                            text: 'Understood',
                        },
                    ],
                },
            ],
            conditionalLogic: [{ questionId: 'AT-002', answerId: 'AT-002-05', operator: ConditionalOperator.Equals }],
        },
        {
            id: 'dpna-section-safety-agreement',
            title: 'Airline safety declarations',
            sitecoreKey: 'SafetyDeclarationSectionFields',
            progressBarGroup: 'safety-declaration',
            questions: [
                {
                    id: 'AT-019',
                    label: 'Safety declaration statement',
                    type: QuestionType.AgreeDisagree,
                    options: [
                        {
                            id: 'AT-019-01',
                            text: 'I agree',
                            action: { type: AnswerActionType.GoToNextSection },
                            isAgreeOption: true,
                        },
                        {
                            id: 'AT-019-02',
                            text: 'I disagree',
                            isAgreeOption: false,
                            action: { type: AnswerActionType.ShowPopup, popupType: PopupType.SafetyConfirmation },
                        },
                    ],
                },
            ],
            conditionalLogic: [{ questionId: 'AT-017', answerId: 'AT-017-02', operator: ConditionalOperator.Equals }],
        },

        {
            id: 'nut-allergy-section',
            title: 'Airline safety declarations',
            sitecoreKey: 'NutAllergySectionFields',
            progressBarGroup: 'safety-declaration',
            questions: [
                {
                    id: 'nut-allergy',
                    label: 'Nut allergy statement',
                    type: QuestionType.AgreeDisagree,
                    options: [
                        {
                            id: 'nut-allergy-agree',
                            text: 'I agree',
                            action: { type: AnswerActionType.GoToNextSection },
                            isAgreeOption: true,
                        },
                        {
                            id: 'nut-allergy-disagree',
                            text: 'I disagree',
                            isAgreeOption: false,
                            action: { type: AnswerActionType.ShowPopup, popupType: PopupType.SafetyConfirmation },
                        },
                    ],
                },
            ],
            conditionalLogic: [{ questionId: 'AT-002', answerId: 'AT-002-06', operator: ConditionalOperator.Equals }],
        },
        {
            id: 'transfer-assistance-section',
            title: 'Transfer Assistance',
            sitecoreKey: 'TransferAssistanceSectionFields',
            progressBarGroup: 'transfer-assistance',
            sectionGlobalVisibility: {
                isVisible: true,
                settingToCheck: 'TransferSectionIsEnabled',
            },
            questions: [
                {
                    id: 'AT-032',
                    label: 'Do you need assistance with your transfer?',
                    type: QuestionType.Radio,
                    options: [
                        {
                            id: 'AT-032-01',
                            text: 'Yes',
                        },
                        {
                            id: 'AT-032-02',
                            text: 'No',
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                },
                {
                    id: 'AT-033',
                    label: 'What type of assistance do you need with your transfer?',
                    type: QuestionType.MultiSelect,
                    options: [
                        {
                            id: 'AT-033-01',
                            text: 'Help finding or boarding the vehicle',
                        },
                        {
                            id: 'AT-033-02',
                            text: 'Cannot climb steps into the vehicle',
                        },
                        {
                            id: 'AT-033-03',
                            text: 'Need to remain in my wheelchair during the journey',
                        },
                        {
                            id: 'AT-033-05',
                            text: 'Other (please specify)',

                            isOtherOption: true,
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                    conditionalLogic: [
                        { questionId: 'AT-032', answerId: 'AT-032-01', operator: ConditionalOperator.Equals },
                    ],
                },
            ],
        },
        {
            id: 'hotel-accessibility-section',
            title: 'Hotel Accessibility',
            sitecoreKey: 'HotelAssistanceSectionFields',
            progressBarGroup: 'hotel-accessibility',
            sectionGlobalVisibility: {
                isVisible: true,
                settingToCheck: 'HotelSectionIsEnabled',
            },
            questions: [
                {
                    id: 'AT-038',
                    label: 'Do you need assistance with your hotel?',
                    type: QuestionType.Radio,
                    options: [
                        {
                            id: 'AT-038-01',
                            text: 'Yes',
                        },
                        {
                            id: 'AT-038-02',
                            text: 'No',
                        },
                    ],
                    requiredValidation: {
                        required: true,
                        message: 'This field is required',
                    },
                },
                {
                    id: 'AT-034',
                    label: 'What accessibility- related room features do you need?',
                    type: QuestionType.MultiSelect,
                    options: [
                        {
                            id: 'AT-034-01',
                            text: 'Wheelchair accessible room',
                        },
                        {
                            id: 'AT-034-02',
                            text: 'Wheelchair accessible lifts in hotel',
                        },
                        {
                            id: 'AT-034-03',
                            text: 'Ground ﬂoor room',
                        },
                        {
                            id: 'AT-034-04',
                            text: 'Room located near main facilities',
                        },
                        {
                            id: 'AT-034-05',
                            text: 'Room near lift',
                        },
                        {
                            id: 'AT-034-06',
                            text: 'Quiet room',
                        },
                        {
                            id: 'AT-034-07',
                            text: 'Other (please specify)',

                            isOtherOption: true,
                        },
                    ],
                    requiredValidation: {
                        required: false,
                        message: 'This field is required',
                    },
                    conditionalLogic: [
                        { questionId: 'AT-038', answerId: 'AT-038-01', operator: ConditionalOperator.Equals },
                    ],
                },
                {
                    id: 'AT-035',
                    label: 'What in-room features do you need to make your stay comfortable and accessible?',
                    type: QuestionType.MultiSelect,
                    options: [
                        {
                            id: 'AT-035-01',
                            text: 'Fridge for medication',
                        },
                        {
                            id: 'AT-035-02',
                            text: 'Level access (step- free shower)',
                        },
                        {
                            id: 'AT-035-03',
                            text: 'Room wide enough for mobility device',
                        },
                        {
                            id: 'AT-035-04',
                            text: 'Adjustable bed height',
                        },
                        {
                            id: 'AT-035-06',
                            text: 'Separate beds',
                        },
                        {
                            id: 'AT-035-07',
                            text: 'Other (please specify)',

                            isOtherOption: true,
                        },
                    ],
                    requiredValidation: {
                        required: false,
                        message: 'This field is required',
                    },
                    conditionalLogic: [
                        { questionId: 'AT-038', answerId: 'AT-038-01', operator: ConditionalOperator.Equals },
                    ],
                },
            ],
        },
    ],
};
