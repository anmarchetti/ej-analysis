import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { FeedbackFormInfoFields } from 'models/data/FeedbackFormInfo';
import { FileType } from 'models/enum/FileType';
import FeedbackFullForm, {
    IFeedbackFullFormProps,
} from 'frontend/components/renderings/TradePortalFeedback/components/FeedbackFullForm';

jest.mock('frontend/utils/ui.utils');
jest.mock('models/data/FeedbackFormInfo');
jest.mock('frontend/services/validation.service');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => ({ label, onChange, id }) => (
    <label data-tid='validatable-field'>
        {label} <input data-tid={id} onChange={e => onChange(e.target.value)} type='text' />
    </label>
));

const mockFileUpload = jest.fn();
jest.mock('frontend/components/common/ValidatableFileUploadField', () => props => {
    mockFileUpload(props);

    return (
        <label data-tid='validatable-file-upload-field'>
            <input {...props} type='text' onChange={e => props.onChange(e.target.value)} />
        </label>
    );
});

jest.mock('frontend/components/common/ValidatableTextarea/ValidatableTextarea', () => ({ label, onChange, id }) => (
    <label data-tid='validatable-textarea'>
        {label} <input data-tid={id} onChange={e => onChange(e.target.value)} type='text' />
    </label>
));

jest.mock('frontend/components/common/Checkbox', () => ({
    __esModule: true,
    default: () => <input data-tid='checkbox' />,
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick }) => <button data-tid='button' onClick={onClick} />,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ className }) => <div data-tid='richtext-with-links' className={className} />,
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isTradePortal: true,
        getSetting: jest.fn(s => s),
        getSettingAsNumber: jest.fn().mockReturnValue(1),
    },
    routerStore: {
        redirectToHomePage: jest.fn(),
    },
});

const createProps = (): IFeedbackFullFormProps => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Subtitle: mockSitecoreField('Subtitle'),
        AgentDetailsTitle: mockSitecoreField('AgentDetailsTitle'),
        AgentDetailsNameLabel: mockSitecoreField('AgentDetailsNameLabel'),
        AgentDetailsBusinessNameLabel: mockSitecoreField('AgentDetailsBusinessNameLabel'),
        AgentDetailsABTANumberLabel: mockSitecoreField('AgentDetailsABTANumberLabel'),
        AgentDetailsEmailLabel: mockSitecoreField('AgentDetailsEmailLabel'),
        CheckboxesTitle: mockSitecoreField('CheckboxesTitle'),
        CheckboxesSubtitle: mockSitecoreField('CheckboxesSubtitle'),
        FirstCheckbox: mockSitecoreField('FirstCheckbox'),
        SecondCheckbox: mockSitecoreField('SecondCheckbox'),
        ThirdCheckbox: mockSitecoreField('ThirdCheckbox'),
        FeedbackTitle: mockSitecoreField('FeedbackTitle'),
        FeedbackLabel: mockSitecoreField('FeedbackLabel'),
        SupportingTitle: mockSitecoreField('SupportingTitle'),
        SupportingSubtitle: mockSitecoreField('SupportingSubtitle'),
        SupportingButton: mockSitecoreField('SupportingButton'),
        SubmitButton: mockSitecoreField('SubmitButton'),
        ConfirmationButton: mockSitecoreField('ConfirmationButton'),
        ConfirmationSubtitle: mockSitecoreField('ConfirmationSubtitle'),
        ConfirmationTitle: mockSitecoreField('ConfirmationTitle'),
    },
    feedbackFormInfo: {
        onChangeField: jest.fn(),
        validateField: jest.fn(),
    } as any,
    forceErrors: false,
    isFeedbackFormSending: false,
    onSubmitForm: jest.fn(),
    fileTypes: [FileType.Pdf, FileType.Png],
    fileErrorLabel: 'File error',
});

let mockStores;
let props: IFeedbackFullFormProps;

describe('<FeedbackFullForm />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('Should render FeedbackFullForm', () => {
        const { container } = render(<FeedbackFullForm {...props} />);

        expect(container.querySelector('.feedback-form__title')).toBeInTheDocument();
        expect(container.querySelector('.feedback-form__subtitle')).toBeInTheDocument();
        expect(screen.getAllByTestId('validatable-field').length).toBe(4);
        expect(screen.getAllByTestId('checkbox').length).toBe(3);
        expect(screen.getAllByTestId('validatable-file-upload-field').length).toBe(1);
        expect(mockFileUpload).toHaveBeenCalledWith({
            label: props.fields.SupportingButton.value,
            acceptFileTypes: props.fileTypes,
            allowedUploadedFileNumb: 1,
            errorLabel: props.fileErrorLabel,
            errors: undefined,
            files: undefined,
            forceError: props.forceErrors,
            id: 'Documents',
            isTradePortal: true,
            multiple: true,
            onChange: expect.any(Function),
            required: undefined,
        });
        expect(screen.getAllByTestId('validatable-textarea').length).toBe(1);
    });

    describe('Form fields', () => {
        it('Should call onChangeField() on ValidatableFields change', () => {
            render(<FeedbackFullForm {...props} />);
            const mocksOnChangeField = props.feedbackFormInfo.onChangeField;

            const fields = screen.getAllByTestId('validatable-field');
            fields.forEach(field => {
                fireEvent.change(field.querySelector('input')!, { target: { value: 'Test' } });
            });

            expect(mocksOnChangeField).toHaveBeenNthCalledWith(1, FeedbackFormInfoFields.Name, 'Test');
            expect(mocksOnChangeField).toHaveBeenNthCalledWith(2, FeedbackFormInfoFields.TradeAgentName, 'Test');
        });

        it('Should call onChangeField() on ValidatableFields change email', () => {
            render(<FeedbackFullForm {...props} />);
            const mocksOnChangeField = props.feedbackFormInfo.onChangeField;

            const fields = screen.getAllByTestId('validatable-field');
            fields.forEach(field => {
                fireEvent.change(field.querySelector('input')!, { target: { value: 'test@email.com' } });
            });

            expect(mocksOnChangeField).toHaveBeenNthCalledWith(4, FeedbackFormInfoFields.Email, 'test@email.com');
        });

        it('Should call onChangeField() on ValidatableFields change numbers', () => {
            render(<FeedbackFullForm {...props} />);
            const mocksOnChangeField = props.feedbackFormInfo.onChangeField;

            const fields = screen.getAllByTestId('validatable-field');
            fields.forEach(field => {
                fireEvent.change(field.querySelector('input')!, { target: { value: '1234' } });
            });

            expect(mocksOnChangeField).toHaveBeenNthCalledWith(3, FeedbackFormInfoFields.ABTANumber, '1234');
        });

        it('Should call onChangeField() on file upload change', () => {
            render(<FeedbackFullForm {...props} />);

            const input = screen.getByTestId('validatable-file-upload-field').querySelector('input');
            expect(input).toBeInTheDocument();

            const mockedFile = new File([''], 'mockFileName.txt', { type: 'text/plain' });

            fireEvent.change(screen.getByTestId('validatable-file-upload-field').querySelector('input')!, {
                target: { value: [mockedFile] },
            });

            expect(props.feedbackFormInfo.onChangeField).toHaveBeenCalledWith(
                FeedbackFormInfoFields.Documents,
                mockedFile.toString(),
            );
        });

        it('Should call onChangeField() on ValidatableTextarea change', () => {
            render(<FeedbackFullForm {...props} />);
            const mocksOnChangeField = props.feedbackFormInfo.onChangeField;

            const fields = screen.getAllByTestId('validatable-textarea');
            fields.forEach(field => {
                fireEvent.change(field.querySelector('input')!, { target: { value: 'some long text' } });
            });

            expect(mocksOnChangeField).toHaveBeenNthCalledWith(
                1,
                FeedbackFormInfoFields.FeedbackText,
                'some long text',
            );
        });
    });

    describe('Submit form', () => {
        it('Should submit data if form is valid', () => {
            render(<FeedbackFullForm {...props} />);

            fireEvent.click(screen.getByRole('button'));

            expect(props.onSubmitForm).toHaveBeenCalled();
        });
    });
});
