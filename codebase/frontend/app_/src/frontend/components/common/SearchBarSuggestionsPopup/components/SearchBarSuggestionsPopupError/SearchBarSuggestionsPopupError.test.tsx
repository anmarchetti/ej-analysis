import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

import SearchBarSuggestionsPopupError, { ISearchBarSuggestionsPopupErrorProps } from './SearchBarSuggestionsPopupError';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockErrorMessageComponent = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({ icon, ...props }) => {
    mockErrorMessageComponent(props);

    return <div data-tid='error-message'>{icon}</div>;
});

jest.mock('frontend/components/icons/InfoCircle', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-info-circle' />,
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

const createProps = (): ISearchBarSuggestionsPopupErrorProps => ({
    errorDescription: 'errorDescription',
    errorMessage: 'errorMessage',
    hasBlockedPlaces: false,
});

let mockProps;
let mockStores;
let mockLocalStore;

describe('<SearchBarSuggestionsPopupError />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
        mockLocalStore = createMockLocalStore();
    });

    it('should render standard', () => {
        const { container } = render(<SearchBarSuggestionsPopupError {...mockProps} />);

        expect(container.firstChild).toHaveClass('sb-popup sb-popup--error');
        expect(screen.getByTestId('icon-info-circle')).toBeInTheDocument();
        expect(mockErrorMessageComponent).toHaveBeenCalledWith({
            message: mockProps.errorMessage,
            description: mockProps.errorDescription,
        });
    });

    it('should render mockErrorMessageComponent with expected props when errorMessage & errorDescription are not defined', () => {
        mockProps.errorMessage = undefined;
        mockProps.errorDescription = undefined;
        const { container } = render(<SearchBarSuggestionsPopupError {...mockProps} />);

        expect(container.firstChild).toHaveClass('sb-popup sb-popup--error');
        expect(screen.getByTestId('icon-info-circle')).toBeInTheDocument();
        expect(mockErrorMessageComponent).toHaveBeenCalledWith({
            message: mockLocalStore.fields.NoResultFoundTitle.value,
            description: mockLocalStore.fields.NoResultFoundDescription.value,
        });
    });

    it('should render mockErrorMessageComponent with expected props when hasBlockedPlaces is true', () => {
        mockProps.hasBlockedPlaces = true;
        const { container } = render(<SearchBarSuggestionsPopupError {...mockProps} />);

        expect(container.firstChild).toHaveClass('sb-popup sb-popup--error');
        expect(screen.getByTestId('icon-info-circle')).toBeInTheDocument();
        expect(mockErrorMessageComponent).toHaveBeenCalledWith({
            message: mockLocalStore.fields.DisableRouteErrorTitle.value,
            description: mockLocalStore.fields.NoResultFoundDescription.value,
        });
    });
});
