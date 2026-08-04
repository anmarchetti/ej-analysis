import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SBInput, {
    CROSS_BUTTON_CLASS_FOR_CALCULATION,
    ISearchBarInputProps,
    LIST_BUTTON_CLASS_FOR_CALCULATION,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SBInput/SBInput';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

jest.mock('frontend/components/icons-new/Cross', () => () => <span data-tid='cross-icon' />);
jest.mock('frontend/components/icons-new/List', () => () => <span data-tid='list-icon' />);

const createMockProps = (): ISearchBarInputProps => ({
    hidePlaceholder: false,
    icon: <span data-testid='icon' />,
    id: 'test-input',
    isEditable: true,
    label: 'Test Label',
    placeholder: 'Test Placeholder',
    showClearButton: false,
    value: '',
    onType: jest.fn(),
    onFocus: jest.fn(),
    onKeyDown: jest.fn(),
    onClick: jest.fn(),
    ariaLabel: 'aria label',
    ariaDescription: 'desc',
    clickOnListButton: jest.fn(),
    dropdownToggleLabel: 'Open list',
    onClearButtonClick: jest.fn(),
});

let mockProps;
let mockStores;

describe('SBInput', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores();
    });

    it('should render input with base labels', () => {
        render(<SBInput {...mockProps} />);

        expect(screen.getByLabelText(mockProps.label)).toBeInTheDocument();
        expect(screen.getByText(mockProps.placeholder)).toBeInTheDocument();
        const input = screen.getByTestId(mockProps.id);
        expect(input).toHaveAttribute('aria-describedby', 'test-input-descr');
        expect(screen.getByText(mockProps.ariaDescription)).toBeInTheDocument();
    });

    it('should NOT add aria-describedby when no ariaDescription', () => {
        mockProps.ariaDescription = undefined;

        render(<SBInput {...mockProps} />);

        const input = screen.getByTestId(mockProps.id);
        expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('should NOT render placeholder when hidePlaceholder=true', () => {
        mockProps.hidePlaceholder = true;
        render(<SBInput {...mockProps} />);

        expect(screen.queryByText(mockProps.placeholder)).not.toBeInTheDocument();
    });

    it('should calls onType on value change', () => {
        render(<SBInput {...mockProps} />);

        fireEvent.change(screen.getByTestId(mockProps.id), { target: { value: 'abc' } });
        expect(mockProps.onType).toHaveBeenCalledWith('abc');
    });

    it('should calls onFocus on focus', () => {
        render(<SBInput {...mockProps} />);

        fireEvent.focus(screen.getByTestId(mockProps.id));
        expect(mockProps.onFocus).toHaveBeenCalled();
    });

    it('should calls onKeyDown on key down', () => {
        render(<SBInput {...mockProps} />);
        fireEvent.keyDown(screen.getByTestId(mockProps.id), { key: 'A' });
        expect(mockProps.onKeyDown).toHaveBeenCalled();
    });

    it('should calls onClick on input click', () => {
        render(<SBInput {...mockProps} />);

        fireEvent.click(screen.getByTestId(mockProps.id));
        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should sets input as readOnly if isEditable=false', () => {
        mockProps.isEditable = false;
        render(<SBInput {...mockProps} />);

        expect(screen.getByTestId(mockProps.id)).toHaveAttribute('readOnly');
    });

    it('should render clear button if showClearButton=true and value is not empty', () => {
        mockProps.showClearButton = true;
        mockProps.value = 'abc';
        render(<SBInput {...mockProps} />);

        expect(screen.getByTestId('search-bar-input-cross')).toHaveClass(CROSS_BUTTON_CLASS_FOR_CALCULATION);
        expect(screen.getByTestId('search-bar-input-cross')).toHaveAttribute(
            'aria-label',
            `${SitecoreDictionary.GlobalsButtonsClearField} ${mockProps.ariaLabel}`,
        );
        expect(screen.getByTestId('cross-icon')).toBeInTheDocument();
    });

    it('should render clear button with aria-label by label prop', () => {
        mockProps.ariaLabel = undefined;
        mockProps.showClearButton = true;
        mockProps.value = 'abc';

        render(<SBInput {...mockProps} />);

        expect(screen.getByTestId('search-bar-input-cross')).toHaveAttribute(
            'aria-label',
            `${SitecoreDictionary.GlobalsButtonsClearField} ${mockProps.label}`,
        );
    });

    it('should calls onClearButtonClick on clear button click', () => {
        mockProps.showClearButton = true;
        mockProps.value = 'abc';
        render(<SBInput {...mockProps} />);

        fireEvent.click(screen.getByTestId('search-bar-input-cross'));
        expect(mockProps.onClearButtonClick).toHaveBeenCalled();
    });

    it('should shows list button if clickOnListButton is provided', () => {
        render(<SBInput {...mockProps} />);

        expect(screen.getByTestId('search-bar-input-list')).toHaveClass(LIST_BUTTON_CLASS_FOR_CALCULATION);
        expect(screen.getByTestId('search-bar-input-list')).toHaveAttribute(
            'aria-label',
            mockProps.dropdownToggleLabel,
        );
        expect(screen.getByTestId('list-icon')).toBeInTheDocument();
    });

    it('should calls clickOnListButton on list button click', () => {
        render(<SBInput {...mockProps} />);

        fireEvent.click(screen.getByTestId('search-bar-input-list'));

        expect(mockProps.clickOnListButton).toHaveBeenCalled();
    });

    it('should add error and highlight classes', () => {
        mockProps.isError = true;
        mockProps.isInputHighlighted = true;
        render(<SBInput {...mockProps} />);

        const inner = screen.getByTestId('search-bar-input-inner');
        expect(inner).toHaveClass('form-field--error inProgress withButtons');
    });

    it('should pass tabIndex', () => {
        mockProps.tabIndex = 5;
        render(<SBInput {...mockProps} />);

        expect(screen.getByTestId(mockProps.id)).toHaveAttribute('tabIndex', '5');
    });
});
