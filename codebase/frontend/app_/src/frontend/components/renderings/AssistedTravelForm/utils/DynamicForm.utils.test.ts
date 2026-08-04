import { ValidationRule } from 'models/enum/ValidationRule';
import { assistedTravelFormFieldsMock } from 'frontend/components/renderings/AssistedTravelForm/mocks/fields.mocks';
import {
    formDefinitionMock,
    formDefinitionTransformedMock,
} from 'frontend/components/renderings/AssistedTravelForm/mocks/formDefinition.mocks';
import {
    AnswerActionConditionType,
    ConditionalOperator,
    IFormSection,
    QuestionType,
    TAnswer,
    TFormAnswers,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';

import * as utils from './DynamicForm.utils';

describe('DynamicForm.utils', () => {
    describe('evaluateRule', () => {
        it('should return true for IsAnswered when answer is present', () => {
            const rule = { questionId: 'q1', answerId: 'a1', operator: ConditionalOperator.IsAnswered };
            const answers: TFormAnswers = new Map([
                [
                    'q1',
                    {
                        answers: [{ answerId: 'a1', value: 'foo' }],
                        questionId: 'q1',
                        questionText: 'Question 1',
                        questionTextForSubmission: 'Question 1',
                    },
                ],
            ]);
            expect(utils.evaluateRule(rule, answers)).toBe(true);
        });

        it('should return false for IsAnswered when answer is empty', () => {
            const rule = { questionId: 'q1', answerId: 'a1', operator: ConditionalOperator.IsAnswered };
            const answers: TFormAnswers = new Map([
                [
                    'q1',
                    {
                        answers: [],
                        questionId: 'q1',
                        questionText: 'Question 1',
                        questionTextForSubmission: 'Question 1',
                    },
                ],
            ]);
            expect(utils.evaluateRule(rule, answers)).toBe(false);
        });

        it('should return false for IsAnswered when answer value is empty', () => {
            const rule = { questionId: 'q1', answerId: 'a1', operator: ConditionalOperator.IsAnswered };
            const answers: TFormAnswers = new Map([
                [
                    'q1',
                    {
                        answers: [{ answerId: 'a1', value: '' }],
                        questionId: 'q1',
                        questionText: 'Question 1',
                        questionTextForSubmission: 'Question 1',
                    },
                ],
            ]);
            expect(utils.evaluateRule(rule, answers)).toBe(false);
        });

        it('should return false for IsAnswered when no answer', () => {
            const rule = { questionId: 'q1', answerId: 'a1', operator: ConditionalOperator.IsAnswered };
            const answers: TFormAnswers = new Map();
            expect(utils.evaluateRule(rule, answers)).toBe(false);
        });

        it('should return true for Equals when answer matches', () => {
            const rule = { questionId: 'q1', operator: ConditionalOperator.Equals, answerId: 'a1' };
            const answers: TFormAnswers = new Map([
                [
                    'q1',
                    {
                        answers: [{ answerId: 'a1', value: 'foo' }],
                        questionId: 'q1',
                        questionText: 'Question 1',
                        questionTextForSubmission: 'Question 1',
                    },
                ],
            ]);
            expect(utils.evaluateRule(rule, answers)).toBe(true);
        });

        it('should return false for Equals when answer does not match', () => {
            const rule = { questionId: 'q1', operator: ConditionalOperator.Equals, answerId: 'a2' };
            const answers: TFormAnswers = new Map([
                [
                    'q1',
                    {
                        answers: [{ answerId: 'a1', value: 'bar' }],
                        questionId: 'q1',
                        questionText: 'Question 1',
                        questionTextForSubmission: 'Question 1',
                    },
                ],
            ]);
            expect(utils.evaluateRule(rule, answers)).toBe(false);
        });
    });

    describe('checkVisibility', () => {
        it('should return true if no conditionalLogic', () => {
            expect(utils.checkVisibility(undefined, new Map())).toBe(true);
        });

        it('should return true if any rule is true', () => {
            const logic = [
                { questionId: 'q1', operator: ConditionalOperator.Equals, answerId: 'a1' },
                { questionId: 'q2', operator: ConditionalOperator.Equals, answerId: 'a2' },
            ];
            const answers = new Map([
                [
                    'q1',
                    {
                        answers: [{ answerId: 'a1', value: 'foo' }],
                        questionId: 'q1',
                        questionText: 'Question 1',
                        questionTextForSubmission: 'Question 1',
                    },
                ],
                [
                    'q2',
                    {
                        answers: [{ answerId: 'a3', value: 'bar' }],
                        questionId: 'q2',
                        questionText: 'Question 2',
                        questionTextForSubmission: 'Question 2',
                    },
                ],
            ]);
            expect(utils.checkVisibility(logic, answers)).toBe(true);
        });

        it('should return false if all rules are false', () => {
            const logic = [
                { questionId: 'q1', operator: ConditionalOperator.Equals, answerId: 'a1' },
                { questionId: 'q2', operator: ConditionalOperator.Equals, answerId: 'a2' },
            ];
            const answers = new Map([
                [
                    'q1',
                    {
                        answers: [{ answerId: 'b1', value: 'foo' }],
                        questionId: 'q1',
                        questionText: 'Question 1',
                        questionTextForSubmission: 'Question 1',
                    },
                ],
                [
                    'q2',
                    {
                        answers: [{ answerId: 'b2', value: 'bar' }],
                        questionId: 'q2',
                        questionText: 'Question 2',
                        questionTextForSubmission: 'Question 2',
                    },
                ],
            ]);
            expect(utils.checkVisibility(logic, answers)).toBe(false);
        });
    });

    describe('validateAnswer', () => {
        it('should return error message if required and value is empty and it is NOT multi select', () => {
            expect(
                utils.validateAnswer([{ answerId: 'a1', value: '' }], { required: true, message: 'Required!' }),
            ).toBe('Required!');
        });

        it('should return error message if required and value is empty and it is multi select', () => {
            expect(utils.validateAnswer([], { required: true, message: 'Required!' }, true)).toBe('Required!');
        });

        it('should return other option message if it is multi select and other option is selected but value is empty', () => {
            expect(
                utils.validateAnswer(
                    [{ answerId: 'a1', value: '' }],
                    { required: true, message: 'Required!', otherOptionMessage: 'Other option value required!' },
                    true,
                ),
            ).toBe('Other option value required!');
        });

        it('should return null if value is present and it is NOT multi select', () => {
            expect(
                utils.validateAnswer([{ answerId: 'a1', value: 'foo' }], { required: true, message: 'Required!' }),
            ).toBeNull();
        });

        it('should return null if value is empty and it is NOT required', () => {
            expect(
                utils.validateAnswer([{ answerId: 'a1', value: '' }], { required: false, message: 'Required!' }),
            ).toBeNull();
        });

        it('should return MinValue error when numeric value is below minimum', () => {
            const rules = [{ type: ValidationRule.MinValue, value: 0.01, message: 'Must be at least 0.01' }];
            expect(
                utils.validateAnswer(
                    [{ answerId: 'a1', value: '0' }],
                    { required: true, message: 'Required!' },
                    false,
                    rules,
                ),
            ).toBe('Must be at least 0.01');
        });

        it('should return MaxValue error when numeric value exceeds maximum', () => {
            const rules = [{ type: ValidationRule.MaxValue, value: 10000, message: 'Must not exceed 10000' }];
            expect(
                utils.validateAnswer(
                    [{ answerId: 'a1', value: '10001' }],
                    { required: true, message: 'Required!' },
                    false,
                    rules,
                ),
            ).toBe('Must not exceed 10000');
        });

        it('should return null when numeric value passes all validation rules', () => {
            const rules = [
                { type: ValidationRule.MinValue, value: 0.01, message: 'Too small' },
                { type: ValidationRule.MaxValue, value: 10000, message: 'Too large' },
                { type: ValidationRule.MaxDecimalPlaces, value: 2, message: 'Too many decimals' },
            ];
            expect(
                utils.validateAnswer(
                    [{ answerId: 'a1', value: '99.99' }],
                    { required: true, message: 'Required!' },
                    false,
                    rules,
                ),
            ).toBeNull();
        });

        it('should NOT run validation rules when value is empty', () => {
            const rules = [{ type: ValidationRule.MinValue, value: 0.01, message: 'Too small' }];
            expect(
                utils.validateAnswer(
                    [{ answerId: 'a1', value: '' }],
                    { required: false, message: 'Required!' },
                    false,
                    rules,
                ),
            ).toBeNull();
        });

        it('should return null for a value at the exact minimum boundary', () => {
            const rules = [{ type: ValidationRule.MinValue, value: 0.01, message: 'Too small' }];
            expect(
                utils.validateAnswer(
                    [{ answerId: 'a1', value: '0.01' }],
                    { required: true, message: 'Required!' },
                    false,
                    rules,
                ),
            ).toBeNull();
        });

        it('should return null for a value with exactly the max allowed decimal places', () => {
            const rules = [{ type: ValidationRule.MaxDecimalPlaces, value: 2, message: 'Too many decimals' }];
            expect(
                utils.validateAnswer(
                    [{ answerId: 'a1', value: '5.12' }],
                    { required: true, message: 'Required!' },
                    false,
                    rules,
                ),
            ).toBeNull();
        });
    });

    describe('transformFormDefinition', () => {
        it('should map section and question content from fields and triggersQuestions property', () => {
            const result = utils.transformFormDefinition(formDefinitionMock, assistedTravelFormFieldsMock, []);

            expect(result).toEqual(formDefinitionTransformedMock);
        });
    });

    describe('buildQuestionIndex', () => {
        it('should index questions and sections', () => {
            const sections: IFormSection[] = [
                {
                    id: 's1',
                    questions: [
                        { id: 'q1', type: QuestionType.TextInput },
                        {
                            id: 'q2',
                            type: QuestionType.InputSet,
                            questions: [{ id: 'q2a', type: QuestionType.TextInput }],
                        },
                    ],
                    title: 'Section 1',
                    sitecoreKey: 'Section1',
                },
                {
                    id: 's2',
                    questions: [
                        { id: 'q3', type: QuestionType.TextInput },
                        {
                            id: 'q4',
                            type: QuestionType.Radio,
                        },
                    ],
                    conditionalLogic: [
                        { questionId: 'q1', operator: ConditionalOperator.IsAnswered, answerId: '' },
                        { questionId: 'q2a', operator: ConditionalOperator.IsAnswered, answerId: '' },
                    ],
                    title: 'Section 2',
                    sitecoreKey: 'Section2',
                },
            ];

            const index = utils.buildQuestionIndex(sections);
            expect(index.questionById.get('q1')).toEqual(sections[0].questions[0]);
            expect(index.questionById.get('q2a')).toEqual(sections[0].questions[1].questions![0]);
            expect(index.questionById.get('q3')).toEqual(sections[1].questions[0]);
            expect(index.questionById.get('q4')).toEqual(sections[1].questions[1]);
            expect(index.sectionByQuestionId.get('q1')).toEqual(sections[0]);
            expect(index.sectionByQuestionId.get('q2a')).toEqual(sections[0]);
            expect(index.sectionByQuestionId.get('q3')).toEqual(sections[1]);
            expect(index.sectionByQuestionId.get('q4')).toEqual(sections[1]);
            expect(index.sectionsByDependencyQuestionId.get('q2a')).toEqual([sections[1]]);
        });
    });

    describe('evaluateActionCondition', () => {
        it('should return true for NoOptionsAvailable when question has no options', () => {
            const condition = { type: AnswerActionConditionType.NoOptionsAvailable, questionId: 'q1' };
            const getQuestionById = (id: string) => ({ id, type: QuestionType.Radio, options: [] });
            expect(utils.evaluateActionCondition(condition, getQuestionById)).toBe(true);
        });

        it('should return false for NoOptionsAvailable when question has options', () => {
            const condition = { type: AnswerActionConditionType.NoOptionsAvailable, questionId: 'q1' };
            const getQuestionById = (id: string) => ({
                id,
                type: QuestionType.Radio,
                options: [{ id: 'o1', text: 'Option 1', value: 'o1' }],
            });
            expect(utils.evaluateActionCondition(condition, getQuestionById)).toBe(false);
        });

        it('should return true if condition is NOT provided', () => {
            const getQuestionById = (id: string) => ({ id, type: QuestionType.Radio, options: [] });
            expect(utils.evaluateActionCondition(undefined, getQuestionById)).toBe(true);
        });

        it('should return false if condition type is unrecognized', () => {
            const condition = { type: 'unknown-condition-type', questionId: 'q1' } as any;
            const getQuestionById = (id: string) => ({ id, type: QuestionType.Radio, options: [] });
            expect(utils.evaluateActionCondition(condition, getQuestionById)).toBe(false);
        });
    });

    describe('getAnswersBySectionGroup', () => {
        const makeAnswer = (sectionGroup?: string): TAnswer => ({
            answers: [{ answerId: 'a1', value: 'foo' }],
            questionText: 'Question',
            questionTextForSubmission: 'Question',
            sectionGroup,
        });

        it('should return empty array when answers map is empty', () => {
            const result = utils.getAnswersBySection(new Map(), 'John', 'Customer');
            expect(result).toEqual([]);
        });

        it('should return empty array when no answers have a sectionGroup', () => {
            const answers: TFormAnswers = new Map([
                ['q1', makeAnswer()],
                ['q2', makeAnswer()],
            ]);
            const result = utils.getAnswersBySection(answers, 'John', 'Customer');
            expect(result).toEqual([]);
        });

        it('should group answers by sectionGroup', () => {
            const answer1 = makeAnswer('section-1');
            const answer2 = makeAnswer('section-1');
            const answer3 = makeAnswer('section-2');
            const answers: TFormAnswers = new Map([
                ['q1', answer1],
                ['q2', answer2],
                ['q3', answer3],
            ]);

            const result = utils.getAnswersBySection(answers, 'John', 'Customer Name');

            expect(result).toEqual([
                {
                    sectionGroup: 'section-1',
                    answers: [
                        {
                            questionText: 'Customer Name',
                            questionTextForSubmission: 'Customer Name',
                            answers: [{ value: 'John', valueForSubmission: 'John' }],
                        },
                        answer1,
                        answer2,
                    ],
                },
                {
                    sectionGroup: 'section-2',
                    answers: [answer3],
                },
            ]);
        });

        it('should prepend the customer entry to the first section', () => {
            const answer1 = makeAnswer('section-1');
            const answers: TFormAnswers = new Map([['q1', answer1]]);

            const result = utils.getAnswersBySection(answers, 'John Doe', 'Customer Name');

            expect(result[0].answers[0]).toEqual({
                questionText: 'Customer Name',
                questionTextForSubmission: 'Customer Name',
                answers: [{ value: 'John Doe', valueForSubmission: 'John Doe' }],
            });
        });

        it('should NOT prepend customer entry when there are no sections', () => {
            const answers: TFormAnswers = new Map([['q1', makeAnswer()]]);

            const result = utils.getAnswersBySection(answers, 'John', 'Customer');

            expect(result).toEqual([]);
        });

        it('should exclude answers without sectionGroup from output', () => {
            const answerWithGroup = makeAnswer('section-1');
            const answerWithoutGroup = makeAnswer();
            const answers: TFormAnswers = new Map([
                ['q1', answerWithGroup],
                ['q2', answerWithoutGroup],
            ]);

            const result = utils.getAnswersBySection(answers, 'John', 'Customer');

            expect(result).toHaveLength(1);
            expect(result[0].answers).not.toContain(answerWithoutGroup);
        });
    });

    describe('getUniqueIds', () => {
        it('should always return questionId', () => {
            const result = utils.getUniqueIds('AT-001');
            expect(result.questionId).toBe('question-AT-001');
        });

        it('should return all IDs when all flags are true', () => {
            const result = utils.getUniqueIds('AT-001', true, true, true, true);
            expect(result).toEqual({
                questionId: 'question-AT-001',
                errorId: 'error-AT-001',
                additionalInfoId: 'additional-info-AT-001',
                labelId: 'label-AT-001',
                placeholderId: 'placeholder-AT-001',
            });
        });

        it('should return undefined for all optional IDs when all flags are false (defaults)', () => {
            const result = utils.getUniqueIds('AT-001');
            expect(result.errorId).toBeUndefined();
            expect(result.additionalInfoId).toBeUndefined();
            expect(result.labelId).toBeUndefined();
            expect(result.placeholderId).toBeUndefined();
        });

        it('should return errorId only when isErrorPresent is true', () => {
            const result = utils.getUniqueIds('AT-001', true);
            expect(result.errorId).toBe('error-AT-001');
            expect(result.additionalInfoId).toBeUndefined();
            expect(result.labelId).toBeUndefined();
            expect(result.placeholderId).toBeUndefined();
        });

        it('should return additionalInfoId only when isAdditionalInfoPresent is true', () => {
            const result = utils.getUniqueIds('AT-001', false, true);
            expect(result.additionalInfoId).toBe('additional-info-AT-001');
            expect(result.errorId).toBeUndefined();
            expect(result.labelId).toBeUndefined();
            expect(result.placeholderId).toBeUndefined();
        });

        it('should return labelId only when isLabelPresent is true', () => {
            const result = utils.getUniqueIds('AT-001', false, false, true);
            expect(result.labelId).toBe('label-AT-001');
            expect(result.errorId).toBeUndefined();
            expect(result.additionalInfoId).toBeUndefined();
            expect(result.placeholderId).toBeUndefined();
        });

        it('should return placeholderId only when isPlaceholderPresent is true', () => {
            const result = utils.getUniqueIds('AT-001', false, false, false, true);
            expect(result.placeholderId).toBe('placeholder-AT-001');
            expect(result.errorId).toBeUndefined();
            expect(result.additionalInfoId).toBeUndefined();
            expect(result.labelId).toBeUndefined();
        });
    });

    describe('hasExcessDecimalPlaces', () => {
        it('should return false when input has no decimal separator', () => {
            expect(utils.hasExcessDecimalPlaces('123', 2)).toBe(false);
        });

        it('should return false when decimal places are within the limit', () => {
            expect(utils.hasExcessDecimalPlaces('1.23', 2)).toBe(false);
        });

        it('should return false when decimal places are exactly at the limit', () => {
            expect(utils.hasExcessDecimalPlaces('1.23', 2)).toBe(false);
        });

        it('should return true when decimal places exceed the limit using dot separator', () => {
            expect(utils.hasExcessDecimalPlaces('1.234', 2)).toBe(true);
        });

        it('should return true when decimal places exceed the limit using comma separator', () => {
            expect(utils.hasExcessDecimalPlaces('1,234', 2)).toBe(true);
        });

        it('should return false when comma separator decimal places are within the limit', () => {
            expect(utils.hasExcessDecimalPlaces('1,23', 2)).toBe(false);
        });

        it('should use the last separator when both dot and comma are present', () => {
            expect(utils.hasExcessDecimalPlaces('1.2,34', 1)).toBe(true);
            expect(utils.hasExcessDecimalPlaces('1,2.3', 1)).toBe(false);
        });

        it('should return false for an integer with maxPlaces of 0', () => {
            expect(utils.hasExcessDecimalPlaces('123', 0)).toBe(false);
        });

        it('should return true when any decimal digit is present and maxPlaces is 0', () => {
            expect(utils.hasExcessDecimalPlaces('1.1', 0)).toBe(true);
        });
    });
});
