import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IPopupSearchPodProps, PopupSearchPod } from './PopupSearchPod';

const mockDateViewDropdownComponent = jest.fn();
jest.mock(
    'frontend/components/common/SearchBarDropdownWhen/components/DateViewDropdown/DateViewDropdown',
    () => props => {
        mockDateViewDropdownComponent(props);

        return <div data-tid='search-bard-dropdown-when' />;
    },
);

const mockSearchBarDropdownWhoComponent = jest.fn();
jest.mock('frontend/components/common/SearchBarDropdownWho/SearchBarDropdownWho', () => props => {
    mockSearchBarDropdownWhoComponent(props);

    return (
        <div data-tid='search-bard-dropdown-who'>
            <button data-tid='apply-button' onClick={props.onApply} />
        </div>
    );
});

const mockPopupComponent = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    Popup: props => {
        mockPopupComponent(props);

        return <div data-tid='popup'>{props.children}</div>;
    },
}));

jest.mock('./SearchBarInput/SearchBarInput', () => ({ id, toggleFocus }) => (
    <input data-tid={id} onClick={() => toggleFocus(true)} />
));

let mocks;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PopupSearchPod />', () => {
    const resetMocks = (): IPopupSearchPodProps => ({
        whenValue: 'whenValue',
        whoValue: 'whoValue',
        isPopupOpen: true,
        activeField: SearchBarDropdown.To,
        dates: [],
        isFlexible: false,
        availableDates: [],
        isApplyDisabled: false,
        rooms: [],
        errorMessages: null,
        togglePopup: jest.fn(),
        setActiveField: jest.fn(),
        isError: jest.fn(),
        onClearDates: jest.fn(),
        closePopup: jest.fn(),
        onSubmitSearch: jest.fn(),
        onClearRoomClick: jest.fn(),
        flexDays: 0,
        isGuestsParametersValid: true,
        validateChildrenAge: jest.fn(),
        validateWhenParameters: jest.fn(),
    });

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    it('should render', () => {
        render(<PopupSearchPod {...mocks} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
    });

    it('should NOT render if popup is not opened', () => {
        mocks.isPopupOpen = false;

        render(<PopupSearchPod {...mocks} />);

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
    });

    it('should add .search-bar-box if is not submitted', () => {
        const { container } = render(<PopupSearchPod {...mocks} />);

        expect(container.querySelector('.search-bar-box')).toBeInTheDocument();
    });

    it('should show SearchBarDropdownWho', () => {
        mocks.activeField = SearchBarDropdown.Who;

        render(<PopupSearchPod {...mocks} />);

        expect(screen.getByTestId('search-bard-dropdown-who')).toBeInTheDocument();
        expect(screen.queryByTestId('search-bard-dropdown-when')).not.toBeInTheDocument();
    });

    it('should show DateViewDropdown', () => {
        mocks.activeField = SearchBarDropdown.When;

        render(<PopupSearchPod {...mocks} />);

        expect(screen.getByTestId('search-bard-dropdown-when')).toBeInTheDocument();
        expect(screen.queryByTestId('search-bard-dropdown-who')).not.toBeInTheDocument();
    });

    it('should pass errorMessage to DateViewDropdown component', () => {
        const errorText = 'error';
        mocks.errorMessages = {
            key: SearchBarDropdown.When,
            message: errorText,
        };
        mocks.activeField = SearchBarDropdown.When;

        render(<PopupSearchPod {...mocks} />);

        expect(mockDateViewDropdownComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                errorMessage: errorText,
            }),
        );
        expect(screen.getByTestId('search-bard-dropdown-when')).toBeInTheDocument();
    });

    it('should pass applyBtnText as SitecoreDictionary.GlobalsButtonsNext to SearchBarDropdownWho', () => {
        mocks.activeField = SearchBarDropdown.Who;
        render(<PopupSearchPod {...mocks} />);

        expect(mockSearchBarDropdownWhoComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                applyBtnText: SitecoreDictionary.GlobalsButtonsNext,
            }),
        );
        expect(screen.getByTestId('search-bard-dropdown-who')).toBeInTheDocument();
    });

    it('should focus DateViewDropdown on apply button click when SearchBarDropdownWho shown', async () => {
        mocks.activeField = SearchBarDropdown.Who;

        render(<PopupSearchPod {...mocks} />);
        const applyButton = screen.getByTestId('apply-button');

        await applyButton.click();

        expect(mocks.setActiveField).toHaveBeenCalledWith(SearchBarDropdown.When);
    });

    it('should call validateWhenParameters when user click on who input while when is active input', () => {
        mocks.activeField = SearchBarDropdown.When;
        render(<PopupSearchPod {...mocks} />);

        fireEvent.click(screen.getByTestId('search-who'));

        expect(mocks.validateWhenParameters).toHaveBeenCalledWith(false);
    });

    it('should call validateChildrenAge when user click on when input while who is active input', () => {
        mocks.activeField = SearchBarDropdown.Who;
        render(<PopupSearchPod {...mocks} />);

        fireEvent.click(screen.getByTestId('search-when'));

        expect(mocks.validateChildrenAge).toHaveBeenCalled();
    });

    it('should not call validateWhenParameters when user click on who input while who is active input', () => {
        mocks.activeField = SearchBarDropdown.Who;
        render(<PopupSearchPod {...mocks} />);

        fireEvent.click(screen.getByTestId('search-who'));

        expect(mocks.validateWhenParameters).not.toHaveBeenCalled();
    });

    it('should not call validateChildrenAge when user click on when input while when is active input', () => {
        mocks.activeField = SearchBarDropdown.When;
        render(<PopupSearchPod {...mocks} />);

        fireEvent.click(screen.getByTestId('search-when'));

        expect(mocks.validateChildrenAge).not.toHaveBeenCalled();
    });
});
