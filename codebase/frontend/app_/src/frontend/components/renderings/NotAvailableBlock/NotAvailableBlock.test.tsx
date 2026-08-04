import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { NotAvailableBlock } from './NotAvailableBlock';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Description: mockSitecoreField('Description'),
        HolidaysLinkText: mockSitecoreField('HolidaysLinkText'),
        DotComLinkHelpText: mockSitecoreField('DotComLinkHelpText'),
        DotComLinkText: mockSitecoreField('DotComLinkText'),
        DotComLinkDescription: mockSitecoreField('DotComLinkDescription'),
        Background: mockSitecoreField(mockSitecoreImageField('Background')),
        ViewBookingText: mockSitecoreField('ViewBookingText'),
    },
});

const createStores = () => ({
    layoutStore: { lang: 'fr' },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<NotAvailableBlock />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should render standard', () => {
        render(<NotAvailableBlock {...mockProps} />);

        expect(screen.getByTestId('background').style.backgroundImage).toBe('url(Background)');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Title');
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('DotComLinkHelpText');
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('DotComLinkDescription')).toBeInTheDocument();
        expect(screen.getByText('ViewBookingText')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'HolidaysLinkText' })).toHaveAttribute('href', '/en/holidays');
        expect(screen.getByRole('link', { name: 'DotComLinkText' })).toHaveAttribute(
            'href',
            'https://www.easyjet.com/fr',
        );
    });

    it('should not render when no fields', () => {
        mockProps.fields = null;
        const { container } = render(<NotAvailableBlock {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render background when field not defined', () => {
        mockProps.fields.Background = undefined;
        render(<NotAvailableBlock {...mockProps} />);

        expect(screen.queryByTestId('background')).not.toBeInTheDocument();
    });

    it('should not render title when field not defined', () => {
        mockProps.fields.Title = undefined;
        render(<NotAvailableBlock {...mockProps} />);

        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });

    it('should not render subtitle when field not defined', () => {
        mockProps.fields.DotComLinkHelpText = undefined;
        render(<NotAvailableBlock {...mockProps} />);

        expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });

    it('should not render description when field not defined', () => {
        mockProps.fields.Description = undefined;
        render(<NotAvailableBlock {...mockProps} />);

        expect(screen.queryByTestId('description')).not.toBeInTheDocument();
    });

    it('should not render holidays link when no label', () => {
        mockProps.fields.HolidaysLinkText.value = '';
        render(<NotAvailableBlock {...mockProps} />);

        expect(screen.queryByTestId('holidays-link')).not.toBeInTheDocument();
    });

    it('should not render dot com link description when field not defined', () => {
        mockProps.fields.DotComLinkDescription = undefined;
        render(<NotAvailableBlock {...mockProps} />);

        expect(screen.queryByTestId('dot-com-link-desc')).not.toBeInTheDocument();
    });

    it('should not render any dot com items when no link label', () => {
        mockProps.fields.DotComLinkText.value = '';
        render(<NotAvailableBlock {...mockProps} />);

        expect(screen.queryByText('DotComLinkHelpText')).not.toBeInTheDocument();
        expect(screen.queryByText('DotComLinkDescription')).not.toBeInTheDocument();
        expect(screen.queryByTestId('dot-com-link')).not.toBeInTheDocument();
    });
});
