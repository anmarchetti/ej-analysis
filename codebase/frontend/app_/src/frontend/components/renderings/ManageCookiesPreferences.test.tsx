import React from 'react';
import { render } from '@testing-library/react';

import ManageCookiesPreferences from './ManageCookiesPreferences';

const createProps = () => ({
    fields: {
        Text: { value: 'text' },
    },
});

const createStores = () => ({
    layoutStore: {},
    appStore: {},
    routerStore: {},
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

    it('should NOT render', () => {
        mockProps.fields.Text = null;
        const { container } = render(<ManageCookiesPreferences {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render text', () => {
        const { getByText } = render(<ManageCookiesPreferences {...mockProps} />);

        expect(getByText('text')).toBeInTheDocument();
    });
});
