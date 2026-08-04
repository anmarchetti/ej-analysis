import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { mockPricePromiseFields } from './__mocks__/pricePromiseFields.mock';
import { mockPricePromiseStore } from './__mocks__/pricePromiseStore.mock';
import { PricePromise, TPricePromiseProps } from './PricePromise';

const createProps = (): TPricePromiseProps => ({
    fields: mockPricePromiseFields,
    params: {},
    rendering: undefined,
});

const createMockLocalStore = () => mockPricePromiseStore;

let mockStores = createMockStores();
let mockProps = createProps();
let mockLocalStore = createMockLocalStore();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('mobx-react', () => ({
    ...jest.requireActual('mobx-react'),
    useLocalStore: jest.fn().mockImplementation(() => mockLocalStore),
}));

const mockText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => props => {
    mockButtonProps(props);

    return (
        <button data-tid='submit-btn' onClick={props.onClick}>
            {props.children}
        </button>
    );
});

const mockErrorMessageProps = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => props => {
    mockErrorMessageProps(props);

    return <div data-tid='error-message' />;
});

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => props => {
    mockRichTextWithLinksProps(props);

    return <div data-tid='rich-text-with-links' />;
});

const mockBookingDetailsSectionProps = jest.fn();
jest.mock('./components/BookingDetailsSection/BookingDetailsSection', () => props => {
    mockBookingDetailsSectionProps(props);

    return <div data-tid='booking-details-section' />;
});

const mockCheckboxesSectionProps = jest.fn();
jest.mock('./components/CheckboxesSection/CheckboxesSection', () => props => {
    mockCheckboxesSectionProps(props);

    return <div data-tid='checkboxes-section' />;
});

const mockFileUploadSectionProps = jest.fn();
jest.mock('./components/FileUploadSection/FileUploadSection', () => props => {
    mockFileUploadSectionProps(props);

    return <div data-tid='file-upload-section' />;
});

const mockLinkSectionProps = jest.fn();
jest.mock('./components/LinkSection/LinkSection', () => props => {
    mockLinkSectionProps(props);

    return <div data-tid='link-section' />;
});

const mockPricePromiseSuccessMessageProps = jest.fn();
jest.mock('./components/PricePromiseSuccessMessage/PricePromiseSuccessMessage', () => props => {
    mockPricePromiseSuccessMessageProps(props);

    return <div data-tid='success-message' />;
});

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToErrorBlock: jest.fn(),
}));

describe('<PricePromise />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
        mockLocalStore = createMockLocalStore();
    });

    describe('render form', () => {
        it('should render title and description', () => {
            render(<PricePromise {...createProps()} />);

            expect(screen.getAllByTestId('rich-text-with-links')).toHaveLength(2);
            expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
                field: mockProps.fields!.TopDescription,
                className: 'text',
            });

            expect(screen.getByTestId('sitecore-jss-text')).toBeInTheDocument();
            expect(mockText).toHaveBeenCalledWith({
                className: 'title',
                tag: 'h2',
                field: mockProps.fields!.Title,
                'data-tid': 'form-title',
            });

            expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
                field: mockProps.fields!.Description,
                className: 'text',
                dataId: 'form-description',
            });
        });

        it('should render booking details section', () => {
            render(<PricePromise {...createProps()} />);

            expect(screen.getByTestId('booking-details-section')).toBeInTheDocument();
            expect(mockBookingDetailsSectionProps).toHaveBeenCalledWith({
                fields: mockProps.fields,
                store: mockLocalStore,
            });
        });

        it('should render checkboxes section', () => {
            render(<PricePromise {...createProps()} />);

            expect(screen.getByTestId('checkboxes-section')).toBeInTheDocument();
            expect(mockCheckboxesSectionProps).toHaveBeenCalledWith({
                fields: mockProps.fields,
                store: mockLocalStore,
            });
        });

        it('should render link section', () => {
            render(<PricePromise {...createProps()} />);

            expect(screen.getByTestId('link-section')).toBeInTheDocument();
            expect(mockLinkSectionProps).toHaveBeenCalledWith({
                fields: mockProps.fields,
                store: mockLocalStore,
            });
        });

        it('should render file upload section', () => {
            render(<PricePromise {...createProps()} />);

            expect(screen.getByTestId('file-upload-section')).toBeInTheDocument();
            expect(mockFileUploadSectionProps).toHaveBeenCalledWith({
                fields: mockProps.fields,
                store: mockLocalStore,
            });
        });

        it('should render submit button', () => {
            render(<PricePromise {...createProps()} />);

            expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
            expect(mockButtonProps).toHaveBeenCalledWith({
                onClick: expect.any(Function),
                hasDisabledStyles: !mockLocalStore.isFormValid,
                isLoading: mockLocalStore.isPricePromiseSending,
                isMedium: true,
                type: 'submit',
                className: 'submit',
                children: SitecoreDictionary.GlobalsSubmitRequest,
            });
        });

        it('should render success message and NOT render error message', () => {
            render(<PricePromise {...createProps()} />);

            expect(screen.getByTestId('success-message')).toBeInTheDocument();
            expect(mockPricePromiseSuccessMessageProps).toHaveBeenCalledWith({
                isSuccessMessageShown: mockLocalStore.isSuccessMessageShown,
                toggleSuccessMessage: mockLocalStore.toggleSuccessMessage,
                SuccessMessagesRequestTitle: mockProps.fields?.RequestTitle,
                SuccessMessagesRequestText: mockProps.fields?.RequestText,
            });

            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        });
    });

    it('should submit form if form is valid when submit button is clicked', async () => {
        render(<PricePromise {...mockProps} />);

        await userEvent.click(screen.getByTestId('submit-btn'));

        expect(mockLocalStore.submitPricePromise).toHaveBeenCalled();
    });

    it('should NOT submit form if form is NOT valid when submit button is clicked', async () => {
        Object.defineProperty(mockLocalStore, 'isFormValid', {
            get: jest.fn().mockReturnValue(false),
        });

        render(<PricePromise {...mockProps} />);

        await userEvent.click(screen.getByTestId('submit-btn'));

        expect(mockLocalStore.submitPricePromise).not.toHaveBeenCalled();
        expect(mockLocalStore.toggleForceErrors).toHaveBeenCalledWith(true);
        expect(scrollToErrorBlock).toHaveBeenCalled();
    });

    it('should show error message if form submission fails', async () => {
        (mockLocalStore.submitPricePromise as jest.Mock).mockImplementationOnce(() =>
            Promise.reject(new Error('Submission failed')),
        );

        render(<PricePromise {...mockProps} />);
        await userEvent.click(screen.getByTestId('submit-btn'));

        expect(mockLocalStore.toggleForceErrors).toHaveBeenCalledWith(true);
        expect(scrollToErrorBlock).toHaveBeenCalled();
    });

    it('should show error message if isPricePromiseFailed is true', () => {
        Object.defineProperty(mockLocalStore, 'isPricePromiseFailed', {
            get: jest.fn().mockReturnValue(true),
        });
        render(<PricePromise {...mockProps} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(mockErrorMessageProps).toHaveBeenCalledWith({
            message: SitecoreDictionary.PricePromiseErrorsRequestFailMessage,
            description: SitecoreDictionary.PricePromiseErrorsRequestFailDescription,
            errorMessageClass: 'error',
            icon: expect.anything(),
        });
    });

    it('should NOT render form if fields are missing', () => {
        mockProps.fields = undefined;
        const { container } = render(<PricePromise {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
