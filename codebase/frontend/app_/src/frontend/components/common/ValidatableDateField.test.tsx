import React from 'react';
import { render } from '@testing-library/react';

import { DateLocalizedFormats } from 'code/dates';

import ValidatableDateField from './ValidatableDateField';

const createProps = () => ({
    label: 'label',
    onChange: jest.fn(),
    id: 'test',
    errors: [],
    value: 'value',
    trackValidation: jest.fn(),
    getPhrase: jest.fn(() => 'test-content'),
    dateFormat: DateLocalizedFormats.L,
    hideWatermark: false,
});

const createStores = () => ({
    layoutStore: { lang: 'en', getPhrase: jest.fn(p => p), isTradePortal: false },
    trackingStore: { trackValidation: true },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ValidatableDateField />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render form field with label', () => {
        const { getByText } = render(<ValidatableDateField {...mockProps} />);

        expect(getByText('label')).toBeInTheDocument();
    });

    it('should render date field', () => {
        const { getByTestId } = render(<ValidatableDateField {...mockProps} />);

        expect(getByTestId('test')).toBeInTheDocument();
    });

    it('should render form field with placeholder', () => {
        const { container } = render(<ValidatableDateField {...mockProps} />);

        expect(container.getElementsByClassName('form-control__input')[0]).toHaveAttribute('placeholder', 'MM/DD/YYYY');
    });

    it('should render form field without placeholder', () => {
        mockProps.hideWatermark = true;
        const { container } = render(<ValidatableDateField {...mockProps} />);

        expect(container.getElementsByClassName('form-control__input')[0]).toHaveAttribute('placeholder', '');
    });
});
