import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import TransferDescriptionItem from './TransferDescriptionItem';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TransferDescriptionItem />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('should render text without icon', () => {
        render(<TransferDescriptionItem text='Test text' />);

        expect(screen.getByText('Test text')).toBeInTheDocument();
    });

    it('should render text with name', () => {
        render(<TransferDescriptionItem name='Label:' text='Test text' />);

        expect(screen.getByText(/Label:/)).toBeInTheDocument();
        expect(screen.getByText(/Test text/)).toBeInTheDocument();
    });

    it('should render with icon', () => {
        const TestIcon = () => <svg data-tid='test-icon' />;

        render(<TransferDescriptionItem icon={<TestIcon />} text='Test text' />);

        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
        expect(screen.getByText('Test text')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
        const { container } = render(<TransferDescriptionItem className='custom-class' text='Test text' />);

        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should not render icon when icon is null', () => {
        const { container } = render(<TransferDescriptionItem icon={null} text='Test text' />);

        expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('should render empty when text is undefined', () => {
        const { container } = render(<TransferDescriptionItem text={''} />);

        expect(container).toBeEmptyDOMElement();
    });
});
