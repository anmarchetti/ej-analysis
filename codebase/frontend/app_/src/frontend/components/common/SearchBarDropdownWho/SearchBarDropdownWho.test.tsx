import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { TStores } from 'frontend/store/IStores';
import * as uiUtils from 'frontend/utils/ui.utils';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { RoomAllocation } from 'models/RoomAllocation';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

import SearchBarDropdownWho, { ISearchBarDropdownWhoProps } from './SearchBarDropdownWho';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

jest.mock('frontend/components/common/NumberOfRoomSelector/NumberOfRoomSelector', () => props => (
    <div data-tid='number-room-selector' onClick={() => props.onChange({ value: 4, label: 4 })} />
));

const mockRoomAllocationGroupProps = jest.fn();
jest.mock('frontend/components/common/RoomAllocationGroup/RoomAllocationGroup', () => props => {
    mockRoomAllocationGroupProps(props);

    return (
        <div data-tid='room-allocation-group' onClick={() => props.onTriggerError(0)}>
            <div className='error-message' />
        </div>
    );
});

jest.mock('frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox', () => {
    const { forwardRef } = jest.requireActual('react');

    return forwardRef((props: any, ref: any) => (
        <div data-tid='search-bar-dropdown-scrollable-box' ref={ref}>
            {props.children}
        </div>
    ));
});

const mockSearchPodFooterButtonsProps = jest.fn();
jest.mock('frontend/components/common/SearchPodFooterButtons/SearchPodFooterButtons', () => ({
    __esModule: true,
    default: ({ onApplyClick, onCloseClick, onClearClick, ...props }) => {
        mockSearchPodFooterButtonsProps(props);

        return (
            <div data-tid='search-pod-footer-buttons'>
                <button data-tid='search-pod-footer-buttons-apply' onClick={onApplyClick} />
                <button data-tid='search-pod-footer-buttons-close' onClick={onCloseClick} />
                <button data-tid='search-pod-footer-buttons-reset' onClick={onClearClick} />
            </div>
        );
    },
}));

jest.mock('frontend/components/common/SearchBarFieldErrorMessage/SearchBarFieldErrorMessage', () => ({
    __esModule: true,
    default: () => <div data-tid='field-error-message' />,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const scrollableWrapper = document.createElement('div');
scrollableWrapper.setAttribute('data-tid', 'search-bar-dropdown-scrollable-box');

const allocationGroups = document.createElement('div');
allocationGroups.setAttribute('data-tid', 'room-allocation-group');
scrollableWrapper.appendChild(allocationGroups);

const errorElement = document.createElement('div');
errorElement.className = 'error-message';
allocationGroups.appendChild(errorElement);

const createProps = (): ISearchBarDropdownWhoProps => ({
    isPromoViewForWhoField: false,
    onApply: jest.fn(),
    onClearRoom: jest.fn(),
    onClose: jest.fn(),
    rooms: [],
    ignoreValidationOnClose: false,
    isDialogRole: true,
});

let mockProps;
let mockStores: TStores;
let mockLocalStore;

describe('<SearchBarDropdownWho />', () => {
    jest.useFakeTimers();

    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            searchStore: {
                searchWho: {
                    isTotalGuestsQuantityReached: false,
                    isTotalGuestQuantityValid: true,
                    isChildrenAgeValid: true,
                    onChangeRooms: jest.fn().mockReturnValue(true),
                    onRemoveRoom: jest.fn(),
                    isDefaultNumberGuestsInRooms: false,
                    validateChildrenAge: jest.fn().mockReturnValue(true),
                    isGuestsParametersValid: false,
                },
                validateWhoParameters: jest.fn().mockReturnValue(false),
                errorMessages: null,
                hasErrorInField: jest.fn(),
                setSeachPerformWithNewParams: jest.fn(),
                clearErrorMessage: jest.fn(),
            },
            layoutStore: {
                isPromoPage: false,
            },
            trackingStore: {
                trackValidation: jest.fn(),
            },
        });
        mockUseMobileViewport = false;
        mockLocalStore = createMockLocalStore();
    });

    it('should render with default props', () => {
        render(<SearchBarDropdownWho {...mockProps} />);

        expect(screen.getByTestId('number-room-selector')).toBeInTheDocument();
        expect(screen.getByTestId('search-bar-dropdown-scrollable-box')).toBeInTheDocument();
        expect(screen.getByTestId('field-error-message')).toBeInTheDocument();
        expect(screen.getByTestId('rooms-section-title-text')).toHaveTextContent(
            mockLocalStore.fields.WhoDropdownRoomsLabel.value,
        );
        expect(screen.getByTestId('guests-section-title-text')).toHaveTextContent(
            mockLocalStore.fields.WhoDropdownGuestsLabel.value,
        );
        expect(screen.getByTestId('guests-section-title-text')).toHaveTextContent(
            mockLocalStore.fields.WhoDropdownGuestsLimitLabel.value,
        );
        expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                applyButtonLabel: SitecoreDictionary.GlobalsButtonsApply,
                clearButtonLabel: mockLocalStore.fields.ResetToDefaultLabel.value,
                isShownClearButton: !mockStores.searchStore.searchWho.isDefaultNumberGuestsInRooms,
                isApplyButtonDisabled: !mockStores.searchStore.searchWho.isGuestsParametersValid,
                fieldName: SearchBarDropdown.Who,
            }),
        );
    });

    it('should use default label when local store fields are empty on promo page', () => {
        mockLocalStore.fields = {};

        render(<SearchBarDropdownWho {...mockProps} />);

        expect(screen.getByTestId('rooms-section-title-text')).toHaveTextContent(
            SitecoreDictionary.SearchPodLabelsWhoDropdownRooms,
        );
        expect(screen.getByTestId('guests-section-title-text')).toHaveTextContent(
            SitecoreDictionary.SearchPodLabelsWhoDropdownGuests,
        );
        expect(screen.getByTestId('guests-section-title-text')).toHaveTextContent(
            SitecoreDictionary.SearchPodLabelsWhoDropdownGuestsLimit,
        );
        expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                clearButtonLabel: SitecoreDictionary.SearchPodButtonsClearWhoSelection,
            }),
        );
    });

    describe('aria attributes', () => {
        it('should add ariaAttributes when isDialogRole is true', () => {
            render(<SearchBarDropdownWho {...mockProps} />);

            expect(screen.getByTestId('search-bar-dropdown-who')).toHaveAttribute('role', 'dialog');
            expect(screen.getByTestId('search-bar-dropdown-who')).toHaveAttribute('aria-modal', 'true');
            expect(screen.getByTestId('search-bar-dropdown-who')).toHaveAttribute(
                'aria-labelledby',
                'search-who-dd-title',
            );
        });

        it('should NOT add ariaAttributes when isDialogRole is false', () => {
            mockProps.isDialogRole = false;
            render(<SearchBarDropdownWho {...mockProps} />);

            expect(screen.getByTestId('search-bar-dropdown-who')).not.toHaveAttribute('role', 'dialog');
            expect(screen.getByTestId('search-bar-dropdown-who')).not.toHaveAttribute('aria-modal', 'true');
            expect(screen.getByTestId('search-bar-dropdown-who')).not.toHaveAttribute(
                'aria-labelledby',
                'search-who-dd-title',
            );
        });
    });

    it('should render button with applyBtnText when prop is defined', () => {
        mockProps.applyBtnText = 'applyBtnText';
        render(<SearchBarDropdownWho {...mockProps} />);

        expect(mockSearchPodFooterButtonsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                applyButtonLabel: mockProps.applyBtnText,
            }),
        );
    });

    it('should set currentInvalidRoomIndex -1 and call trackValidation when guests count and ages are not valid valid after change count of rooms', () => {
        mockProps.rooms = [new RoomAllocation()];
        mockStores.searchStore.searchWho.onChangeRooms = jest.fn().mockReturnValue(false);
        render(<SearchBarDropdownWho {...mockProps} />);

        fireEvent.click(screen.getByTestId('room-allocation-group'));

        expect(mockRoomAllocationGroupProps).toHaveBeenCalledWith(expect.objectContaining({ hideErrors: false }));

        fireEvent.click(screen.getByTestId('number-room-selector'));

        expect(mockStores.searchStore.searchWho.onChangeRooms).toHaveBeenCalledWith(4);
        expect(mockStores.trackingStore.trackValidation).toHaveBeenCalled();
        expect(mockRoomAllocationGroupProps).toHaveBeenCalledWith(expect.objectContaining({ hideErrors: true }));
    });

    it('should NOT set currentInvalidRoomIndex -1 and NOT call trackValidation when guests count and ages valid after change count of rooms', () => {
        mockProps.rooms = [new RoomAllocation()];
        render(<SearchBarDropdownWho {...mockProps} />);

        fireEvent.click(screen.getByTestId('room-allocation-group'));

        expect(mockRoomAllocationGroupProps).toHaveBeenCalledWith(expect.objectContaining({ hideErrors: false }));

        fireEvent.click(screen.getByTestId('number-room-selector'));

        expect(mockStores.searchStore.searchWho.onChangeRooms).toHaveBeenCalledWith(4);
        expect(mockStores.trackingStore.trackValidation).not.toHaveBeenCalled();
        expect(mockRoomAllocationGroupProps).toHaveBeenCalledWith(expect.objectContaining({ hideErrors: false }));
    });

    describe('onApply', () => {
        it('should call onApply when clicked', () => {
            render(<SearchBarDropdownWho {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-footer-buttons-apply'));

            expect(mockProps.onApply).toHaveBeenCalled();
        });

        it('should call setSearchPerformWithNewParams on Promo page', () => {
            Object.defineProperty(mockStores.layoutStore, 'isPromoPage', { value: true });
            render(<SearchBarDropdownWho {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-footer-buttons-apply'));

            expect(mockStores.searchStore.setSeachPerformWithNewParams).toHaveBeenCalledWith(true);
        });

        it('should scroll to error on mobile when child age is not valid', () => {
            mockProps.rooms = [new RoomAllocation()];
            mockStores.searchStore.searchWho.validateChildrenAge = jest.fn().mockReturnValue(false);
            mockStores.searchStore.validateWhoParameters = jest.fn().mockReturnValue(true);
            mockUseMobileViewport = true;
            const spyOnscrollParentToChild = jest.spyOn(uiUtils, 'scrollParentToChild').mockImplementation(jest.fn());

            const { container } = render(<SearchBarDropdownWho {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-footer-buttons-apply'));

            jest.runAllTimers();

            const firstElement = container.firstChild;
            expect(spyOnscrollParentToChild).toHaveBeenCalledWith(firstElement, errorElement);
        });
    });

    describe('onClose', () => {
        it('should call onClose when clicked', () => {
            render(<SearchBarDropdownWho {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-footer-buttons-close'));

            expect(mockProps.onClose).toHaveBeenCalled();
        });

        it('should scroll to error on desktop when child age is not valid', () => {
            mockProps.rooms = [new RoomAllocation()];
            mockStores.searchStore.searchWho.validateChildrenAge = jest.fn().mockReturnValue(false);
            mockStores.searchStore.validateWhoParameters = jest.fn().mockReturnValue(true);
            const spyOnscrollParentToChild = jest.spyOn(uiUtils, 'scrollParentToChild').mockImplementation(jest.fn());
            render(<SearchBarDropdownWho {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-footer-buttons-close'));

            jest.runAllTimers();

            expect(spyOnscrollParentToChild).toHaveBeenCalledWith(scrollableWrapper, errorElement);
        });

        it('should call onClose on desktop when child age is not valid but ignoreValidationOnClose is true', () => {
            mockProps.rooms = [new RoomAllocation()];
            mockStores.searchStore.searchWho.validateChildrenAge = jest.fn().mockReturnValue(false);
            mockStores.searchStore.validateWhoParameters = jest.fn().mockReturnValue(true);
            mockProps.ignoreValidationOnClose = true;

            render(<SearchBarDropdownWho {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-footer-buttons-close'));

            expect(mockProps.onClose).toHaveBeenCalled();
        });

        it('should scroll to error on mobile when child age is not valid', () => {
            mockProps.rooms = [new RoomAllocation()];
            mockStores.searchStore.searchWho.validateChildrenAge = jest.fn().mockReturnValue(false);
            mockStores.searchStore.validateWhoParameters = jest.fn().mockReturnValue(true);
            mockUseMobileViewport = true;
            const spyOnscrollParentToChild = jest.spyOn(uiUtils, 'scrollParentToChild').mockImplementation(jest.fn());

            const { container } = render(<SearchBarDropdownWho {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-footer-buttons-close'));

            jest.runAllTimers();

            const firstElement = container.firstChild;
            expect(spyOnscrollParentToChild).toHaveBeenCalledWith(firstElement, errorElement);
        });

        it('should call onClose on mobile when child age is not valid but ignoreValidationOnClose is true', () => {
            mockProps.rooms = [new RoomAllocation()];
            mockStores.searchStore.searchWho.validateChildrenAge = jest.fn().mockReturnValue(false);
            mockStores.searchStore.validateWhoParameters = jest.fn().mockReturnValue(true);
            mockProps.ignoreValidationOnClose = true;
            mockUseMobileViewport = true;

            render(<SearchBarDropdownWho {...mockProps} />);

            fireEvent.click(screen.getByTestId('search-pod-footer-buttons-close'));

            expect(mockProps.onClose).toHaveBeenCalled();
        });
    });

    it('should call onClearRoom and reset currentInvalidRoomIndex to -1', () => {
        mockProps.rooms = [new RoomAllocation()];
        render(<SearchBarDropdownWho {...mockProps} />);

        fireEvent.click(screen.getByTestId('room-allocation-group'));

        expect(mockRoomAllocationGroupProps).toHaveBeenCalledWith(expect.objectContaining({ hideErrors: false }));

        fireEvent.click(screen.getByTestId('search-pod-footer-buttons-reset'));

        expect(mockProps.onClearRoom).toHaveBeenCalled();
        expect(mockRoomAllocationGroupProps).toHaveBeenCalledWith(expect.objectContaining({ hideErrors: true }));
    });

    it('should render RoomAllocationGroup', () => {
        mockProps.rooms = [new RoomAllocation()];

        render(<SearchBarDropdownWho {...mockProps} />);

        expect(screen.getByTestId('room-allocation-group')).toBeInTheDocument();
    });
});
