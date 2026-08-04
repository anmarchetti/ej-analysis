import React from 'react';
import { render } from '@testing-library/react';

import OurPolicies from './OurPolicies';

const createProps = () => ({
    fields: {
        Title: { value: 'title' },
        Description: { value: 'description' },
        Link: { value: { href: 'href', text: 'link' } },
    },
});

const createStores = () => ({
    layoutStore: {},
    appStore: {},
    routerStore: {},
    queryParamStore: {},
    userStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ManageCookiesPreferences />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render title', () => {
        mockProps.fields.Title.value = '';
        const { queryByText } = render(<OurPolicies {...mockProps} />);

        expect(queryByText('title')).not.toBeInTheDocument();
    });

    it('should render title', () => {
        const { getByText } = render(<OurPolicies {...mockProps} />);

        expect(getByText('title')).toBeInTheDocument();
    });

    it('should NOT render description', () => {
        mockProps.fields.Description = null;
        const { queryByText } = render(<OurPolicies {...mockProps} />);

        expect(queryByText('description')).not.toBeInTheDocument();
    });

    it('should render description', () => {
        const { getByText } = render(<OurPolicies {...mockProps} />);

        expect(getByText('description')).toBeInTheDocument();
    });

    it('should NOT render link', () => {
        mockProps.fields.Link = null;
        const { queryByRole } = render(<OurPolicies {...mockProps} />);

        expect(queryByRole('link')).not.toBeInTheDocument();
    });

    it('should render link', () => {
        const { getByRole } = render(<OurPolicies {...mockProps} />);

        expect(getByRole('link')).toHaveTextContent('link');
    });
});
