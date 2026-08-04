import React from 'react';
import { render } from '@testing-library/react';

import LoginMaintenanceMode from './LoginMaintenanceMode';

const createProps = () => ({
    fields: {
        Title: { value: 'title' },
        Description: { value: 'description' },
        Link: { value: { href: 'href', text: 'link' } },
        Icon: { value: { src: 'title' } },
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

describe('<LoginMaintenanceMode />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render', () => {
        mockProps.fields = null;
        const { container } = render(<LoginMaintenanceMode {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render title', () => {
        mockProps.fields.Title = null;
        const { queryByRole } = render(<LoginMaintenanceMode {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should NOT render icon', () => {
        mockProps.fields.Icon = null;
        const { queryByRole } = render(<LoginMaintenanceMode {...mockProps} />);

        expect(queryByRole('img')).not.toBeInTheDocument();
    });

    it('should NOT render link', () => {
        mockProps.fields.Link = null;
        const { queryByRole } = render(<LoginMaintenanceMode {...mockProps} />);

        expect(queryByRole('link')).not.toBeInTheDocument();
    });

    it('should NOT render description', () => {
        mockProps.fields.Description = null;
        const { queryByText } = render(<LoginMaintenanceMode {...mockProps} />);

        expect(queryByText('description')).not.toBeInTheDocument();
    });

    it('should render title', () => {
        const { getByRole } = render(<LoginMaintenanceMode {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('title');
    });

    it('should render icon', () => {
        const { getByRole } = render(<LoginMaintenanceMode {...mockProps} />);

        expect(getByRole('img')).toBeInTheDocument();
    });

    it('should render link', () => {
        const { getByRole } = render(<LoginMaintenanceMode {...mockProps} />);

        expect(getByRole('link')).toHaveTextContent('link');
    });

    it('should render description', () => {
        const { getByText } = render(<LoginMaintenanceMode {...mockProps} />);

        expect(getByText('description')).toBeInTheDocument();
    });
});
