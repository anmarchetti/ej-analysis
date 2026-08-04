import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockGuests } from 'frontend/__mocks__';
import bookingService from 'frontend/services/booking.service';
import { summarySectionFieldsMock } from 'frontend/components/renderings/AssistedTravelForm/mocks/fields.mocks';
import { PopupType, TFormAnswers } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import SummarySection, { ISummarySectionProps } from './SummarySection';

const mockQuestionHeader = jest.fn();
jest.mock('frontend/components/renderings/AssistedTravelForm/components/QuestionHeader/QuestionHeader', () => ({
    __esModule: true,
    default: props => {
        mockQuestionHeader(props);

        return <div data-tid='question-header' />;
    },
}));

const mockConfirmationCheckbox = jest.fn();
jest.mock(
    'frontend/components/renderings/AssistedTravelForm/components/ConfirmationCheckbox/ConfirmationCheckbox',
    () => ({
        __esModule: true,
        default: props => {
            mockConfirmationCheckbox(props);

            return (
                <input
                    type='checkbox'
                    data-tid={props.id}
                    checked={props.checked}
                    onChange={props.onChange}
                    aria-label={props.id}
                />
            );
        },
    }),
);

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button data-tid={props['data-tid']} onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='jss-text' />;
    },
}));

jest.mock('frontend/services/booking.service', () => ({
    __esModule: true,
    default: {
        requestAssistedTravel: jest.fn(),
    },
}));

jest.mock('frontend/utils/passenger.utils', () => ({
    ...jest.requireActual('frontend/utils/passenger.utils'),
    getFullPassengerName: jest.fn(() => 'Ann Brown'),
}));

const createAnswers = (): TFormAnswers => {
    const answers: TFormAnswers = new Map();

    answers.set('AT-001', {
        questionText: 'Question One',
        questionTextForSubmission: 'Question One Submission',
        sectionGroup: 'Section A',
        answers: [{ answerId: 'AT-001-01', value: 'AT-001-01 Yes', valueForSubmission: 'AT-001-01 Yes' }],
    });

    answers.set('AT-003', {
        questionText: 'Question Three',
        questionTextForSubmission: 'Question Three Submission',
        sectionGroup: 'Section A',
        answers: [{ answerId: 'AT-003-01', value: 'AT-003-01 Yes', valueForSubmission: 'AT-003-01 Yes' }],
    });

    answers.set('AT-002', {
        questionText: 'Question Two',
        questionTextForSubmission: 'Question Two Submission',
        sectionGroup: 'Section B',
        answers: [{ answerId: 'AT-002-01', value: 'AT-002-01 Option 1', valueForSubmission: 'AT-002-01 Option 1' }],
    });

    return answers;
};

const createProps = (): ISummarySectionProps => ({
    answers: createAnswers(),
    bookingReference: 'TEST-REF-001',
    fields: summarySectionFieldsMock,
    togglePopup: jest.fn(),
    selectedCustomer: mockGuests[0],
});

let mockProps = createProps();
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SummarySection />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            viewBookingStore: {
                markGuestAsRequested: jest.fn(),
            },
        });
        mockProps = createProps();
        (bookingService.requestAssistedTravel as jest.Mock).mockResolvedValue(undefined);
    });

    it('should render QuestionHeader with title and description', () => {
        render(<SummarySection {...mockProps} />);

        expect(screen.getByTestId('question-header')).toBeInTheDocument();
        expect(mockQuestionHeader).toHaveBeenCalledWith({
            title: summarySectionFieldsMock.Title.value,
            description: summarySectionFieldsMock.Description.value,
        });
    });

    it('should render two ConfirmationCheckboxes', () => {
        render(<SummarySection {...mockProps} />);

        expect(screen.getByTestId('information-accurate-checkbox')).toBeInTheDocument();
        expect(mockConfirmationCheckbox).toHaveBeenCalledWith({
            checked: false,
            Title: mockProps.fields.InformationAccurateTitle,
            Description: mockProps.fields.InformationAccurateDescription,
            ErrorContent: mockProps.fields.InformationAccurateRequiredErrorMessage,
            onChange: expect.any(Function),
            hasError: false,
            id: 'information-accurate-checkbox',
        });
    });

    it('should render summary sections from answers', () => {
        render(<SummarySection {...mockProps} />);

        const sectionA = screen.getByTestId('section-0');
        expect(sectionA).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: { value: 'Section A' },
            tag: 'h3',
            className: 'sectionTitle',
        });
        expect(within(sectionA).getByText('Question One')).toBeInTheDocument();
        expect(within(sectionA).getByText('AT-001-01 Yes')).toBeInTheDocument();
        expect(within(sectionA).getByText('Question Three')).toBeInTheDocument();
        expect(within(sectionA).getByText('AT-003-01 Yes')).toBeInTheDocument();

        const sectionB = screen.getByTestId('section-1');
        expect(sectionB).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: { value: 'Section B' },
            tag: 'h3',
            className: 'sectionTitle',
        });
        expect(within(sectionB).getByText('Question Two')).toBeInTheDocument();
        expect(within(sectionB).getByText('AT-002-01 Option 1')).toBeInTheDocument();
    });

    it('should render secondary and primary buttons', () => {
        render(<SummarySection {...mockProps} />);

        expect(screen.getByTestId('back-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            children: summarySectionFieldsMock.SecondaryButtonLabel.value,
            'data-tid': 'back-button',
            isText: true,
            onClick: expect.any(Function),
            className: 'btn',
            'aria-label': mockProps.fields.SecondaryButtonScreenReaderText?.value,
        });

        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            children: summarySectionFieldsMock.PrimaryButtonLabel.value,
            'data-tid': 'submit-button',
            isMedium: true,
            onClick: expect.any(Function),
            className: 'btn',
            'aria-label': mockProps.fields.PrimaryButtonScreenReaderText?.value,
            isLoading: false,
            disabled: false,
        });
    });

    describe('secondary button (back)', () => {
        it('should open GoBackToStartWarning popup when secondary button is clicked', async () => {
            const togglePopup = jest.fn();
            render(<SummarySection {...mockProps} togglePopup={togglePopup} />);

            const backButton = screen.getByText(summarySectionFieldsMock.SecondaryButtonLabel.value);
            await userEvent.click(backButton);

            expect(togglePopup).toHaveBeenCalledWith(PopupType.GoBackToStartWarning);
        });
    });

    describe('submit – validation', () => {
        it('should NOT submit and should show errors when neither checkbox is checked', async () => {
            const togglePopup = jest.fn();
            render(<SummarySection {...mockProps} togglePopup={togglePopup} />);

            const submitButton = screen.getByText(summarySectionFieldsMock.PrimaryButtonLabel.value);
            await userEvent.click(submitButton);

            expect(bookingService.requestAssistedTravel).not.toHaveBeenCalled();
            expect(togglePopup).not.toHaveBeenCalled();

            // Both checkboxes should now have hasError=true
            const hasErrorCalls = mockConfirmationCheckbox.mock.calls.filter(([props]) => props.hasError === true);
            expect(hasErrorCalls.length).toBe(1);
        });
    });

    it('should call requestAssistedTravel with correct payload when checkbox is checked and toggle popup after successful submission', async () => {
        render(<SummarySection {...mockProps} />);

        await userEvent.click(screen.getByLabelText('information-accurate-checkbox'));
        await userEvent.click(screen.getByText(summarySectionFieldsMock.PrimaryButtonLabel.value));

        await waitFor(() => {
            expect(bookingService.requestAssistedTravel).toHaveBeenCalledWith(
                'TEST-REF-001',
                `${mockProps.selectedCustomer!.firstName} ${mockProps.selectedCustomer!.lastName}`,
                [
                    { answer: 'AT-001-01 Yes', question: 'Question One Submission', questionCode: 'AT-001' },
                    { answer: 'AT-003-01 Yes', question: 'Question Three Submission', questionCode: 'AT-003' },
                    { answer: 'AT-002-01 Option 1', question: 'Question Two Submission', questionCode: 'AT-002' },
                ],
            );
            expect(mockProps.togglePopup).toHaveBeenCalledWith(PopupType.SubmissionSuccess);
            expect(mockStores.viewBookingStore.markGuestAsRequested).toHaveBeenCalledWith('Ann Brown');
            expect(mockButtonProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    children: summarySectionFieldsMock.PrimaryButtonLabel.value,
                    'data-tid': 'submit-button',
                    disabled: true,
                }),
            );
        });
    });

    it('should open SubmissionFailed popup when requestAssistedTravel throws', async () => {
        (bookingService.requestAssistedTravel as jest.Mock).mockRejectedValueOnce(new Error('network error'));
        render(<SummarySection {...mockProps} />);

        await userEvent.click(screen.getByLabelText('information-accurate-checkbox'));
        await userEvent.click(screen.getByText(summarySectionFieldsMock.PrimaryButtonLabel.value));

        await waitFor(() => {
            expect(mockProps.togglePopup).toHaveBeenCalledWith(PopupType.SubmissionFailed);
        });
    });

    it('should NOT call requestAssistedTravel when selectedCustomer is undefined', async () => {
        render(<SummarySection {...mockProps} selectedCustomer={undefined} />);

        await userEvent.click(screen.getByLabelText('information-accurate-checkbox'));
        await userEvent.click(screen.getByText(summarySectionFieldsMock.PrimaryButtonLabel.value));

        await waitFor(() => {
            expect(bookingService.requestAssistedTravel).not.toHaveBeenCalled();
        });
    });

    it('should NOT call requestAssistedTravel when bookingReference is undefined', async () => {
        render(<SummarySection {...mockProps} bookingReference={undefined} />);

        await userEvent.click(screen.getByLabelText('information-accurate-checkbox'));
        await userEvent.click(screen.getByText(summarySectionFieldsMock.PrimaryButtonLabel.value));

        await waitFor(() => {
            expect(bookingService.requestAssistedTravel).not.toHaveBeenCalled();
        });
    });
});
