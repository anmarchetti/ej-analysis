import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { SCREENSHOT_FILE_TYPES } from 'code/validation.config';
import { createMockStores } from 'frontend/__mocks__';
import { PricePromiseInfoFields } from 'models/data/PricePromiseInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { mockPricePromiseFields } from 'frontend/components/renderings/PricePromise/__mocks__/pricePromiseFields.mock';
import { mockPricePromiseStore } from 'frontend/components/renderings/PricePromise/__mocks__/pricePromiseStore.mock';

import FileUploadSection, { TFileUploadSectionProps } from './FileUploadSection';

const createProps = (): TFileUploadSectionProps => ({
    fields: mockPricePromiseFields,
    store: mockPricePromiseStore,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isTradePortal: false,
        },
    });

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores = createStores();
let mockProps = createProps();

const mockText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

const mockValidatableFileUploadFieldProps = jest.fn();
jest.mock('frontend/components/common/ValidatableFileUploadField', () => props => {
    mockValidatableFileUploadFieldProps(props);

    return (
        <div data-tid='validatable-file-upload-field'>
            <input onChange={props.onChange} />
        </div>
    );
});

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => props => {
    mockRichTextWithLinksProps(props);

    return <div data-tid='rich-text-with-links' />;
});

jest.mock('frontend/components/renderings/PricePromise/pricePromise.utils', () => ({
    isFieldRequired: jest.fn(() => true),
}));

describe('<FileUploadSection />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render section title and description', () => {
        render(<FileUploadSection {...mockProps} />);

        expect(screen.getByTestId('sitecore-jss-text')).toBeInTheDocument();
        expect(mockText).toHaveBeenCalledWith({
            className: 'sectionTitle',
            tag: 'h3',
            field: mockProps.fields.FileUploadTitle,
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields.FileUploadDescription,
            className: 'text',
        });
    });

    it('should render upload file button', () => {
        render(<FileUploadSection {...mockProps} />);

        expect(screen.getByTestId('validatable-file-upload-field')).toBeInTheDocument();
        expect(mockValidatableFileUploadFieldProps).toHaveBeenCalledWith({
            files: mockProps.store.pricePromiseInfo.screenshots,
            onChange: expect.any(Function),
            label: mockProps.fields.FileUploadButton.value,
            errors: [],
            forceError: mockProps.store.forceErrors,
            acceptFileTypes: SCREENSHOT_FILE_TYPES,
            id: PricePromiseInfoFields.Screenshots,
            allowedUploadedFileNumb: 5,
            required: true,
            multiple: true,
            isTradePortal: false,
            errorLabel: SitecoreDictionary.PricePromiseErrorsScreenshotInvalid,
        });
    });

    it('should call onChangeField when file upload changes', () => {
        render(<FileUploadSection {...mockProps} />);

        const fileUploadField = screen.getByRole('textbox');
        fireEvent.change(fileUploadField, { target: { value: 'new-file.png' } });

        expect(mockProps.store.pricePromiseInfo.onChangeField).toHaveBeenCalledWith(
            PricePromiseInfoFields.Screenshots,
            expect.any(Object),
        );
    });
});
