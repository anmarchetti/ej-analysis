import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { PricePromiseInfoFields } from 'models/data/PricePromiseInfo';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { mockPricePromiseFields } from 'frontend/components/renderings/PricePromise/__mocks__/pricePromiseFields.mock';
import { mockPricePromiseStore } from 'frontend/components/renderings/PricePromise/__mocks__/pricePromiseStore.mock';

import LinkSection, { TLinkSectionProps } from './LinkSection';

const createProps = (): TLinkSectionProps => ({
    fields: mockPricePromiseFields,
    store: mockPricePromiseStore,
});

let mockProps = createProps();

const mockText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

const mockValidatableFieldProps = jest.fn();
jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => props => {
    mockValidatableFieldProps(props);

    return (
        <div data-tid='validatable-field'>
            <input onChange={props.onChange} />
            {props.children}
        </div>
    );
});

const mockCalloutProps = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => props => {
    mockCalloutProps(props);

    return <div data-tid='callout'>{props.content}</div>;
});

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => props => {
    mockRichTextWithLinksProps(props);

    return <div data-tid='rich-text-with-links' />;
});

jest.mock('frontend/components/renderings/PricePromise/pricePromise.utils', () => ({
    getFieldLabel: jest.fn(f => f),
    isFieldRequired: jest.fn(() => true),
}));

describe('<LinkSection />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render section title', () => {
        render(<LinkSection {...mockProps} />);

        expect(screen.getByTestId('sitecore-jss-text')).toBeInTheDocument();
        expect(mockText).toHaveBeenCalledWith({
            className: 'sectionTitle',
            tag: 'h3',
            field: mockProps.fields.LinkSectionTitle,
        });
    });

    it('should render link field with tooltip', () => {
        render(<LinkSection {...mockProps} />);

        expect(screen.getByTestId('validatable-field')).toBeInTheDocument();
        expect(mockValidatableFieldProps).toHaveBeenCalledWith({
            onChange: expect.any(Function),
            value: mockProps.store.pricePromiseInfo.link,
            label: mockProps.fields.LinkFieldLabel.value,
            forceError: mockProps.store.forceErrors,
            errors: [],
            id: PricePromiseInfoFields.Link,
            autoComplete: false,
            shouldTrimOnBlur: true,
            fieldClass: 'form-field--inner-callout',
            required: true,
            children: expect.anything(),
            containerClass: 'fieldMargin',
        });

        expect(screen.getByTestId('callout')).toBeInTheDocument();
        expect(mockCalloutProps).toHaveBeenCalledWith({
            content: expect.anything(),
            orientation: CalloutOrientation.Top,
            position: CalloutPosition.Center,
            isShownOnHover: true,
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields.LinkTooltip,
        });
    });

    it('should NOT render Callout if LinkTooltip is missing', () => {
        mockProps.fields.LinkTooltip.value = '';
        render(<LinkSection {...mockProps} />);

        expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
        expect(mockValidatableFieldProps).toHaveBeenCalledWith({
            onChange: expect.any(Function),
            value: mockProps.store.pricePromiseInfo.link,
            label: mockProps.fields.LinkFieldLabel.value,
            forceError: mockProps.store.forceErrors,
            errors: [],
            id: PricePromiseInfoFields.Link,
            autoComplete: false,
            shouldTrimOnBlur: true,
            fieldClass: undefined,
            required: true,
            children: '',
            containerClass: 'fieldMargin',
        });
    });

    it('should call onChangeField when link field value changes', () => {
        render(<LinkSection {...mockProps} />);

        const linkField = screen.getByRole('textbox');
        fireEvent.change(linkField, { target: { value: 'new-link-value' } });

        expect(mockProps.store.pricePromiseInfo.onChangeField).toHaveBeenCalledWith(
            PricePromiseInfoFields.Link,
            expect.any(Object),
        );
    });
});
