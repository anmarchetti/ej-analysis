import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { KeyboardKey } from 'models/enum/KeyboardKey';

import SearchBarInput, { ISearchBarInputProps } from './SearchBarInput';

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createStores = () => createMockStores();

const resetMocks = (): ISearchBarInputProps => ({
    id: 'id',
    icon: <div data-tid='icon' />,
    label: 'label',
    placeholder: 'placeholder',
    ariaDescription: '',
    value: 'test',
    hidePlaceholder: false,
    isEditable: false,
    toggleFocus: jest.fn(),
    onType: jest.fn(),
    isError: false,
    showClearButton: false,
    sbInputKeyboardEvent: jest.fn(),
});

let mockStores;
let mocks;

describe('SearchBarInput', () => {
    beforeEach(() => {
        mockStores = createStores();
        mocks = resetMocks();
        mockUseMobileViewport = false;
    });

    describe('render', () => {
        it('should standard render', () => {
            mocks = resetMocks();
            render(<SearchBarInput {...mocks} />);

            expect(screen.getByTestId('search-bar-input')).toBeInTheDocument();
            expect(screen.queryByTestId('search-bar-input-cross')).not.toBeInTheDocument();
            expect(screen.queryByTestId('search-bar-input-list')).not.toBeInTheDocument();
        });

        it('should render with value-box, ariaDescription, cross', () => {
            mocks.ariaDescription = 'ariaDescription';
            mocks.showClearButton = true;
            mocks.value = 'value';
            render(<SearchBarInput {...mocks} />);

            expect(screen.getByTestId('search-bar-input')).toBeInTheDocument();
            expect(screen.getByTestId('search-bar-input-cross')).toBeInTheDocument();
        });
    });

    describe('input value props', () => {
        it('should set value to input equal value props', () => {
            mocks.value = 'value';
            render(<SearchBarInput {...mocks} />);

            expect(screen.getByTestId(mocks.id)).toHaveValue('value');
        });
    });

    describe('check function', () => {
        it('should call onType function', () => {
            render(<SearchBarInput {...mocks} />);

            fireEvent.input(screen.getByTestId(mocks.id), { target: { value: 'test1' } });

            expect(mocks.onType).toHaveBeenCalledWith('test1');
        });

        it('should call onClearButtonClick when click on cross button', () => {
            mocks.onClearButtonClick = jest.fn();
            mocks.showClearButton = true;
            mocks.value = 'value';
            render(<SearchBarInput {...mocks} />);

            fireEvent.click(screen.getByTestId('search-bar-input-cross'));

            expect(mocks.onClearButtonClick).toHaveBeenCalled();
        });

        it('should NOT set focus to input after click on onClearButtonClick when shouldFocusAfterCleaning is false', () => {
            mocks.onClearButtonClick = jest.fn();
            mocks.showClearButton = true;
            mocks.value = 'value';
            mocks.shouldFocusAfterCleaning = false;
            render(<SearchBarInput {...mocks} />);

            fireEvent.click(screen.getByTestId('search-bar-input-cross'));

            expect(mocks.onClearButtonClick).toHaveBeenCalled();
            expect(screen.getByTestId('id')).not.toHaveFocus();
        });

        it('should NOT render clear button on mobile', () => {
            mockUseMobileViewport = true;
            mocks.onClearButtonClick = jest.fn();
            mocks.showClearButton = true;
            mocks.value = 'value';
            render(<SearchBarInput {...mocks} />);

            expect(screen.queryByTestId('search-bar-input-cross')).not.toBeInTheDocument();
        });
    });

    describe('keyDown', () => {
        it('should call sbInputKeyboardEvent when press any key', async () => {
            render(<SearchBarInput {...mocks} />);

            const keyboardEvent = new KeyboardEvent('keydown', {
                key: KeyboardKey.ESC,
                bubbles: true,
            });

            fireEvent(screen.getByTestId(mocks.id), keyboardEvent);

            expect(mocks.sbInputKeyboardEvent).toHaveBeenCalled();
        });
    });

    describe('classNames', () => {
        it('should add error class when isError true', () => {
            mocks.isError = true;

            render(<SearchBarInput {...mocks} />);

            expect(screen.getByTestId('search-bar-input-inner')).toHaveClass('errorInput');
        });

        it('should add highlighted style when isHighlighted is true', () => {
            mocks.isHighlighted = true;
            render(<SearchBarInput {...mocks} />);

            expect(screen.getByTestId('search-bar-input')).toHaveClass('highlighted');
        });
    });

    describe('focus', () => {
        it('should set focus on click', async () => {
            render(<SearchBarInput {...mocks} />);

            await userEvent.click(screen.getByTestId(mocks.id));

            expect(screen.getByTestId('id')).toHaveFocus();
            expect(mocks.toggleFocus).toHaveBeenCalledWith(
                true,
                expect.objectContaining({
                    target: screen.getByTestId('id'),
                }),
            );
        });

        it('should blur input', async () => {
            render(<SearchBarInput {...mocks} />);

            await userEvent.click(screen.getByTestId(mocks.id));
            await userEvent.click(document.body);

            expect(screen.getByTestId('id')).not.toHaveFocus();
            expect(mocks.toggleFocus).toHaveBeenCalledWith(
                false,
                expect.objectContaining({
                    target: screen.getByTestId('id'),
                }),
            );
        });
    });
});
