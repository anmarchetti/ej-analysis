import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import PressContacts, { TPressContactsProps } from './PressContacts';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: () => <div data-tid='text' />,
}));

describe('<PressContacts />', () => {
    const resetMocks = () =>
        ({
            fields: {
                Title: mockSitecoreField('test'),
                Contact1: mockSitecoreField('test1'),
                Contact2: mockSitecoreField('test2'),
            },
            params: {},
            rendering: {},
        } as TPressContactsProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should NOT render Text if no title is set', () => {
        mocks.fields = {};
        render(<PressContacts {...mocks} />);
        expect(screen.queryByTestId('text')).not.toBeInTheDocument();
    });

    it('should render Text if text title set', () => {
        render(<PressContacts {...mocks} />);
        expect(screen.queryByTestId('text')).toBeInTheDocument();
    });

    it('should NOT render Contact if no Contact is set', () => {
        mocks.fields = {};
        render(<PressContacts {...mocks} />);
        expect(screen.queryByTestId('press-contacts-contact1')).not.toBeInTheDocument();
    });

    it('should render Contact if one Contact is set', () => {
        mocks.fields = {
            Contact1: mockSitecoreField('test'),
        };
        render(<PressContacts {...mocks} />);
        expect(screen.queryByTestId('press-contacts-contact1')).toHaveTextContent(
            (mocks.fields.Contact1 as ISitecoreField<string>).value,
        );
    });

    it('should render two Contacts if both Contacts are set', () => {
        mocks.fields = {
            Contact1: mockSitecoreField('test1'),
            Contact2: mockSitecoreField('test2'),
        };

        render(<PressContacts {...mocks} />);
        expect(screen.queryByTestId('press-contacts-contact1')).toHaveTextContent(
            (mocks.fields.Contact1 as ISitecoreField<string>).value,
        );
        expect(screen.queryByTestId('press-contacts-contact2')).toHaveTextContent(
            (mocks.fields.Contact2 as ISitecoreField<string>).value,
        );
    });
});
