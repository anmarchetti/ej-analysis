import { ValidationRule } from 'models/enum/ValidationRule';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export enum AgreeDisagreeValue {
    Agree = 'agree',
    Disagree = 'disagree',
}
export enum QuestionType {
    TextInput = 'text-input',
    Textarea = 'textarea',
    Radio = 'radio',
    MultiSelect = 'multi-select',
    NumberInput = 'number-input',
    InputSet = 'input-set',
    AgreeDisagree = 'agree-disagree',
    TravelCompanionSelection = 'travel-companion-selection',
    InfoOnly = 'info-only',
}

export enum ConditionalOperator {
    //Checks if there is an answer with a non-empty value for the specified question, regardless of the specific answerId.
    // Useful for questions where any answer should trigger the logic.
    IsAnswered = 'is-answered',
    //Checks if there is an answer with the specified answerId, regardless of the value.
    // Useful for questions where specific options trigger the logic.
    Equals = 'equals',
}

export interface IConditionalRule {
    operator: ConditionalOperator;
    /** Which question's answer to evaluate */
    questionId: string;
    /** The answer value to compare against (ignored for IsAnswered) */
    answerId?: string;
}

export interface IValidationRule {
    message: string;
    type: ValidationRule;
    value?: number;
}

export interface IRequiredValidation {
    message: string;
    required: boolean;
    // Optional custom message for when an "Other" option is selected but no value is provided
    otherOptionMessage?: string;
}

export enum AnswerActionType {
    /** Show a popup (e.g. Contact Us) */
    ShowPopup = 'show-popup',
    /** Automatically advance to the next section */
    GoToNextSection = 'go-to-next-section',
}

export enum AnswerActionConditionType {
    /** True when the referenced question has zero options at runtime */
    NoOptionsAvailable = 'no-options-available',
}

export interface IAnswerActionCondition {
    type: AnswerActionConditionType;
    /** Which question to evaluate the condition against */
    questionId?: string;
}

export interface IAnswerAction {
    /** What to do when this option is selected */
    type: AnswerActionType;
    /** Optional runtime condition that must also be true for the action to fire */
    condition?: IAnswerActionCondition;
    /** Which popup to show (required for ShowPopup) */
    popupType?: PopupType;
}

export interface IAnswerOption {
    id: string;
    text: string;
    /** Side-effect action triggered when this option is selected */
    action?: IAnswerAction;
    clearOtherSelections?: boolean;
    // For agree/disagree questions, indicates if this option represents the "Agree" choice (as opposed to "Disagree")
    isAgreeOption?: boolean;
    // Relevant for MultiSelect questions, indicates if this option represents an "Other" choice that allows custom user input
    isOtherOption?: boolean;
    textForSubmission?: string;
    textForSummary?: string;
}

export interface IFormQuestion {
    id: string;
    type: QuestionType;
    additionalInfo?: string;
    /** Array = OR logic. Empty / absent = always visible */
    conditionalLogic?: IConditionalRule[];
    description?: string;
    label?: string;
    labelSubmission?: string;
    labelSummary?: string;
    options?: IAnswerOption[];
    // Placeholder text for text inputs, not needed in initial definition but used in rendering
    placeholderLabel?: string;
    /** Nested questions, used by InputSet */
    questions?: IFormQuestion[];
    // Put it in the base question type for easier processing
    requiredValidation?: IRequiredValidation;
    // Not needed in initial definition, but used in the flattened map for easier cascade processing
    triggersQuestions?: string[];
    validation?: IValidationRule[];
}

export interface IFormSection {
    id: string;
    questions: IFormQuestion[];
    sitecoreKey: string;
    title: string;
    buttonContent?: {
        primaryButtonScreenReaderText?: ISitecoreField<string>;
        primaryButtonText?: ISitecoreField<string>;
        secondaryButtonScreenReaderText?: ISitecoreField<string>;
        secondaryButtonText?: ISitecoreField<string>;
    };
    /** Array = OR logic. Empty / absent = always visible */
    conditionalLogic?: IConditionalRule[];
    // Group multiple sections under a single progress bar step.
    // Sections sharing the same progressBarGroup value count as one step in the progress indicator.
    // The group is visible if ANY section in the group is visible, and uses the first visible section's title.
    progressBarGroup?: string;
    // Optional global visibility setting for the entire section, used for sections that don't have their own conditionalLogic
    // but should still be hidden/shown based on sitecore settings.
    // If the settingToCheck is enabled, the section will be visible;
    // if disabled, the section will be hidden.
    sectionGlobalVisibility?: {
        isVisible: boolean;
        settingToCheck?: string;
    };
    // Override for summary grouping. When set, answers from this section are grouped
    // under the specified summary group key instead of progressBarGroup.
    summaryGroup?: string;
}

export interface IFormDefinition {
    id: string;
    sections: IFormSection[];
}

export type TValue = string | number | undefined;
export type TAnswerValue = {
    answerId?: string;
    value?: TValue;
    valueForSubmission?: TValue;
};
export type TAnswer = {
    answers: TAnswerValue[];
    questionText: string;
    questionTextForSubmission: string;
    sectionGroup?: string;
};
// <questionId, answerValue>
export type TFormAnswers = Map<string, TAnswer>;
export type TFormErrors = Map<string, string>;

export enum PopupType {
    ContactUs = 'contact-us',
    BackButtonWarning = 'back-button-warning',
    SafetyConfirmation = 'safety-confirmation',
    NoTravelCompanion = 'no-travel-companion',
    SubmissionSuccess = 'submission-success',
    SubmissionFailed = 'submission-failed',
    GoBackToStartWarning = 'go-back-to-start-warning',
    FailedToLoadAssistedTravelRequests = 'failed-to-load-assisted-travel-requests',
}

export enum Screen {
    Introduction = 'Introduction',
    CustomerSelection = 'CustomerSelection',
    DynamicSection = 'DynamicSection',
    Summary = 'Summary',
}

export interface IQuestionProps {
    onChange: (value: TAnswerValue[], action?: IAnswerAction) => void;
    question: IFormQuestion;
    error?: string;
    value?: TAnswerValue;
}
