import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import NeedHelpBlock, { TNeedHelpBlockProps } from './NeedHelpBlock';

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field, ...props }) => {
        mockTextComponent(props);

        return <div data-tid='text-component'>{field.value}</div>;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, ...props }) => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links'>{field.value}</div>;
    },
}));

const resetMocks = () =>
    ({
        fields: {
            ContactText: mockSitecoreField('ContactText'),
            Title: mockSitecoreField('Title'),
            ContactNumber: mockSitecoreField('ContactNumber'),
            ContactNote: mockSitecoreField('ContactNote'),
            ViewBookingText: mockSitecoreField('ViewBookingText'),
        },
    } as TNeedHelpBlockProps);

const createStores = () => ({
    trackingStore: {
        trackHomepageAction: jest.fn(),
    },
});

let mocks = resetMocks();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<NeedHelpBlock />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should NOT render when fields are NOT provided', () => {
        mocks.fields = undefined;

        const { container } = render(<NeedHelpBlock {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render with 3 text components, RichTextWithLinks and contact number', () => {
        render(<NeedHelpBlock {...mocks} />);

        const textComponents = screen.getAllByTestId('text-component');

        expect(textComponents[0]).toHaveTextContent('Title');
        expect(textComponents[1]).toHaveTextContent('ContactText');
        expect(textComponents[2]).toHaveTextContent('ContactNote');
        expect(screen.getByText('ContactNumber')).toBeInTheDocument();
        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('ViewBookingText');

        expect(mockTextComponent).toHaveBeenNthCalledWith(1, {
            tag: 'div',
            className: 'need-help-block__title',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(2, {
            tag: 'p',
            className: 'need-help-block__call-text',
        });
        expect(mockTextComponent).toHaveBeenNthCalledWith(3, {
            tag: 'div',
            className: 'need-help-block__note',
        });
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            className: 'need-help-block__note',
        });
    });

    it('should render without text components, RichTextWithLinks and contact number when fields are empty', () => {
        mocks.fields = {
            ContactText: mockSitecoreField(''),
            Title: mockSitecoreField(''),
            ContactNumber: mockSitecoreField(''),
            ContactNote: mockSitecoreField(''),
            ViewBookingText: mockSitecoreField(''),
        };

        render(<NeedHelpBlock {...mocks} />);

        expect(screen.getByTestId('need-help-block-wrapper')).toBeInTheDocument();
        expect(screen.queryByTestId('text-component')).not.toBeInTheDocument();
        expect(screen.queryByTestId('ContactNumber')).not.toBeInTheDocument();
        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });

    it('should call trackHomepageAction on contactNumber click', async () => {
        render(<NeedHelpBlock {...mocks} />);

        await userEvent.click(screen.getByText('ContactNumber'));

        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalledWith(EventTypes.NeedHelpPhone, {
            location: 'Title',
            name: 'ContactText',
            destination: 'ContactNumber',
        });
    });
});
