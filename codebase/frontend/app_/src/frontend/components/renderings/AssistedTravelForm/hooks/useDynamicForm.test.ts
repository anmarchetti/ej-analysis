import { act, renderHook, waitFor } from '@testing-library/react';

import { formDefinitionTransformedMock } from 'frontend/components/renderings/AssistedTravelForm/mocks/formDefinition.mocks';
import {
    AnswerActionConditionType,
    AnswerActionType,
    PopupType,
    Screen,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';
import * as utils from 'frontend/components/renderings/AssistedTravelForm/utils/DynamicForm.utils';

import { useDynamicForm } from './useDynamicForm';

describe('useDynamicForm', () => {
    const goToScreen = jest.fn();
    const setVisiblePopup = jest.fn();

    it('should initialize with first section', () => {
        const { result } = renderHook(() => useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup));
        expect(result.current.currentSection?.id).toBe('assistance-type-section');
        expect(result.current.currentStepInProgressBar).toBe(0);
        //hotel-section (transfer-section is hidden based on mock data)
        expect(result.current.totalProgressBarSteps).toBe(1);
    });

    it('should validate required question', () => {
        const { result } = renderHook(() => useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup));
        let valid: boolean | undefined = undefined;
        act(() => {
            valid = result.current.validateCurrentSection();
        });

        expect(valid).toBe(false);
        expect(result.current.errors).toEqual(new Map([['AT-002', 'MultiSelectValueRequired']]));

        act(() => {
            result.current.setAnswer('AT-002', [{ answerId: 'AT-002-01', value: 'Option 1' }]);
        });

        //hotel-section + mobility-section triggered by question
        expect(result.current.totalProgressBarSteps).toBe(2);

        act(() => {
            result.current.goNext();
        });

        act(() => {
            valid = result.current.validateCurrentSection();
        });

        expect(valid).toBe(false);
        expect(result.current.errors).toEqual(new Map([['AT-037', 'RadioButtonValueRequired']]));
    });

    it('should set answer and clear error', () => {
        const { result } = renderHook(() => useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup));

        act(() => {
            result.current.validateCurrentSection();
        });

        expect(result.current.errors.has('AT-002')).toBe(true);

        act(() => {
            result.current.validateCurrentSection();
            result.current.setAnswer('AT-002', [{ answerId: 'AT-002-01', value: 'Option 1' }]);
        });

        expect(result.current.answers.get('AT-002')).toEqual({
            questionText: 'Question AT-002 Label',
            questionTextForSubmission: 'Question AT-002 Text For Submission',
            sectionGroup: 'Support Needs Title',
            answers: [
                {
                    answerId: 'AT-002-01',
                    value: 'Option 1',
                },
            ],
        });
        expect(result.current.errors.has('AT-002')).toBe(false);
    });

    it('should navigate to next and previous section', () => {
        const { result } = renderHook(() => useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup));
        act(() => {
            result.current.setAnswer('AT-002', [{ answerId: 'AT-002-01', value: 'Option 1' }]);
        });
        act(() => {
            result.current.goNext();
        });

        expect(result.current.currentSection?.id).toBe('mobility-section');

        act(() => {
            result.current.goPrev();
        });

        expect(result.current.currentSection?.id).toBe('assistance-type-section');
    });

    it('should reset answers and errors', () => {
        const { result } = renderHook(() => useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup));
        act(() => {
            result.current.setAnswer('q1', [{ answerId: 'q1-01', value: 'John' }]);
            result.current.validateCurrentSection();
            result.current.resetDynamicForm();
        });
        expect(result.current.answers.size).toBe(0);
        expect(result.current.errors.size).toBe(0);
    });

    it('should clear all dependent answers when a parent question answer changes', () => {
        const { result } = renderHook(() => useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup));
        act(() => {
            result.current.setAnswer('AT-002', [{ answerId: 'AT-002-01', value: 'Option 1' }]);
        });

        act(() => {
            result.current.goNext();
        });

        act(() => {
            result.current.setAnswer('AT-037', [{ answerId: 'AT-037-01', value: 'Option 1' }]);

            result.current.setAnswer('AT-008', [{ answerId: 'AT-008-01', value: 'Option 1' }]);
            result.current.setAnswer('AT-009', [{ answerId: 'AT-009-01', value: 1111 }]);
            result.current.setAnswer('AT-011', [{ answerId: 'AT-011-01', value: 1111 }]);
        });

        act(() => {
            result.current.goPrev();
        });

        act(() => {
            result.current.setAnswer('AT-002', [{ answerId: 'AT-002-02', value: '' }]);
        });

        expect(result.current.answers.get('AT-002')).toEqual({
            questionText: 'Question AT-002 Label',
            questionTextForSubmission: 'Question AT-002 Text For Submission',
            sectionGroup: 'Support Needs Title',
            answers: [
                {
                    answerId: 'AT-002-02',
                    value: '',
                },
            ],
        });
        expect(result.current.answers.has('AT-037')).toBe(false);
        expect(result.current.answers.has('AT-008')).toBe(false);
        expect(result.current.answers.has('AT-009')).toBe(false);
        expect(result.current.answers.has('AT-011')).toBe(false);
    });

    it('should call goToScreen when current section is first', () => {
        const { result } = renderHook(() => useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup));
        act(() => {
            result.current.goPrev();
        });
        expect(goToScreen).toHaveBeenCalled();
    });

    it('should return true for isQuestionVisible if question meets visibility conditions', () => {
        const { result } = renderHook(() => useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup));

        let visible = false;
        act(() => {
            visible = result.current.isQuestionVisible('AT-002');
        });
        expect(visible).toBe(true);
    });

    it('should return false for isQuestionVisible if question does not meet visibility conditions', () => {
        const { result } = renderHook(() => useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup));

        let visible = true;
        act(() => {
            visible = result.current.isQuestionVisible('AT-037');
        });

        expect(visible).toBe(false);
    });

    describe('useEffect - pendingAction', () => {
        it('should call setVisiblePopup and clear the triggering answer when ShowPopup action fires', () => {
            const { result } = renderHook(() =>
                useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup),
            );

            act(() => {
                result.current.setAnswer('AT-002', [{ answerId: 'AT-002-02', value: 'yes' }], {
                    type: AnswerActionType.ShowPopup,
                    popupType: PopupType.NoTravelCompanion,
                    condition: { type: AnswerActionConditionType.NoOptionsAvailable, questionId: 'Q2' },
                });
            });

            expect(setVisiblePopup).toHaveBeenCalledWith(PopupType.NoTravelCompanion);
            expect(result.current.answers.has('question-depended-AT-002-02')).toBe(false);
        });

        it('should navigate to next section when GoToNextSection action fires', () => {
            const { result } = renderHook(() =>
                useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup),
            );

            expect(result.current.currentSection?.id).toBe('assistance-type-section');

            act(() => {
                result.current.setAnswer('AT-002', [{ answerId: 'AT-002-02', value: 'visual-impairment' }], {
                    type: AnswerActionType.GoToNextSection,
                    condition: { type: AnswerActionConditionType.NoOptionsAvailable, questionId: 'Q2' },
                });
            });

            expect(result.current.currentSection?.id).toBe('hotel-section');
        });

        it('should fire action when no condition is provided (defaults to true)', () => {
            const { result } = renderHook(() =>
                useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup),
            );

            act(() => {
                result.current.setAnswer('AT-002', [{ answerId: 'AT-002-02', value: 'visual-impairment' }], {
                    type: AnswerActionType.GoToNextSection,
                });
            });

            expect(result.current.currentSection?.id).toBe('hotel-section');
        });

        it('should call goToScreen with Summary when GoToNextSection action fires on the last visible section', () => {
            const { result } = renderHook(() =>
                useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup),
            );

            // Move to hotel-section (last visible section) via a GoToNextSection action from assistance-type-section
            act(() => {
                result.current.setAnswer('AT-002', [{ answerId: 'AT-002-02', value: 'visual-impairment' }], {
                    type: AnswerActionType.GoToNextSection,
                });
            });

            expect(result.current.currentSection?.id).toBe('hotel-section');

            act(() => {
                result.current.setAnswer('AT-002', [{ answerId: 'AT-002-02', value: 'visual-impairment' }], {
                    type: AnswerActionType.GoToNextSection,
                });
            });

            expect(goToScreen).toHaveBeenCalledWith(Screen.Summary);
        });

        it('should NOT fire action when condition is not met', () => {
            jest.spyOn(utils, 'evaluateActionCondition').mockReturnValue(false);

            const { result } = renderHook(() =>
                useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup),
            );

            act(() => {
                result.current.setAnswer('AT-002', [{ answerId: 'AT-002-02', value: 'visual-impairment' }], {
                    type: AnswerActionType.ShowPopup,
                    popupType: PopupType.ContactUs,
                    condition: { type: AnswerActionConditionType.NoOptionsAvailable, questionId: 'Q2' },
                });
            });

            expect(setVisiblePopup).not.toHaveBeenCalled();
            expect(result.current.answers.has('AT-002')).toBe(true);

            waitFor(() => {
                expect(result.current.answers.has('question-depended-AT-002-02')).toBe(true);
            });
        });
    });

    it('should navigate back to the first section when goToFormStart is called', () => {
        const { result } = renderHook(() => useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup));

        act(() => {
            result.current.setAnswer('AT-002', [{ answerId: 'AT-002-01', value: 'Option 1' }]);
        });
        act(() => {
            result.current.goNext();
        });

        expect(result.current.currentSection?.id).toBe('mobility-section');

        act(() => {
            result.current.goToFormStart();
        });

        expect(result.current.currentSection?.id).toBe('assistance-type-section');
    });

    describe('validateCurrentSection - focus behaviour', () => {
        let rafSpy: jest.SpyInstance;
        let getElementByIdSpy: jest.SpyInstance;
        let mockFocus: jest.Mock;
        let mockScrollIntoView: jest.Mock;

        beforeEach(() => {
            rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
                cb(0);

                return 0;
            });

            mockFocus = jest.fn();
            mockScrollIntoView = jest.fn();

            const mockInput = { focus: mockFocus, scrollIntoView: mockScrollIntoView } as unknown as HTMLElement;
            const mockElement = { querySelector: jest.fn().mockReturnValue(mockInput) } as unknown as HTMLElement;

            getElementByIdSpy = jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);
        });

        afterEach(() => {
            rafSpy.mockRestore();
            getElementByIdSpy.mockRestore();
        });

        it('should focus and scroll to the first invalid input when validation fails', () => {
            const { result } = renderHook(() =>
                useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup),
            );

            act(() => {
                result.current.validateCurrentSection();
            });

            expect(getElementByIdSpy).toHaveBeenCalledWith('question-AT-002');
            expect(mockFocus).toHaveBeenCalled();
            expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
        });

        it('should NOT focus or scroll when validation passes', () => {
            const { result } = renderHook(() =>
                useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup),
            );

            act(() => {
                result.current.setAnswer('AT-002', [{ answerId: 'AT-002-01', value: 'Option 1' }]);
            });

            act(() => {
                result.current.validateCurrentSection();
            });

            expect(mockFocus).not.toHaveBeenCalled();
            expect(mockScrollIntoView).not.toHaveBeenCalled();
        });

        it('should NOT focus when no input element is found inside the question element', () => {
            const mockElement = { querySelector: jest.fn().mockReturnValue(null) } as unknown as HTMLElement;
            getElementByIdSpy.mockReturnValue(mockElement);

            const { result } = renderHook(() =>
                useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup),
            );

            act(() => {
                result.current.validateCurrentSection();
            });

            expect(mockFocus).not.toHaveBeenCalled();
        });

        it('should NOT focus when the question DOM element is not found', () => {
            getElementByIdSpy.mockReturnValue(null);

            const { result } = renderHook(() =>
                useDynamicForm(formDefinitionTransformedMock, goToScreen, setVisiblePopup),
            );

            act(() => {
                result.current.validateCurrentSection();
            });

            expect(mockFocus).not.toHaveBeenCalled();
        });
    });
});
