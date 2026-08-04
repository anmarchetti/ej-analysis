import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import offersService from 'frontend/services/offers.service';
import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import { FileType } from 'models/enum/FileType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import TradePortalFeedback, {
    TTradePortalFeedbackProps,
} from 'frontend/components/renderings/TradePortalFeedback/TradePortalFeedback';

jest.mock('frontend/services/offers.service');
jest.mock('frontend/utils/ui.utils');

let mockIsValidState = true;
const mockFeedbackFormInfo = {
    get isValid() {
        return mockIsValidState;
    },
};

const mockFeedbackFormInfoProps = jest.fn();
jest.mock('models/data/FeedbackFormInfo', () => {
    const actualModule = jest.requireActual('models/data/FeedbackFormInfo');

    return {
        ...actualModule,
        FeedbackFormInfo: jest.fn().mockImplementation(props => {
            mockFeedbackFormInfoProps(props);

            return mockFeedbackFormInfo;
        }),
    };
});

const mockFeedbackFullFormProps = jest.fn();
jest.mock('frontend/components/renderings/TradePortalFeedback/components/FeedbackFullForm', () => ({
    __esModule: true,
    default: props => {
        mockFeedbackFullFormProps(props);

        return (
            <div data-tid='feedback-full-form'>
                <button data-tid='submit-btn' onClick={props.onSubmitForm} />
            </div>
        );
    },
}));

const mockSubmittedFeedbackFormProps = jest.fn();
jest.mock('frontend/components/renderings/TradePortalFeedback/components/SubmittedFeedbackForm', () => ({
    __esModule: true,
    default: props => {
        mockSubmittedFeedbackFormProps(props);

        return <div data-tid='submitted-feedback-form' />;
    },
}));

const FormDataMock = {
    append: jest.fn(),
    entries: jest.fn(),
};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isTradePortal: true,
        getSetting: jest.fn(() => 'application/pdf,image/jpeg'),
        getSettingAsNumber: jest.fn().mockReturnValue(1),
    },
    routerStore: {
        redirectToHomePage: jest.fn(),
    },
});

const createProps = (): TTradePortalFeedbackProps => ({
    fields: {
        Title: { value: 'Title' },
        Subtitle: { value: 'Subtitle' },
        AgentDetailsTitle: { value: 'AgentDetailsTitle' },
        AgentDetailsNameLabel: { value: 'AgentDetailsNameLabel' },
        AgentDetailsBusinessNameLabel: { value: 'AgentDetailsBusinessNameLabel' },
        AgentDetailsABTANumberLabel: { value: 'AgentDetailsABTANumberLabel' },
        AgentDetailsEmailLabel: { value: 'AgentDetailsEmailLabel' },
        CheckboxesTitle: { value: 'CheckboxesTitle' },
        CheckboxesSubtitle: { value: 'CheckboxesSubtitle' },
        FirstCheckbox: { value: 'FirstCheckbox' },
        SecondCheckbox: { value: 'SecondCheckbox' },
        ThirdCheckbox: { value: 'ThirdCheckbox' },
        FeedbackTitle: { value: 'FeedbackTitle' },
        FeedbackLabel: { value: 'FeedbackLabel' },
        SupportingTitle: { value: 'SupportingTitle' },
        SupportingSubtitle: { value: 'SupportingSubtitle' },
        SupportingButton: { value: 'SupportingButton' },
        SubmitButton: { value: 'SubmitButton' },
        ConfirmationTitle: { value: 'ConfirmationTitle' },
        ConfirmationSubtitle: { value: 'ConfirmationSubtitle' },
        ConfirmationButton: { value: 'ConfirmationButton' },
    },
    params: {},
    rendering: undefined,
});

let mockStores;
let mockProps = createProps();

describe('<TradePortalFeedback />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
        (global as any).FormData = jest.fn(() => FormDataMock);
    });

    it('Should render TradePortalFeedback', () => {
        render(<TradePortalFeedback {...mockProps} />);

        expect(mockFeedbackFormInfoProps).toHaveBeenCalledWith({
            fileErrorLabel: SitecoreDictionary.GlobalsErrorMessagesLoadFilesFieldRequiredWithTokens,
            fileTypes: [FileType.Pdf, FileType.Jpeg],
            maxFileCount: 1,
            maxFileSize: 1,
        });

        expect(screen.getByTestId('feedback-full-form')).toBeInTheDocument();
        expect(mockFeedbackFullFormProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            fileErrorLabel: SitecoreDictionary.GlobalsErrorMessagesLoadFilesFieldRequiredWithTokens,
            fileTypes: [FileType.Pdf, FileType.Jpeg],
            feedbackFormInfo: mockFeedbackFormInfo,
            forceErrors: false,
            onSubmitForm: expect.any(Function),
            isFeedbackFormSending: false,
        });
    });

    it('should render TradePortalFeedback with singular fileErrorLabel', () => {
        mockStores.layoutStore.getSetting = jest.fn(() => 'application/pdf');
        render(<TradePortalFeedback {...mockProps} />);

        expect(mockFeedbackFormInfoProps).toHaveBeenCalledWith({
            fileErrorLabel: SitecoreDictionary.GlobalsErrorMessagesLoadFilesFieldRequiredSingularWithTokens,
            fileTypes: [FileType.Pdf],
            maxFileCount: 1,
            maxFileSize: 1,
        });

        expect(screen.getByTestId('feedback-full-form')).toBeInTheDocument();
        expect(mockFeedbackFullFormProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            fileErrorLabel: SitecoreDictionary.GlobalsErrorMessagesLoadFilesFieldRequiredSingularWithTokens,
            fileTypes: [FileType.Pdf],
            feedbackFormInfo: mockFeedbackFormInfo,
            forceErrors: false,
            onSubmitForm: expect.any(Function),
            isFeedbackFormSending: false,
        });
    });

    it('should render TradePortalFeedback with singular fileErrorLabel', () => {
        mockStores.layoutStore.getSetting = jest.fn(() => null);
        render(<TradePortalFeedback {...mockProps} />);

        expect(mockFeedbackFormInfoProps).toHaveBeenCalledWith({
            fileErrorLabel: SitecoreDictionary.GlobalsErrorMessagesLoadFilesFieldRequiredSingularWithTokens,
            fileTypes: [],
            maxFileCount: 1,
            maxFileSize: 1,
        });
    });

    it('Should NOT render TradePortalFeedback when fields are NOT provided', () => {
        mockProps.fields = undefined;
        const { container } = render(<TradePortalFeedback {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render message after form submission', async () => {
        (offersService.sendFeedbackForm as jest.Mock).mockImplementation(jest.fn());
        render(<TradePortalFeedback {...mockProps} />);

        await userEvent.click(screen.getByTestId('submit-btn'));

        expect(screen.getByTestId('submitted-feedback-form')).toBeInTheDocument();
        expect(mockSubmittedFeedbackFormProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });
    });

    it('Should scroll error into view message when submit btn is clicked', async () => {
        mockIsValidState = false;
        render(<TradePortalFeedback {...mockProps} />);

        await userEvent.click(screen.getByTestId('submit-btn'));

        expect(scrollToErrorBlock).toHaveBeenCalledWith();
    });
});
