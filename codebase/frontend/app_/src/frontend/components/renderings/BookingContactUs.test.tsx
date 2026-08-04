import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import BookingContactUs from './BookingContactUs';

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field, ...props }) => {
        mockTextComponent(props);

        return <div data-tid='text-component'>{field?.value}</div>;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, ...props }) => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links'>{field?.value}</div>;
    },
}));

describe('<BookingContactUs />', () => {
    const resetMocks = () =>
        ({
            fields: {
                Text: mockSitecoreField('Text'),
                Title: mockSitecoreField('Title'),
                Phone: mockSitecoreField('Phone'),
                PhoneText: mockSitecoreField('PhoneText'),
            },
            isLoggedIn: true,
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render with phone, phoneText, title and text', () => {
        render(<BookingContactUs {...mocks} />);

        const textComponents = screen.getAllByTestId('text-component');

        expect(textComponents[0]).toHaveTextContent('Title');
        expect(textComponents[1]).toHaveTextContent('PhoneText');
        expect(textComponents[2]).toHaveTextContent('Phone');
        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('Text');

        expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
            tag: 'h2',
            className: 'booking-help__title',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(2, {
            tag: 'p',
            className: 'booking-help__text booking-help__text--orange',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(3, {
            tag: 'a',
            href: 'tel:Phone',
            className: 'booking-help__tel',
        });
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            tag: 'p',
            className: 'booking-help__text',
        });
    });

    it('should render without phone, phoneText, title and text', () => {
        mocks.fields = undefined;

        render(<BookingContactUs {...mocks} />);

        const textComponents = screen.getAllByTestId('text-component');

        expect(textComponents[0]).toHaveTextContent('');
        expect(textComponents[1]).toHaveTextContent('');
        expect(textComponents[2]).toHaveTextContent('');
        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('');
    });
});
