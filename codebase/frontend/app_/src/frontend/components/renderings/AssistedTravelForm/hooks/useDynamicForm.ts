import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    AnswerActionType,
    IAnswerAction,
    IFormDefinition,
    IFormQuestion,
    IFormSection,
    PopupType,
    QuestionType,
    Screen,
    TAnswerValue,
    TFormAnswers,
    TFormErrors,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';
import {
    buildQuestionIndex,
    checkVisibility,
    evaluateActionCondition,
    validateAnswer,
} from 'frontend/components/renderings/AssistedTravelForm/utils/DynamicForm.utils';

export interface IDynamicFormState {
    answers: TFormAnswers;
    currentSection: IFormSection | null;
    currentSectionName: string;
    currentStepInProgressBar: number;
    errors: TFormErrors;
    goNext: () => void;
    goPrev: () => void;
    goToFormStart: () => void;
    isQuestionVisible: (questionId: string) => boolean;
    resetDynamicForm: () => void;
    setAnswer: (questionId: string, value: TAnswerValue[], action?: IAnswerAction) => void;
    totalProgressBarSteps: number;
    validateCurrentSection: () => boolean;
}

export const useDynamicForm = (
    formDefinition: IFormDefinition,
    goToScreen: (screen: Screen) => void,
    setVisiblePopup: (popup: PopupType | null) => void,
): IDynamicFormState => {
    const [answers, setAnswers] = useState<TFormAnswers>(new Map());
    const [errors, setErrors] = useState<TFormErrors>(new Map());
    // Stored as state so it batches with the setAnswers update in setAnswer;
    // by the time the useEffect below runs, visibleSections and
    // currentSectionIndex are already recomputed from the new answers.
    const [pendingAction, setPendingAction] = useState<{ action: IAnswerAction; questionId: string } | null>(null);

    const index = useMemo(() => buildQuestionIndex(formDefinition.sections), [formDefinition]);

    const [currentSectionId, setCurrentSectionId] = useState<string | null>(
        () => formDefinition.sections[0]?.id ?? null,
    );

    const visibleSections = useMemo(
        () =>
            formDefinition.sections.filter(s =>
                checkVisibility(s.conditionalLogic, answers, s.sectionGlobalVisibility?.isVisible),
            ),
        [formDefinition.sections, answers],
    );

    const currentSectionIndex = useMemo(() => {
        const idx = visibleSections.findIndex(s => s.id === currentSectionId);

        return Math.max(idx, 0);
    }, [visibleSections, currentSectionId]);

    const currentSection = visibleSections[currentSectionIndex] ?? null;

    // Progress bar grouping: sections sharing the same progressBarGroup count as one step.
    // Ungrouped sections each count as their own step.
    // If section has no progressBarGroup, it is excluded from progress bar and does not contribute to total step count.
    const { currentStepInProgressBar, totalProgressBarSteps, currentSectionName } = useMemo(() => {
        const groupKeys = new Set<string>();

        for (const section of visibleSections) {
            const key = section.progressBarGroup ?? '';

            if (key) {
                groupKeys.add(key);
            }
        }

        const currentKey = currentSection?.progressBarGroup ?? '';
        const idx = Array.from(groupKeys).indexOf(currentKey) + 1;

        return {
            currentStepInProgressBar: Math.max(idx, 0),
            totalProgressBarSteps: groupKeys.size,
            currentSectionName: currentSection?.title ?? '',
        };
    }, [visibleSections, currentSection]);

    const isQuestionVisible = useCallback(
        (questionId: string): boolean => {
            const q = index.questionById.get(questionId);

            if (!q) return false;

            const section = index.sectionByQuestionId.get(questionId);
            const sectionVisible = !section || checkVisibility(section.conditionalLogic, answers);

            return sectionVisible && checkVisibility(q.conditionalLogic, answers);
        },
        [index, answers],
    );

    const setAnswer = useCallback(
        (questionId: string, value: TAnswerValue[], action?: IAnswerAction) => {
            setAnswers(prev => {
                const next = new Map(prev);
                const question = index.questionById.get(questionId);
                const answerSection = index.sectionByQuestionId.get(questionId);

                next.set(questionId, {
                    questionText: question?.labelSummary ?? '',
                    questionTextForSubmission: question?.labelSubmission ?? '',
                    answers: value,
                    sectionGroup: answerSection?.title,
                });

                // BFS — question-level cascade (unchanged)
                const queue = [...(question?.triggersQuestions ?? [])];
                while (queue.length > 0) {
                    const id = queue.shift()!;
                    const q = index.questionById.get(id);

                    if (!q) continue;

                    const section = index.sectionByQuestionId.get(id);
                    const sectionVisible = !section || checkVisibility(section.conditionalLogic, next);
                    const questionVisible = sectionVisible && checkVisibility(q.conditionalLogic, next);

                    if (!questionVisible) {
                        next.delete(q.id);
                        q.questions?.forEach(child => next.delete(child.id));
                        queue.push(...(q.triggersQuestions ?? []));
                    }
                }

                // Section-level cleanup — check every section whose conditionalLogic
                // directly references the question that just changed. If the section
                // is now hidden, clear all its questions regardless of whether they
                // have their own conditionalLogic or triggersQuestions edges.
                const affectedSections = index.sectionsByDependencyQuestionId.get(questionId) ?? [];

                for (const section of affectedSections) {
                    if (!checkVisibility(section.conditionalLogic, next)) {
                        for (const q of section.questions) {
                            next.delete(q.id);
                            q.questions?.forEach(child => next.delete(child.id));
                        }
                    }
                }

                return next;
            });

            setErrors(prev => {
                if (!prev.has(questionId)) return prev;

                const next = new Map(prev);
                next.delete(questionId);

                return next;
            });

            if (action) {
                setPendingAction({ action, questionId });
            }
        },
        [index],
    );

    // Only validates questions that are currently visible. Invisible questions
    // are skipped even if they would otherwise be required, because they've been
    // cleared by the cascade and the user can't fill them in.
    const validateCurrentSection = useCallback((): boolean => {
        if (!currentSection) return true;

        const newErrors = new Map<string, string>();
        let isValid = true;
        let firstErrorQuestionId: string | null = null;

        const validateQuestions = (questions: IFormQuestion[]): void => {
            for (const question of questions) {
                if (!checkVisibility(question.conditionalLogic, answers)) continue;

                const error = validateAnswer(
                    answers.get(question.id)?.answers,
                    question.requiredValidation,
                    question.type === QuestionType.MultiSelect,
                    question.validation,
                );

                //Even if content is not set up for error messages, we want to set some error to prevent user from proceeding without filling required questions
                if (error !== null) {
                    newErrors.set(question.id, error);

                    if (!firstErrorQuestionId) {
                        firstErrorQuestionId = question.id;
                    }

                    isValid = false;
                }

                // Recurse into InputSet children
                if (question.questions) validateQuestions(question.questions);
            }
        };

        validateQuestions(currentSection.questions);
        setErrors(newErrors);

        if (firstErrorQuestionId) {
            requestAnimationFrame(() => {
                const questionElement = document.getElementById(`question-${firstErrorQuestionId}`);
                const firstInput = questionElement?.querySelector('input, textarea, select') as HTMLElement | null;

                firstInput?.focus();
                firstInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }

        return isValid;
    }, [currentSection, answers]);

    const goNext = useCallback((): void => {
        if (!validateCurrentSection()) {
            return;
        }

        const nextIdx = currentSectionIndex + 1;

        if (nextIdx < visibleSections.length) {
            setCurrentSectionId(visibleSections[nextIdx].id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        if (nextIdx === visibleSections.length) {
            goToScreen(Screen.Summary);
        }
    }, [validateCurrentSection, currentSectionIndex, visibleSections, goToScreen]);

    const goPrev = useCallback((): void => {
        const prevIdx = currentSectionIndex - 1;

        if (prevIdx >= 0) {
            setCurrentSectionId(visibleSections[prevIdx].id);
        } else {
            goToScreen(Screen.CustomerSelection);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentSectionIndex, visibleSections, goToScreen]);

    const goToFormStart = useCallback((): void => {
        if (visibleSections.length > 0) {
            setCurrentSectionId(visibleSections[0].id);
        }
    }, [visibleSections]);

    useEffect(() => {
        if (!pendingAction) return;

        setPendingAction(null);

        const { action, questionId } = pendingAction;
        const question = index.questionById.get(questionId);

        if (!question?.options?.length) return;

        if (!evaluateActionCondition(action.condition, id => index.questionById.get(id))) {
            return;
        }

        switch (action.type) {
            case AnswerActionType.ShowPopup:
                setVisiblePopup(action.popupType ?? PopupType.ContactUs);
                //Clear the answer that triggered the popup so the conditionally-dependent
                //question does not appear while the popup is visible.
                setAnswers(prev => {
                    const next = new Map(prev);
                    next.delete(questionId);

                    return next;
                });
                break;
            case AnswerActionType.GoToNextSection: {
                const nextIdx = currentSectionIndex + 1;

                if (nextIdx < visibleSections.length) {
                    setCurrentSectionId(visibleSections[nextIdx].id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }

                if (nextIdx === visibleSections.length) {
                    goToScreen(Screen.Summary);
                }

                break;
            }
            default:
                break;
        }
    }, [pendingAction, index, setVisiblePopup, visibleSections, currentSectionIndex, goToScreen]);

    const resetDynamicForm = useCallback((): void => {
        setCurrentSectionId(formDefinition.sections[0]?.id ?? null);
        setAnswers(new Map());
        setErrors(new Map());
    }, [formDefinition]);

    return {
        answers,
        currentSection,
        errors,
        goNext,
        goPrev,
        goToFormStart,
        isQuestionVisible,
        resetDynamicForm,
        setAnswer,
        currentSectionName,
        currentStepInProgressBar,
        totalProgressBarSteps,
        validateCurrentSection,
    };
};
