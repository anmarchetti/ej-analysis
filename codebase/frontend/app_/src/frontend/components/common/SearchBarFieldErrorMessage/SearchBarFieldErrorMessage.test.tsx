import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { TStores } from 'frontend/store/IStores';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';

import SearchBarFieldErrorMessage, { ISearchBarFieldErrorMessage } from './SearchBarFieldErrorMessage';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: ({ message, errorMessageClass, icon }: any) => (
        <div data-tid='error-message' className={errorMessageClass}>
            {icon}
            {message}
        </div>
    ),
}));

jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: ({ dictionaryKey }) => <div data-tid='rich-text-dictionary'>{dictionaryKey}</div>,
}));

jest.mock('frontend/components/icons-new/WarningFilled', () => ({
    __esModule: true,
    default: () => <svg data-tid='warning-icon' />,
}));

let mockProps: ISearchBarFieldErrorMessage;
let mockStores: TStores;

const createProps = (): ISearchBarFieldErrorMessage => ({
    fieldErrorType: SearchBarDropdown.Who,
    errorClassName: 'error-class',
});

describe('<SearchBarFieldErrorMessage />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            searchStore: {
                errorMessages: {
                    key: SearchBarDropdown.Who,
                    message: 'error_message',
                },
                hasErrorInField: jest.fn(() => true),
            },
        });
    });

    it('should render the error message when there is an error in the field', () => {
        (mockStores.searchStore.hasErrorInField as jest.Mock).mockReturnValue(true);

        render(<SearchBarFieldErrorMessage {...mockProps} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveClass('error-class');
        expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
        expect(screen.getByTestId('rich-text-dictionary')).toHaveTextContent('error_message');
    });

    it('should not render anything when there is no error in the field', () => {
        (mockStores.searchStore.hasErrorInField as jest.Mock).mockReturnValue(false);

        render(<SearchBarFieldErrorMessage {...mockProps} />);

        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
});
