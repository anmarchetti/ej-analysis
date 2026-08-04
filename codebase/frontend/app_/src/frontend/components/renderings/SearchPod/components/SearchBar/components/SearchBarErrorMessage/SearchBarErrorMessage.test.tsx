import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { TStores } from 'frontend/store/IStores';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SearchBarErrorMessage, {
    ISearchBarErrorMessageProps,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarErrorMessage/SearchBarErrorMessage';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/icons-new/WarningFilled', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-warning-filled' />,
}));

const mockErrorMessageProps = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: ({ icon, ...props }) => {
        mockErrorMessageProps(props);

        return <div data-tid='error-message'>{icon}</div>;
    },
}));

let mockProps;
let mockStores: TStores;

const createProps = (): ISearchBarErrorMessageProps => ({
    isActive: true,
    field: SearchBarDropdown.Who,
});

describe('<SearchBarErrorMessage />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            searchStore: {
                hasErrorInField: jest.fn(() => true),
                errorMessages: {
                    key: SearchBarDropdown.Who,
                    message: 'error',
                    description: 'error description',
                },
            },
        });
    });

    it('should render standard', () => {
        render(<SearchBarErrorMessage {...mockProps} />);

        expect(mockErrorMessageProps).toHaveBeenCalledWith({ message: mockStores.searchStore.errorMessages!.message });
        expect(screen.getByTestId('icon-warning-filled')).toBeInTheDocument();
    });

    it('should NOT render when errorMessages is not defined', () => {
        mockStores.searchStore.errorMessages = null;
        const { container } = render(<SearchBarErrorMessage {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when hasErrorInField returns false', () => {
        mockStores.searchStore.hasErrorInField = jest.fn().mockReturnValue(false);
        const { container } = render(<SearchBarErrorMessage {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isActive = false', () => {
        mockProps.isActive = false;
        const { container } = render(<SearchBarErrorMessage {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render with description when withDescription prop is passed', () => {
        mockProps.withDescription = true;

        render(<SearchBarErrorMessage {...mockProps} />);

        expect(mockErrorMessageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                description: mockStores.searchStore.errorMessages!.description,
            }),
        );
    });

    it('should render with description equals to empty string when withDescription prop is passed but errorMessages description is not defined', () => {
        mockProps.withDescription = true;
        mockStores.searchStore.errorMessages = {
            key: SearchBarDropdown.Who,
            message: 'error',
        };

        render(<SearchBarErrorMessage {...mockProps} />);

        expect(mockErrorMessageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                description: '',
            }),
        );
    });
});
