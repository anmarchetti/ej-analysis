import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ContactFormDatePicker, { IContactFormDatePickerProps } from './ContactFormDatePicker';

const mockCalendarWrapper = jest.fn();
jest.mock('frontend/components/renderings/ContactUs/components/CalendarWrapper', () => ({
    __esModule: true,
    default: props => {
        mockCalendarWrapper(props);

        return <div data-tid='calendar-wrapper' />;
    },
}));

const mockRichTextWithLinkComponent = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinkComponent(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockFakeInput = jest.fn();
jest.mock('frontend/components/common/FakeInput/FakeInput', () => ({
    __esModule: true,
    default: props => {
        mockFakeInput(props);

        return <div data-tid='fake-input' />;
    },
}));

const createProps = (): IContactFormDatePickerProps => ({
    clearDates: jest.fn(),
    dateOfHoliday: new Date(0).toString(),
    monthLimit: 1,
    placeholder: 'placeholder',
    text: mockSitecoreField('text'),
    title: mockSitecoreField('title'),
    toggle: jest.fn(),
});

let mockProps;

describe('CalendarWrapper', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render correctly with monthLimit', () => {
        render(<ContactFormDatePicker {...mockProps} />);
        expect(screen.getByTestId('calendar-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(mockFakeInput).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'date-picker-field',
                placeholder: 'placeholder',
                showClearButton: true,
                value: new Date(0).toString(),
            }),
        );
        expect(mockCalendarWrapper).toHaveBeenCalledWith(
            expect.objectContaining({
                monthLimit: 1,
            }),
        );
    });

    it('should render correctly with unset monthLimit', () => {
        mockProps.monthLimit = undefined;
        render(<ContactFormDatePicker {...mockProps} />);
        expect(screen.getByTestId('calendar-wrapper')).toBeInTheDocument();
        expect(mockCalendarWrapper).toHaveBeenCalledWith({ monthLimit: undefined });
    });
});
