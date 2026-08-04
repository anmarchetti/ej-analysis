import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IFormSection, QuestionType } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import DynamicFormSection, { IDynamicFormSectionProps } from './DynamicFormSection';

const mockDynamicFormQuestionProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/components/DynamicFormQuestion/DynamicFormQuestion',
    () => ({
        __esModule: true,
        default: props => {
            mockDynamicFormQuestionProps(props);

            return <div data-tid={`mock-question-${props.question.id}`}>{props.question.id}</div>;
        },
    }),
);

const mockSectionWrapperProps = jest.fn();
jest.mock('frontend/components/renderings/AssistedTravelForm/components/SectionWrapper/SectionWrapper', () => ({
    __esModule: true,
    default: props => {
        mockSectionWrapperProps(props);

        return (
            <div data-tid='section-wrapper'>
                {props.children}
                <button onClick={props.secondaryBtnAction} data-tid='secondary-btn' />
                <button onClick={props.primaryBtnAction} data-tid='primary-btn' />
            </div>
        );
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return (
            <div data-tid='rich-text-with-links'>
                <button id='contact-us-btn' data-tid='contact-us-btn' onClick={props.onLinkClick} />
            </div>
        );
    },
}));

const mockSection: IFormSection = {
    id: 'section-1',
    sitecoreKey: 'section-1-key',
    title: 'Section 1',
    questions: [
        {
            id: 'AT-006',
            label: 'Battery capacity (Watt-hours/Wh)',
            description: 'Wattage',
            additionalInfo: 'Add Wattage in Watt/hours',
            type: QuestionType.NumberInput,
        },
        {
            id: 'AT-007',
            label: 'Test Question 2',
            type: QuestionType.NumberInput,
        },
    ],
    buttonContent: {
        primaryButtonScreenReaderText: { value: 'Next' },
        primaryButtonText: { value: 'Next' },
        secondaryButtonScreenReaderText: { value: 'Previous' },
        secondaryButtonText: { value: 'Previous' },
    },
};

const mockIsQuestionVisible = jest.fn().mockImplementation(questionId => questionId === 'AT-006');
const createProps = (): IDynamicFormSectionProps => ({
    section: mockSection,
    answers: new Map(),
    errors: new Map(),
    isQuestionVisible: mockIsQuestionVisible,
    setAnswer: jest.fn(),
    goNext: jest.fn(),
    goPrevious: jest.fn(),
    togglePopup: jest.fn(),
});

let mockProps = createProps();

describe('DynamicFormSection', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render questions that are visible', () => {
        render(<DynamicFormSection {...mockProps} />);

        expect(mockSectionWrapperProps).toHaveBeenCalledWith({
            primaryBtnText: mockProps.section.buttonContent?.primaryButtonText,
            secondaryBtnText: mockProps.section.buttonContent?.secondaryButtonText,
            primaryBtnScreenReaderText: mockProps.section.buttonContent?.primaryButtonScreenReaderText,
            secondaryBtnScreenReaderText: mockProps.section.buttonContent?.secondaryButtonScreenReaderText,
            primaryBtnAction: mockProps.goNext,
            secondaryBtnAction: mockProps.goPrevious,
            children: expect.anything(),
            focusTrigger: mockProps.section.id,
        });
        expect(screen.getByTestId('mock-question-AT-006')).toBeInTheDocument();
        expect(screen.queryByTestId('mock-question-AT-007')).not.toBeInTheDocument();

        expect(mockDynamicFormQuestionProps).toHaveBeenCalledWith({
            question: mockSection.questions[0],
            answers: mockProps.answers,
            errors: mockProps.errors,
            isQuestionVisible: mockProps.isQuestionVisible,
            setAnswer: mockProps.setAnswer,
            togglePopup: mockProps.togglePopup,
        });
    });

    it('should render all questions if all are visible', () => {
        mockIsQuestionVisible.mockImplementation(() => true);
        render(<DynamicFormSection {...mockProps} />);
        expect(screen.getByTestId('mock-question-AT-006')).toBeInTheDocument();
        expect(screen.getByTestId('mock-question-AT-007')).toBeInTheDocument();
    });

    it('should call goNext when primary button is clicked', async () => {
        render(<DynamicFormSection {...mockProps} />);

        await userEvent.click(screen.getByTestId('primary-btn'));
        expect(mockProps.goNext).toHaveBeenCalled();
    });

    it('should call goPrevious when secondary button is clicked', async () => {
        render(<DynamicFormSection {...mockProps} />);

        await userEvent.click(screen.getByTestId('secondary-btn'));
        expect(mockProps.goPrevious).toHaveBeenCalled();
    });
});
