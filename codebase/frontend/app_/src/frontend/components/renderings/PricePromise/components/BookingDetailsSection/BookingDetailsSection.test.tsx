import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { PricePromiseInfoFields } from 'models/data/PricePromiseInfo';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { mockPricePromiseFields } from 'frontend/components/renderings/PricePromise/__mocks__/pricePromiseFields.mock';
import { mockPricePromiseStore } from 'frontend/components/renderings/PricePromise/__mocks__/pricePromiseStore.mock';

import BookingDetailsSection, { TBookingDetailsSectionProps } from './BookingDetailsSection';

const createProps = (): TBookingDetailsSectionProps => ({
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
            <input data-tid={props.id} onChange={props.onChange} />
            {props.children}
        </div>
    );
});

const mockValidatableDateFieldProps = jest.fn();
jest.mock('frontend/components/common/ValidatableDateField', () => props => {
    mockValidatableDateFieldProps(props);

    return (
        <div data-tid='validatable-date-field'>
            <input data-tid={props.id} onChange={props.onChange} />
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

describe('<BookingDetailsSection />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render section title', () => {
        render(<BookingDetailsSection {...mockProps} />);

        expect(screen.getByTestId('sitecore-jss-text')).toBeInTheDocument();
        expect(mockText).toHaveBeenCalledWith({
            className: 'sectionTitle',
            tag: 'h3',
            field: mockProps.fields.BookingDetailsSectionTitle,
        });
    });

    it('should render ValidatableField for Name', () => {
        render(<BookingDetailsSection {...mockProps} />);

        expect(mockValidatableFieldProps).toHaveBeenCalledWith({
            onChange: expect.any(Function),
            value: mockProps.store.pricePromiseInfo.name,
            label: mockProps.fields.NameFieldLabel.value,
            errors: [],
            forceError: mockProps.store.forceErrors,
            id: PricePromiseInfoFields.Name,
            autoComplete: false,
            shouldTrimOnBlur: true,
            required: true,
            containerClass: 'fieldMargin',
        });
    });

    it('should call onChangeField when name changes', () => {
        render(<BookingDetailsSection {...mockProps} />);

        const nameField = screen.getByTestId('name');
        fireEvent.change(nameField, { target: { value: 'New Name' } });

        expect(mockProps.store.pricePromiseInfo.onChangeField).toHaveBeenCalledWith(
            PricePromiseInfoFields.Name,
            expect.any(Object),
        );
    });

    it('should render ValidatableField for BookingReference with Callout if tooltip exists', () => {
        mockProps.fields.BookingReferenceTooltip.value = 'Tooltip text';
        render(<BookingDetailsSection {...mockProps} />);

        expect(mockValidatableFieldProps).toHaveBeenCalledWith({
            onChange: expect.any(Function),
            value: mockProps.store.pricePromiseInfo.bookingReference,
            label: mockProps.fields.BookingReferenceFieldLabel.value,
            errors: [],
            forceError: mockProps.store.forceErrors,
            id: PricePromiseInfoFields.BookingReference,
            autoComplete: false,
            shouldTrimOnBlur: true,
            fieldClass: 'form-field--inner-callout',
            required: true,
            inputMode: 'numeric',
            children: expect.anything(),
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
            field: mockProps.fields.BookingReferenceTooltip,
        });
    });

    it('should call onChangeField when booking reference changes', () => {
        render(<BookingDetailsSection {...mockProps} />);

        const bookingReferenceField = screen.getByTestId('bookingReference');
        fireEvent.change(bookingReferenceField, { target: { value: 'New Booking Reference' } });

        expect(mockProps.store.pricePromiseInfo.onChangeField).toHaveBeenCalledWith(
            PricePromiseInfoFields.BookingReference,
            expect.any(Object),
        );
    });

    it('should NOT render Callout if BookingReferenceTooltip is missing', () => {
        mockProps.fields.BookingReferenceTooltip.value = '';
        render(<BookingDetailsSection {...mockProps} />);

        expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
        expect(mockValidatableFieldProps).toHaveBeenCalledWith({
            onChange: expect.any(Function),
            value: mockProps.store.pricePromiseInfo.bookingReference,
            label: mockProps.fields.BookingReferenceFieldLabel.value,
            errors: [],
            forceError: mockProps.store.forceErrors,
            id: PricePromiseInfoFields.BookingReference,
            autoComplete: false,
            shouldTrimOnBlur: true,
            fieldClass: undefined,
            required: true,
            inputMode: 'numeric',
            children: '',
        });
    });

    it('should render ValidatableDateField for DepartureDate', () => {
        render(<BookingDetailsSection {...mockProps} />);

        expect(screen.getByTestId('validatable-date-field')).toBeInTheDocument();
        expect(mockValidatableDateFieldProps).toHaveBeenCalledWith({
            onChange: expect.any(Function),
            value: mockProps.store.pricePromiseInfo.departureDate,
            label: mockProps.fields.BookingDepartureFieldLabel.value,
            errors: [],
            forceError: mockProps.store.forceErrors,
            id: PricePromiseInfoFields.DepartureDate,
            autoComplete: false,
            inputContainerClass: 'form-control__label--focused',
            shouldMoveCursor: true,
            required: true,
        });
    });

    it('should call onChangeField when departure date changes', () => {
        render(<BookingDetailsSection {...mockProps} />);

        const departureDateField = screen.getByTestId('departureDate');
        fireEvent.change(departureDateField, { target: { value: '2023-12-31' } });

        expect(mockProps.store.pricePromiseInfo.onChangeField).toHaveBeenCalledWith(
            PricePromiseInfoFields.DepartureDate,
            expect.any(Object),
        );
    });
});
