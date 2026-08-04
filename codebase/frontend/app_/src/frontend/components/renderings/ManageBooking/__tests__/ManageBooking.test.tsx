import React from 'react';
import { render } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import INavLink from 'models/data/INavLink';
import { ShowOn } from 'models/enum/ShowOn';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import ManageBooking from 'frontend/components/renderings/ManageBooking/ManageBooking';

const createStores = () => ({
    userStore: { isLoggedIn: false },
});

const createProps = () => ({
    fields: {
        Panels: [
            {
                id: 'abc123',
                fields: {
                    Title: mockSitecoreField('Log in title'),
                    Content: mockSitecoreField('log into account'),
                    Links: [
                        {
                            id: 'link123',
                            fields: {
                                ShowOn: mockSitecoreField(null) as any,
                                Link: mockSitecoreField({
                                    href: '/',
                                    text: 'General Link',
                                    linktype: SitecoreLinkType.Internal,
                                }),
                            },
                        },
                        {
                            id: 'link12345',
                            fields: {
                                ShowOn: mockSitecoreField(ShowOn.ShowOnLogedOut) as any,
                                Link: mockSitecoreField({
                                    href: '/',
                                    text: 'LoggedOut',
                                    linktype: SitecoreLinkType.Internal,
                                }),
                            },
                        },
                    ] as INavLink[],
                },
            },
        ],
    },
    params: {} as any,
    rendering: {} as any,
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

jest.mock('frontend/components/common/RouterLink', () => ({ children }) => <div>{children}</div>);

describe('<ManageBooking />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
        mockProps = createProps();
    });

    it('Should Render panels', () => {
        const { getByText } = render(<ManageBooking {...mockProps} />);
        mockProps.fields.Panels.forEach(panel => {
            expect(getByText(panel.fields.Title.value)).toBeInTheDocument();
            expect(getByText(panel.fields.Content.value)).toBeInTheDocument();
            expect(getByText(panel.fields.Links[0].fields.Link.value.text)).toBeInTheDocument();
        });
    });

    it('Should Render Login Button', () => {
        mockStores.userStore.isLoggedIn = true;
        const Button = mockProps.fields.Panels[0].fields.Links[0];

        if (Button.fields.ShowOn) Button.fields.ShowOn.value = ShowOn.ShowOnLogedIn;

        const { getByText, queryByText } = render(<ManageBooking {...mockProps} />);
        mockProps.fields.Panels.forEach(panel => {
            expect(getByText(panel.fields.Links[0].fields.Link.value.text)).toBeInTheDocument();
            expect(queryByText(panel.fields.Links[1].fields.Link.value.text)).not.toBeInTheDocument();
        });
    });

    it('Should Log out button', () => {
        const { getByText } = render(<ManageBooking {...mockProps} />);
        mockProps.fields.Panels.forEach(panel => {
            expect(getByText(panel.fields.Links[1].fields.Link.value.text)).toBeInTheDocument();
        });
    });
});
