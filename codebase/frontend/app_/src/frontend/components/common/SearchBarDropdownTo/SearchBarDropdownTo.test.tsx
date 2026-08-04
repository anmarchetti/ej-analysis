import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import SearchBarDropdownTo, { ISearchBarDropdownToProps } from './SearchBarDropdownTo';

jest.mock('frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox', () =>
    jest.fn(({ children, className }) => (
        <div data-tid='scrollable-box' className={className}>
            {children}
        </div>
    )),
);

jest.mock('./components/DestinationCheckboxColumns/DestinationCheckboxColumns', () =>
    jest.fn(() => <div data-tid='destination-checkbox-columns' />),
);

const mockSearchPodFooterButtonsProps = jest.fn();
jest.mock('frontend/components/common/SearchPodFooterButtons/SearchPodFooterButtons', () => ({
    __esModule: true,
    default: props => {
        mockSearchPodFooterButtonsProps(props);

        return (
            <div data-tid='search-pod-footer-buttons'>
                <button data-tid='search-pod-footer-buttons-apply' onClick={props.onApplyClick} />
                <button data-tid='search-pod-footer-buttons-close' onClick={props.onCloseClick} />
                <button data-tid='search-pod-footer-buttons-reset' onClick={props.onClearClick} />
            </div>
        );
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMockProps = (): ISearchBarDropdownToProps => ({
    id: 'destination-dropdown',
    onClose: jest.fn(),
    isDialogRole: false,
    title: 'title',
});

let mockStores: TStores;
let mockProps: ISearchBarDropdownToProps;

describe('SearchBarDropdownTo', () => {
    beforeEach(() => {
        mockProps = resetMockProps();
        mockStores = createMockStores({
            searchStore: {
                searchTo: {
                    selectedDestinationCodes: [],
                    clearDestinations: jest.fn(),
                },
            },
        });
    });

    it('should render the dropdown with title and DestinationCheckboxColumns', () => {
        render(<SearchBarDropdownTo {...mockProps} />);

        const dropdownElement = screen.getByTestId('search-bar-dropdown-to');

        expect(dropdownElement).toBeInTheDocument();
        expect(dropdownElement).toHaveAttribute('id', mockProps.id);

        expect(screen.getByRole('heading', { name: mockProps.title, level: 2 })).toBeInTheDocument();
        expect(screen.getByTestId('destination-checkbox-columns')).toBeInTheDocument();
    });

    it('should render dropdown with aria attributes if isDialogRole is true', () => {
        mockProps.isDialogRole = true;
        render(<SearchBarDropdownTo {...mockProps} />);

        const dropdownElement = screen.getByTestId('search-bar-dropdown-to');

        expect(dropdownElement).toHaveAttribute('role', 'dialog');
        expect(dropdownElement).toHaveAttribute('aria-modal', 'true');
        expect(dropdownElement).toHaveAttribute('aria-labelledby', `${mockProps.id}-title`);
    });

    it('should call onClose when the Close button is clicked', () => {
        render(<SearchBarDropdownTo {...mockProps} />);

        fireEvent.click(screen.getByTestId('search-pod-footer-buttons-close'));

        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when the Apply button is clicked', () => {
        mockStores.searchStore.searchTo.selectedDestinationCodes = ['DUB'];
        render(<SearchBarDropdownTo {...mockProps} />);

        fireEvent.click(screen.getByTestId('search-pod-footer-buttons-apply'));

        expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isApplyButtonDisabled: false,
            }),
        );
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should disable button if selectedCodes is empty', () => {
        render(<SearchBarDropdownTo {...mockProps} />);

        expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isApplyButtonDisabled: true,
            }),
        );
    });

    it('should render SearchPodFooterButtons and pass correct props', () => {
        render(<SearchBarDropdownTo {...mockProps} />);

        expect(screen.getByTestId('search-pod-footer-buttons')).toBeInTheDocument();
        expect(screen.getByTestId('search-pod-footer-buttons-apply')).toBeInTheDocument();
        expect(screen.getByTestId('search-pod-footer-buttons-close')).toBeInTheDocument();
        expect(screen.getByTestId('search-pod-footer-buttons-reset')).toBeInTheDocument();

        expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                applyButtonLabel: SitecoreDictionary.GlobalsButtonsApply,
                clearButtonLabel: SitecoreDictionary.GlobalsLabelsClearSelection,
                isShownClearButton: false,
                onCloseClick: mockProps.onClose,
                onClearClick: mockStores.searchStore.searchTo.clearDestinations,
                isApplyButtonDisabled: true,
            }),
        );
    });
});
