import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import FakeInput, { IFakeInputProps } from './FakeInput';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: () => false,
}));
jest.mock('frontend/components/icons-new/Cross', () => () => <svg data-tid='svg-cross' />);

const createMockProps = (): IFakeInputProps => ({
    placeholderIcon: <span data-tid='placeholder-icon' />,
    staticIcon: <span data-tid='static-icon' />,
    id: 'test-input',
    placeholder: 'placeholder',
    showClearButton: true,
    value: '',
    label: 'label',
    onClearButtonClick: jest.fn(),
    onClick: jest.fn(),
    tabIndex: 0,
});

let mockProps;
let mockStores;

describe('FakeInput', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createMockProps();
    });

    it('should render input with placeholder and icons when value is empty', () => {
        render(<FakeInput {...mockProps} />);
        expect(screen.getByText(mockProps.placeholder)).toBeInTheDocument();
        expect(screen.getByTestId('placeholder-icon')).toBeInTheDocument();
        expect(screen.getByTestId('static-icon')).toBeInTheDocument();
    });

    it('should render label', () => {
        render(<FakeInput {...mockProps} />);
        expect(screen.getByText(mockProps.label)).toBeInTheDocument();
    });

    it('should render value in input', () => {
        render(<FakeInput {...mockProps} value='test value' />);
        expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
    });

    it('should call onClick when input is clicked', () => {
        render(<FakeInput {...mockProps} />);
        fireEvent.click(screen.getByRole('textbox'));
        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should show clear button when value is not empty and not mobile', () => {
        render(<FakeInput {...mockProps} value='test' />);
        expect(screen.getByTestId('svg-cross')).toBeInTheDocument();
    });

    it('should call onClearButtonClick when clear button is clicked', () => {
        render(<FakeInput {...mockProps} value='test' />);
        fireEvent.click(screen.getByTestId('svg-cross'));
        expect(mockProps.onClearButtonClick).toHaveBeenCalled();
    });

    it('should not show clear button when value is empty', () => {
        render(<FakeInput {...mockProps} value='' />);
        expect(screen.queryByTestId('svg-cross')).not.toBeInTheDocument();
    });
});
