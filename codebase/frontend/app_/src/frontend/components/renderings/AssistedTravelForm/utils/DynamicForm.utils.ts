import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ValidationRule } from 'models/enum/ValidationRule';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import {
    IAnswerItem,
    IAssistedTravelFormFields,
    IDynamicSectionFields,
    IQuestionItem,
    ISettingFields,
    IValidationErrorMessageFields,
} from 'frontend/components/renderings/AssistedTravelForm/models/interface';
import {
    AnswerActionConditionType,
    ConditionalOperator,
    IAnswerActionCondition,
    IAnswerOption,
    IConditionalRule,
    IFormDefinition,
    IFormQuestion,
    IFormSection,
    IRequiredValidation,
    IValidationRule,
    QuestionType,
    TAnswer,
    TAnswerValue,
    TFormAnswers,
    TValue,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';

/**
 * Evaluates a single conditional rule against the current answers.
 */
export const evaluateRule = (rule: IConditionalRule, answers: TFormAnswers): boolean => {
    const answer = answers.get(rule.questionId)?.answers;

    switch (rule.operator) {
        case ConditionalOperator.IsAnswered:
            return !!answer?.some(a => a.value);
        case ConditionalOperator.Equals:
            return !!answer?.some(a => a.answerId === rule.answerId);
        default:
            return false;
    }
};

//Decides whether a question or section should be shown.
export const checkVisibility = (
    conditionalLogic: IConditionalRule[] | undefined,
    answers: TFormAnswers,
    isVisible: boolean = true,
): boolean => {
    if (!isVisible) return false;

    if (conditionalLogic?.length) {
        return conditionalLogic.some(rule => evaluateRule(rule, answers));
    }

    return true;
};

//Returns an error message string if the value is invalid, or null if it's fine.
//Currently only supports required field validation, but can be extended with more complex rules as needed.
export const validateAnswer = (
    answers?: TAnswerValue[],
    requiredValidation?: IRequiredValidation,
    isMultiSelect?: boolean,
    validationRules?: IValidationRule[],
): string | null => {
    const hasAnswer = answers && !answers?.some(a => !a.value?.toString()?.trim());

    if (
        (isMultiSelect && requiredValidation?.required && (!answers || answers?.length === 0)) ||
        (!isMultiSelect && requiredValidation?.required && !hasAnswer)
    ) {
        return requiredValidation.message;
    }

    if (isMultiSelect && answers && answers.length > 0 && !hasAnswer) {
        return requiredValidation?.otherOptionMessage || '';
    }

    // Run additional validation rules only when there is a non-empty value
    if (validationRules?.length && answers?.length === 1) {
        const value = answers[0].value;
        const error = validateValueAgainstRules(value, validationRules);

        if (error) return error;
    }

    return null;
};

const validateValueAgainstRules = (value: TValue, rules: IValidationRule[]): string | null => {
    if (value === undefined || value === '') return null;

    const numericValue = typeof value === 'number' ? value : Number.parseFloat(String(value));

    for (const rule of rules) {
        switch (rule.type) {
            case ValidationRule.MinValue:
                if (!Number.isNaN(numericValue) && rule.value !== undefined && numericValue < rule.value) {
                    return rule.message;
                }

                break;
            case ValidationRule.MaxValue:
                if (!Number.isNaN(numericValue) && rule.value !== undefined && numericValue > rule.value) {
                    return rule.message;
                }

                break;
        }
    }

    return null;
};

// Injects Sitecore-managed content into the form definition based on matching keys, and returns a new transformed form definition.
// Adds question triggersQuestions based on the conditional logic to simplify processing in the form component.
export const transformFormDefinition = (
    formDefinition: IFormDefinition,
    fields: IAssistedTravelFormFields,
    travelCompanions: string[],
): IFormDefinition => {
    const mappedSections = formDefinition.sections.map(section => {
        const sectionFields = fields[section.sitecoreKey as keyof IAssistedTravelFormFields] as
            | ISitecoreCompositeField<IDynamicSectionFields>
            | undefined;

        const questionContent = getTransformedQuestionsContent(
            section.questions,
            formDefinition,
            fields,
            sectionFields?.fields.Questions,
            travelCompanions,
        );

        return {
            ...section,
            title: sectionFields?.fields.Title.value || '',
            buttonContent: {
                primaryButtonScreenReaderText: sectionFields?.fields.PrimaryButtonScreenReaderText,
                primaryButtonText: sectionFields?.fields.PrimaryButtonLabel,
                secondaryButtonScreenReaderText: sectionFields?.fields.SecondaryButtonScreenReaderText,
                secondaryButtonText: sectionFields?.fields.SecondaryButtonLabel,
            },
            questions: questionContent,
            sectionGlobalVisibility: {
                isVisible:
                    fields[section.sectionGlobalVisibility?.settingToCheck as keyof ISettingFields]?.value ?? true,
            },
        };
    });

    return { ...formDefinition, sections: mappedSections };
};
const buildTriggeredQuestionsMap = (formDefinition: IFormDefinition): Map<string, Set<string>> => {
    const map = new Map<string, Set<string>>();
    for (const section of formDefinition.sections) {
        for (const question of section.questions) {
            for (const rule of question.conditionalLogic ?? []) {
                const set = map.get(rule.questionId) ?? new Set();
                set.add(question.id);
                map.set(rule.questionId, set);
            }
        }
    }

    return map;
};

const getTransformedQuestionsContent = (
    questions: IFormQuestion[],
    formDefinition: IFormDefinition,
    errorsContent: IValidationErrorMessageFields,
    questionFields?: ISitecoreCompositeField<IQuestionItem>[],
    travelCompanions?: string[],
): IFormQuestion[] => {
    const triggeredQuestionsMap = buildTriggeredQuestionsMap(formDefinition);

    const transformedQuestions = questions.map((question): IFormQuestion => {
        const questionContent = questionFields?.find(q => q.fields.Code.value === question.id);

        const { Label, PlaceholderLabel, Description, AdditionalInfo, LabelSummary, LabelSubmission } =
            questionContent?.fields || {};

        const commonProperties = {
            label: Label?.value,
            labelSubmission: LabelSubmission?.value,
            labelSummary: LabelSummary?.value || Label?.value,
            description: Description?.value,
            placeholderLabel: PlaceholderLabel?.value,
            additionalInfo: AdditionalInfo?.value,
            requiredValidation: {
                required: question.requiredValidation?.required || false,
                message: getRequiredErrorMessageByQuestionType(question.type, errorsContent),
                otherOptionMessage: errorsContent.OtherValueRequired.value,
            },
            triggersQuestions: [...(triggeredQuestionsMap.get(question.id) ?? [])],
            validation: getValidationRulesWithMessages(question.validation, errorsContent),
        };

        if (question.type === QuestionType.TravelCompanionSelection) {
            return {
                ...question,
                ...commonProperties,
                options: travelCompanions
                    ? travelCompanions.map((companion, index) => ({
                          id: index.toString(),
                          text: companion,
                          textForSummary: companion,
                          textForSubmission: companion,
                      }))
                    : [],
            };
        }

        if (question.type === QuestionType.InputSet) {
            return {
                ...question,
                label: Label?.value,
                description: Description?.value,
                placeholderLabel: PlaceholderLabel?.value,
                additionalInfo: AdditionalInfo?.value,
                questions: getTransformedQuestionsContent(
                    question.questions || [],
                    formDefinition,
                    errorsContent,
                    questionContent?.fields.Questions,
                ),
            };
        }

        return {
            ...question,
            ...commonProperties,
            options: getAnswersContent(question.options || [], questionContent?.fields.Answers),
        };
    });

    return transformedQuestions;
};
const getRequiredErrorMessageByQuestionType = (
    questionType: QuestionType,
    fields: IValidationErrorMessageFields,
): string => {
    switch (questionType) {
        case QuestionType.MultiSelect:
            return fields.MultiSelectValueRequired.value;
        case QuestionType.TravelCompanionSelection:
        case QuestionType.Radio:
            return fields.RadioButtonValueRequired.value;
        case QuestionType.TextInput:
        case QuestionType.Textarea:
        case QuestionType.NumberInput:
            return fields.TextInputRequired.value;
        default:
            return '';
    }
};

const getValidationErrorMessageByType = (rule: IValidationRule, fields: IValidationErrorMessageFields): string => {
    switch (rule.type) {
        case ValidationRule.MinValue:
            return fields.NumberMinValueError.value;
        case ValidationRule.MaxValue:
            return fields.NumberMaxValueError.value;
        default:
            return '';
    }
};

const getValidationRulesWithMessages = (
    rules: IValidationRule[] | undefined,
    fields: IValidationErrorMessageFields,
): IValidationRule[] | undefined => {
    if (!rules?.length) return undefined;

    return rules.map(rule => ({
        ...rule,
        message: Tokenizer.replaceToken(
            getValidationErrorMessageByType(rule, fields),
            Tokens.Value,
            rule.value?.toString() || '',
        ),
    }));
};

const getAnswersContent = (
    answers: IAnswerOption[],
    questionFields?: ISitecoreCompositeField<IAnswerItem>[],
): IAnswerOption[] =>
    answers.map((option): IAnswerOption => {
        const answerFields = questionFields?.find(a => a.fields.Code.value === option.id);

        const { Label, LabelSummary, LabelSubmission } = answerFields?.fields || {};

        return {
            ...option,
            text: Label?.value || '',
            textForSummary: LabelSummary?.value || Label?.value || '',
            textForSubmission: LabelSubmission?.value,
        };
    });
interface IQuestionIndex {
    questionById: Map<string, IFormQuestion>;
    sectionByQuestionId: Map<string, IFormSection>;
    sectionsByDependencyQuestionId: Map<string, IFormSection[]>;
}

export const buildQuestionIndex = (sections: IFormSection[]): IQuestionIndex => {
    const questionById = new Map<string, IFormQuestion>();
    const sectionByQuestionId = new Map<string, IFormSection>();
    const sectionsByDependencyQuestionId = new Map<string, IFormSection[]>();

    for (const section of sections) {
        for (const rule of section.conditionalLogic ?? []) {
            const existing = sectionsByDependencyQuestionId.get(rule.questionId) ?? [];
            existing.push(section);
            sectionsByDependencyQuestionId.set(rule.questionId, existing);
        }

        for (const q of section.questions) {
            questionById.set(q.id, q);
            sectionByQuestionId.set(q.id, section);

            q.questions?.forEach(child => {
                questionById.set(child.id, child);
                sectionByQuestionId.set(child.id, section);
            });
        }
    }

    return { questionById, sectionByQuestionId, sectionsByDependencyQuestionId };
};

export const evaluateActionCondition = (
    condition: IAnswerActionCondition | undefined,
    getQuestion: (id: string) => IFormQuestion | undefined,
): boolean => {
    if (!condition) return true;

    if (condition.type === AnswerActionConditionType.NoOptionsAvailable) {
        const q = condition.questionId ? getQuestion(condition.questionId) : undefined;

        return !q?.options?.length;
    }

    return false;
};

export interface ISectionSummary {
    answers: TAnswer[];
    sectionGroup: string;
}

export const getAnswersBySection = (
    answers: TFormAnswers,
    customerName: string,
    labelCustomer: string,
): ISectionSummary[] => {
    const sectionGroups = new Set<string>();
    answers.forEach(answer => {
        if (answer.sectionGroup) {
            sectionGroups.add(answer.sectionGroup);
        }
    });

    const formSummary: ISectionSummary[] = [];
    sectionGroups.forEach(group => {
        const groupAnswers = Array.from(answers.values()).filter(a => a.sectionGroup === group);

        const sectionSummary = {
            answers: groupAnswers,
            sectionGroup: group,
        };
        formSummary.push(sectionSummary);
    });

    //add customer in first section first position
    if (formSummary.length > 0) {
        const firstSectionAnswers = formSummary[0].answers;
        firstSectionAnswers.unshift({
            questionText: labelCustomer,
            questionTextForSubmission: labelCustomer,
            answers: [
                {
                    value: customerName,
                    valueForSubmission: customerName,
                },
            ],
        });
    }

    return formSummary;
};

export const getUniqueIds = (
    id: string,
    isErrorPresent: boolean = false,
    isAdditionalInfoPresent: boolean = false,
    isLabelPresent: boolean = false,
    isPlaceholderPresent: boolean = false,
): {
    additionalInfoId: string | undefined;
    errorId: string | undefined;
    labelId: string | undefined;
    placeholderId: string | undefined;
    questionId: string;
} => {
    const errorId = isErrorPresent ? `error-${id}` : undefined;
    const labelId = isLabelPresent ? `label-${id}` : undefined;
    const questionId = `question-${id}`;
    const additionalInfoId = isAdditionalInfoPresent ? `additional-info-${id}` : undefined;
    const placeholderId = isPlaceholderPresent ? `placeholder-${id}` : undefined;

    return {
        errorId,
        labelId,
        questionId,
        additionalInfoId,
        placeholderId,
    };
};

export const hasExcessDecimalPlaces = (input: string, maxPlaces: number): boolean => {
    const lastSepIndex = Math.max(input.lastIndexOf('.'), input.lastIndexOf(','));

    if (lastSepIndex === -1) return false;

    const decimalPart = input.slice(lastSepIndex + 1);

    return decimalPart.length > maxPlaces;
};
