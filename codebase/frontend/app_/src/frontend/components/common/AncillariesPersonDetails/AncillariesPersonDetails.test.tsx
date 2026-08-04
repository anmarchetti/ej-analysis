import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import JSSImage from 'frontend/components/common/JSSImage';

import AncillariesPersonDetails from './AncillariesPersonDetails';

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-tid='jss-image' />),
}));

const createProps = () => ({
    personIcon: mockSitecoreField(mockSitecoreImageField('src')),
    titleConstant: 'Adult',
    title: 'John Doe',
    age: undefined,
});

const createContextValue = () => ({ layoutStore: { isExtrasPage: true } });

let mockProps;
let mockContextValue;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockContextValue,
}));

describe('<AncillariesPersonDetails />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockContextValue = createContextValue();
    });

    it('should render component', () => {
        const { container } = render(<AncillariesPersonDetails {...mockProps} />);
        expect(container.firstChild).not.toBeNull();
    });

    it('Should find JSSImage', () => {
        render(<AncillariesPersonDetails {...mockProps} />);
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(JSSImage).toHaveBeenCalled();
    });

    it('Should display Adult if isExtrasPage equal true', () => {
        mockContextValue.layoutStore.isExtrasPage = true;
        render(<AncillariesPersonDetails {...mockProps} />);

        expect(screen.getByText('Adult')).toBeInTheDocument();
    });

    it('Should display person name if isExtrasPage equal false', () => {
        mockContextValue.layoutStore.isExtrasPage = false;
        render(<AncillariesPersonDetails {...mockProps} />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display age if present', () => {
        mockProps.age = '(aged 7)';
        render(<AncillariesPersonDetails {...mockProps} />);

        expect(screen.getByText('(aged 7)')).toBeInTheDocument();
    });

    it('should NOT display age if not present', () => {
        mockProps.age = undefined;
        render(<AncillariesPersonDetails {...mockProps} />);

        expect(screen.queryByText('(aged 7)')).not.toBeInTheDocument();
    });
});
