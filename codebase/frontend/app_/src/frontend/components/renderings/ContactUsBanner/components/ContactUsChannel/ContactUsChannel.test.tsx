import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tokens } from 'code/tokens';
import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import * as viewBookingUtils from 'frontend/utils/viewBooking.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ContactUsChannel, { IContactUsChannelProps } from './ContactUsChannel';

const linkMockName = 'test page';

const createProps = (): IContactUsChannelProps => ({
    fields: {
        Description: mockSitecoreField(
            `<p>lorem ipsum text with a link to test page <a href="x-link/" target="_blank">${linkMockName}</a>&nbsp;with all x</p>`,
        ),
        DisplayCountries: mockSitecoreField(''),
        Title: mockSitecoreField('Title'),
        OpenChatBot: mockSitecoreField(false),
        Key: mockSitecoreField('Key'),
    },
    onClose: jest.fn(),
});

let props: IContactUsChannelProps;
let mockStores;

const mockRichTextWithLinkComponent = jest.fn();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinkComponent(props);

        return (
            <div
                dangerouslySetInnerHTML={{ __html: props.field.value }}
                onClick={props.onLinkClick}
                data-tid='rich-text-with-links'
            />
        );
    },
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

Object.defineProperty(window, 'open', {
    configurable: true,
});

window.open = jest.fn();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('ContactUsChannel', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            queryParamStore: {
                buildContactUsFormQuery: jest.fn(() => '?query'),
            },
        });
    });

    it('should render title and description', () => {
        (mockReplaceToken.mockImplementationOnce as jest.Mock)(phrase => phrase);
        render(<ContactUsChannel {...props} />);

        expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(props.fields.Title.value);
        expect(mockRichTextWithLinkComponent).toHaveBeenCalledWith({
            className: 'description',
            field: props.fields.Description,
            onLinkClick: expect.any(Function),
            enableClickEventForEmptyLinks: true,
            dataId: 'contact-us-item-description',
        });
    });

    it('should not open a link with params when the link is not related to contact-page', async () => {
        render(<ContactUsChannel {...props} />);

        const link = screen.getByRole('link', { name: linkMockName });

        await userEvent.click(link);

        expect(mockStores.queryParamStore.buildContactUsFormQuery).not.toHaveBeenCalled();
        expect(window.open).not.toHaveBeenCalled();
    });

    it('should open chatbot when OpenChatBot field is true', async () => {
        props.fields.OpenChatBot = mockSitecoreField(true);
        const mockCallChatBot = jest.spyOn(viewBookingUtils, 'callChatBot').mockImplementation(() => {});

        render(<ContactUsChannel {...props} />);
        const description = screen.getByRole('link');

        await userEvent.click(description);
        expect(mockCallChatBot).toHaveBeenCalled();
        expect(props.onClose).toHaveBeenCalled();
    });

    describe('Description text contains the contact-form link token', () => {
        const hrefMock = '/contact-form';

        beforeEach(() => {
            props.fields.Description = mockSitecoreField(`<p>lorem ipsum text ${Tokens.ContactFormLink}with all</p>`);
            mockReplaceToken.mockImplementation(() => `<p>lorem <a href=${linkMockName}>test page</a> ipsum</p>`);
        });

        it('should open a link in a new window with params when the link contains dictionary token which indicates it is a contact-form link', async () => {
            render(<ContactUsChannel {...props} />);

            const link = screen.getByRole('link', { name: linkMockName });
            const linkElement = screen.getByText('test page');

            expect(mockReplaceToken).toHaveBeenCalledWith(
                props.fields.Description.value,
                Tokens.ContactFormLink,
                SitecoreDictionary.GenericLinkToContactFormHTML,
            );

            await fireEvent.click(link, { target: { href: hrefMock } });

            expect(linkElement).toBeInTheDocument();
            expect(linkElement).toHaveAttribute('href', hrefMock);
            expect(mockStores.queryParamStore.buildContactUsFormQuery).toHaveBeenCalledWith(
                mockStores.viewBookingStore.booking,
            );
            expect(window.open).toHaveBeenCalledWith(expect.stringContaining(`${hrefMock}?query`));
        });

        it('should not redirect when there is no booking in the store', async () => {
            mockStores.viewBookingStore.booking = null;

            render(<ContactUsChannel {...props} />);

            const link = screen.getByRole('link', { name: linkMockName });

            await fireEvent.click(link, { target: { href: hrefMock } });

            expect(window.open).not.toHaveBeenCalled();
        });
    });
});
