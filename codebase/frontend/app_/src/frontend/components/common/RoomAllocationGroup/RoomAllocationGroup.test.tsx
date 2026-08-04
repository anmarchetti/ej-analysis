import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { SearchPodValidationFields } from 'models/data/tracking/SearchPodEvent';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { RoomAllocation } from 'models/RoomAllocation';

import RoomAllocationGroup, { IRoomAllocationProps, ROOM_ALLOCATION_GROUP_ID } from './RoomAllocationGroup';

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, dataTid }) => (
        <button data-tid={dataTid} onClick={onClick}>
            button
        </button>
    ),
}));

jest.mock('./components/ChildrenAgesSelector/ChildrenAgesSelector', () => ({
    __esModule: true,
    default: () => <div data-tid='children-ages-selector' />,
}));

const mockRoomAllocationGuestsNumberProps = jest.fn();
jest.mock('./components/RoomAllocationGuestsNumber/RoomAllocationGuestsNumber', () => ({
    __esModule: true,
    default: props => {
        mockRoomAllocationGuestsNumberProps(props);

        return (
            <div data-tid='room-allocation-guests-number'>
                <button
                    className={props.isAddDisabled ? 'disabled' : ''}
                    onClick={props.onAdd}
                >{`${props.id}_add`}</button>
                <button onClick={props.onRemove}>{`${props.id}_remove`}</button>
            </div>
        );
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): IRoomAllocationProps => ({
    room: new RoomAllocation(),
    number: 1,
    validateWhoParameters: jest.fn(() => true),
    validateChildrenAge: jest.fn(() => true),
    roomIndex: 1,
    isTotalGuestsQuantityReached: false,
    isTotalGuestsQuantityValid: true,
    isChildrenAgeValid: true,
    hideErrors: false,
    onTriggerError: jest.fn(),
    onRemove: jest.fn(),
    hideRoomLabel: false,
    isSearchBar: false,
});

let mockProps: IRoomAllocationProps;
let mockStores;

describe('RoomAllocationGroup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            trackingStore: {
                trackValidation: jest.fn(),
            },
            layoutStore: {
                isTradePortal: false,
                getSettingAsNumber: jest.fn().mockReturnValue(3),
            },
            searchStore: {
                hasErrorInField: jest.fn(),
                errorMessages: [],
                searchWho: {
                    setMaxGuestNumberError: jest.fn(),
                    setMaxGuestNumberPerRoomError: jest.fn(),
                    validateGuestQuantityPerRoom: jest.fn(),
                },
            },
        });
    });

    it('should render guests counter for adults, children, and infants', () => {
        render(<RoomAllocationGroup {...mockProps} />);

        expect(screen.getByTestId('room-allocation-group')).toHaveAttribute('id', ROOM_ALLOCATION_GROUP_ID);
        expect(screen.getAllByTestId('room-allocation-guests-number').length).toBe(3);
    });

    it('should render children ages selector', () => {
        render(<RoomAllocationGroup {...mockProps} />);

        expect(screen.getAllByTestId('children-ages-selector').length).toBe(1);
    });

    describe('showing errors', () => {
        describe('for adults', () => {
            it('should show max number of guests error', async () => {
                mockProps.isTotalGuestsQuantityReached = true;

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-adults_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockRoomAllocationGuestsNumberProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        errorMsgs: [],
                    }),
                );
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    'Adults',
                    SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML,
                );
            });

            it('should show max number of guests per room error', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-adults_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockRoomAllocationGuestsNumberProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        errorMsgs: [],
                    }),
                );
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    'Adults',
                    SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom,
                );
            });

            it('should show max number of adults error', async () => {
                mockProps.room.addAdult();

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const removeButton = screen.getByRole('button', { name: 'guest-picker-adults_remove' });
                await userEvent.click(removeButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockRoomAllocationGuestsNumberProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        errorMsgs: [SitecoreDictionary.RoomAllocationErrorsMinimumNumberOfAdultGuestsPerRoom],
                    }),
                );
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    'Adults',
                    SitecoreDictionary.RoomAllocationErrorsMinimumNumberOfAdultGuestsPerRoom,
                );
            });

            it('should show max number of infants per adult error', async () => {
                mockProps.room.addAdult();
                mockProps.room.addAdult();
                mockProps.room.addInfant();
                mockProps.room.addInfant();

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const removeButton = screen.getByRole('button', { name: 'guest-picker-adults_remove' });
                await userEvent.click(removeButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockRoomAllocationGuestsNumberProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        errorMsgs: [SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfInfantGuestsPerAdultGuest],
                    }),
                );
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    'Adults',
                    SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfInfantGuestsPerAdultGuest,
                );
            });

            it('should call setMaxGuestNumberError each time when guests exceed limit', async () => {
                mockProps.isTotalGuestsQuantityReached = true;

                render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-adults_add' });
                await userEvent.click(addButton);
                await userEvent.click(addButton);

                expect(mockStores.searchStore.searchWho.setMaxGuestNumberError).toHaveBeenCalledTimes(2);
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledTimes(2);
            });

            it('should call trackValidation with MaxPAX field and RoomAllocationErrorsMaximumNumberOfGuestsHTML when isSearchBar is true', async () => {
                mockProps.isTotalGuestsQuantityReached = true;
                mockProps.isSearchBar = true;

                render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-adults_add' });
                await userEvent.click(addButton);

                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    SearchPodValidationFields.MaxPAX,
                    SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML,
                );
            });

            it('should track with MaxPAX field and RoomAllocationErrorsMaxNumberOfGuestsPerRoom when isSearchBar is true and per room limit exceeded', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
                mockProps.isSearchBar = true;

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-adults_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    SearchPodValidationFields.MaxPAX,
                    SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom,
                );
            });

            it('should call setMaxGuestNumberPerRoomError when per room guest limit is exceeded', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-adults_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockStores.searchStore.searchWho.setMaxGuestNumberPerRoomError).toHaveBeenCalled();
                expect(mockStores.searchStore.searchWho.setMaxGuestNumberError).not.toHaveBeenCalled();
            });

            it('should add adult and not call any error when per room limit is exceeded but isGroupBooking is true', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
                mockProps.isGroupBooking = true;
                mockProps.room.addAdult = jest.fn();

                render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-adults_add' });
                await userEvent.click(addButton);

                expect(mockProps.room.addAdult).toHaveBeenCalled();
                expect(mockStores.searchStore.searchWho.setMaxGuestNumberError).not.toHaveBeenCalled();
                expect(mockStores.searchStore.searchWho.setMaxGuestNumberPerRoomError).not.toHaveBeenCalled();
            });
        });

        describe('for children', () => {
            it('should show max number of guests error', async () => {
                mockProps.isTotalGuestsQuantityReached = true;

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-children_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockRoomAllocationGuestsNumberProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        errorMsgs: [],
                    }),
                );
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    'Children',
                    SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML,
                );
            });

            it('should show max number of guests per room error', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-children_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockRoomAllocationGuestsNumberProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        errorMsgs: [],
                    }),
                );
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    'Children',
                    SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom,
                );
            });

            it('should call setMaxGuestNumberError each time when guests exceed limit', async () => {
                mockProps.isTotalGuestsQuantityReached = true;

                render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-children_add' });
                await userEvent.click(addButton);
                await userEvent.click(addButton);

                expect(mockStores.searchStore.searchWho.setMaxGuestNumberError).toHaveBeenCalledTimes(2);
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledTimes(2);
            });

            it('should call trackValidation with MaxPAX field and RoomAllocationErrorsMaximumNumberOfGuestsHTML when isSearchBar is true', async () => {
                mockProps.isTotalGuestsQuantityReached = true;
                mockProps.isSearchBar = true;

                render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-children_add' });
                await userEvent.click(addButton);

                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    SearchPodValidationFields.MaxPAX,
                    SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML,
                );
            });

            it('should track with MaxPAX field and RoomAllocationErrorsMaxNumberOfGuestsPerRoom when isSearchBar is true and per room limit exceeded', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
                mockProps.isSearchBar = true;

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-children_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    SearchPodValidationFields.MaxPAX,
                    SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom,
                );
            });

            it('should call setMaxGuestNumberPerRoomError when per room guest limit is exceeded', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-children_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockStores.searchStore.searchWho.setMaxGuestNumberPerRoomError).toHaveBeenCalled();
                expect(mockStores.searchStore.searchWho.setMaxGuestNumberError).not.toHaveBeenCalled();
            });

            it('should add child and not call any error when per room limit is exceeded but isGroupBooking is true', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
                mockProps.isGroupBooking = true;
                mockProps.room.addChild = jest.fn();

                render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-children_add' });
                await userEvent.click(addButton);

                expect(mockProps.room.addChild).toHaveBeenCalled();
                expect(mockStores.searchStore.searchWho.setMaxGuestNumberError).not.toHaveBeenCalled();
                expect(mockStores.searchStore.searchWho.setMaxGuestNumberPerRoomError).not.toHaveBeenCalled();
            });
        });

        describe('for infant', () => {
            it('should show max number of guest error', async () => {
                mockProps.isTotalGuestsQuantityReached = true;

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-infants_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockRoomAllocationGuestsNumberProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        errorMsgs: [],
                    }),
                );
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    'Infants',
                    SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML,
                );
            });

            it('should show max number of guests per room error', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-infants_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockRoomAllocationGuestsNumberProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        errorMsgs: [],
                    }),
                );
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    'Infants',
                    SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom,
                );
            });

            it('should show max number of infants per adult error', async () => {
                mockProps.room.addAdult();
                mockProps.room.addInfant();

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-infants_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockRoomAllocationGuestsNumberProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        errorMsgs: [SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfInfantGuestsPerAdultGuest],
                    }),
                );
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    'Infants',
                    SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfInfantGuestsPerAdultGuest,
                );
            });

            it('should call setMaxGuestNumberError each time when guests exceed limit', async () => {
                mockProps.isTotalGuestsQuantityReached = true;

                render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-infants_add' });
                await userEvent.click(addButton);
                await userEvent.click(addButton);

                expect(mockStores.searchStore.searchWho.setMaxGuestNumberError).toHaveBeenCalledTimes(2);
                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledTimes(2);
            });

            it('should call trackValidation with MaxPAX field and RoomAllocationErrorsMaximumNumberOfGuestsHTML when isSearchBar is true and guests exceed limit', async () => {
                mockProps.isTotalGuestsQuantityReached = true;
                mockProps.isSearchBar = true;

                render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-infants_add' });
                await userEvent.click(addButton);

                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    SearchPodValidationFields.MaxPAX,
                    SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfGuestsHTML,
                );
            });

            it('should track with MaxPAX field and RoomAllocationErrorsMaxNumberOfGuestsPerRoom when isSearchBar is true and per room limit exceeded', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
                mockProps.isSearchBar = true;

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-infants_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    SearchPodValidationFields.MaxPAX,
                    SitecoreDictionary.RoomAllocationErrorsMaxNumberOfGuestsPerRoom,
                );
            });

            it('should call trackValidation with specific field if isSearchBar is true and infants per adult error appears', async () => {
                mockProps.isSearchBar = true;
                mockProps.room.addAdult();
                mockProps.room.addInfant();

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-infants_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockRoomAllocationGuestsNumberProps).toHaveBeenCalledWith(
                    expect.objectContaining({
                        errorMsgs: [SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfInfantGuestsPerAdultGuest],
                    }),
                );

                expect(mockStores.trackingStore.trackValidation).toHaveBeenCalledWith(
                    SearchPodValidationFields.MaxInfantsPerAdult,
                    SitecoreDictionary.RoomAllocationErrorsMaximumNumberOfInfantGuestsPerAdultGuest,
                );
            });

            it('should call setMaxGuestNumberPerRoomError when per room guest limit is exceeded', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);

                const { rerender } = render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-infants_add' });
                await userEvent.click(addButton);

                rerender(<RoomAllocationGroup {...mockProps} />);

                expect(mockStores.searchStore.searchWho.setMaxGuestNumberPerRoomError).toHaveBeenCalled();
                expect(mockStores.searchStore.searchWho.setMaxGuestNumberError).not.toHaveBeenCalled();
            });

            it('should add infant and not call any error when per room limit is exceeded but isGroupBooking is true', async () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
                mockProps.isGroupBooking = true;
                mockProps.room.addAdult();
                mockProps.room.addInfant = jest.fn();

                render(<RoomAllocationGroup {...mockProps} />);

                const addButton = screen.getByRole('button', { name: 'guest-picker-infants_add' });
                await userEvent.click(addButton);

                expect(mockProps.room.addInfant).toHaveBeenCalled();
                expect(mockStores.searchStore.searchWho.setMaxGuestNumberError).not.toHaveBeenCalled();
                expect(mockStores.searchStore.searchWho.setMaxGuestNumberPerRoomError).not.toHaveBeenCalled();
            });
        });
    });

    describe('additional classes', () => {
        it('should add isPaxMixPopup on pax mix popup', () => {
            mockProps.isPaxMixPopup = true;

            render(<RoomAllocationGroup {...mockProps} />);

            expect(screen.getByTestId('room-allocation-group')).toHaveClass('paxMixPopup');
        });

        it('should add groupBooking on group booking', () => {
            mockProps.isGroupBooking = true;

            render(<RoomAllocationGroup {...mockProps} />);

            expect(screen.getByTestId('room-allocation-group')).toHaveClass('groupBooking');
        });
    });

    it('should remove adult', async () => {
        mockProps.room.addAdult();
        mockProps.room.addAdult();
        mockProps.room.removeAdult = jest.fn();

        render(<RoomAllocationGroup {...mockProps} />);

        const removeButton = screen.getByRole('button', { name: 'guest-picker-adults_remove' });
        await userEvent.click(removeButton);

        expect(mockProps.room.removeAdult).toHaveBeenCalled();
    });

    it('should remove one of the child with invalid age for left one', async () => {
        mockProps.isChildrenAgeValid = false;
        mockProps.room.addAdult();
        mockProps.room.addChild();
        mockProps.room.addChild();
        mockProps.room.removeChild = jest.fn();

        render(<RoomAllocationGroup {...mockProps} />);

        const removeButton = screen.getByRole('button', { name: 'guest-picker-children_remove' });
        await userEvent.click(removeButton);

        expect(mockProps.room.removeChild).toHaveBeenCalled();
        expect(mockProps.onTriggerError).toHaveBeenCalledWith(-1);
        expect(mockProps.validateWhoParameters).toHaveBeenCalled();
        expect(mockProps.validateChildrenAge).toHaveBeenCalled();
    });

    it('should remove child', async () => {
        mockProps.room.addAdult();
        mockProps.room.addChild();
        mockProps.room.removeChild = jest.fn();

        render(<RoomAllocationGroup {...mockProps} />);

        const removeButton = screen.getByRole('button', { name: 'guest-picker-children_remove' });
        await userEvent.click(removeButton);

        expect(mockProps.room.removeChild).toHaveBeenCalled();
        expect(mockProps.onTriggerError).toHaveBeenCalledWith(-1);
        expect(mockProps.validateWhoParameters).toHaveBeenCalled();
        expect(mockProps.validateChildrenAge).not.toHaveBeenCalled();
    });

    it('should remove infant and validate child age', async () => {
        mockProps.isChildrenAgeValid = false;
        mockProps.room.addAdult();
        mockProps.room.addChild();
        mockProps.room.addInfant();
        mockProps.room.removeInfant = jest.fn();

        render(<RoomAllocationGroup {...mockProps} />);

        const removeButton = screen.getByRole('button', { name: 'guest-picker-infants_remove' });
        await userEvent.click(removeButton);

        expect(mockProps.room.removeInfant).toHaveBeenCalled();
        expect(mockProps.onTriggerError).toHaveBeenCalledWith(-1);
        expect(mockProps.validateWhoParameters).toHaveBeenCalled();
        expect(mockProps.validateChildrenAge).toHaveBeenCalled();
    });

    it('should remove infant', async () => {
        mockProps.room.addAdult();
        mockProps.room.addInfant();
        mockProps.room.removeInfant = jest.fn();

        render(<RoomAllocationGroup {...mockProps} />);

        const removeButton = screen.getByRole('button', { name: 'guest-picker-infants_remove' });
        await userEvent.click(removeButton);

        expect(mockProps.room.removeInfant).toHaveBeenCalled();
        expect(mockProps.onTriggerError).toHaveBeenCalledWith(-1);
        expect(mockProps.validateWhoParameters).toHaveBeenCalled();
        expect(mockProps.validateChildrenAge).not.toHaveBeenCalled();
    });

    it('should remove room', () => {
        render(<RoomAllocationGroup {...mockProps} />);

        fireEvent.click(screen.getByTestId('remove-room'));

        expect(mockProps.onRemove).toHaveBeenCalled();
    });

    it('should not render remove room button when hideRoomLabel is true', () => {
        mockProps.hideRoomLabel = true;

        render(<RoomAllocationGroup {...mockProps} />);

        expect(screen.queryByTestId('remove-room')).not.toBeInTheDocument();
    });

    describe('add person', () => {
        it('should add adult', async () => {
            mockProps.room.addAdult = jest.fn();
            render(<RoomAllocationGroup {...mockProps} />);

            const addButton = screen.getByRole('button', { name: 'guest-picker-adults_add' });
            await userEvent.click(addButton);

            expect(mockProps.room.addAdult).toHaveBeenCalled();
        });

        it('should add child', async () => {
            mockProps.room.addChild = jest.fn();
            render(<RoomAllocationGroup {...mockProps} />);

            const addButton = screen.getByRole('button', { name: 'guest-picker-children_add' });
            await userEvent.click(addButton);

            expect(mockProps.room.addChild).toHaveBeenCalled();
        });

        it('should add infant', async () => {
            mockProps.room.addAdult();
            mockProps.room.addInfant = jest.fn();
            render(<RoomAllocationGroup {...mockProps} />);

            const addButton = screen.getByRole('button', { name: 'guest-picker-infants_add' });
            await userEvent.click(addButton);

            expect(mockProps.room.addInfant).toHaveBeenCalled();
        });

        it('should not add adult when per room guest limit is exceeded', async () => {
            mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
            mockProps.room.addAdult = jest.fn();

            render(<RoomAllocationGroup {...mockProps} />);

            const addButton = screen.getByRole('button', { name: 'guest-picker-adults_add' });
            await userEvent.click(addButton);

            expect(mockProps.room.addAdult).not.toHaveBeenCalled();
        });

        it('should not add child when per room guest limit is exceeded', async () => {
            mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
            mockProps.room.addChild = jest.fn();

            render(<RoomAllocationGroup {...mockProps} />);

            const addButton = screen.getByRole('button', { name: 'guest-picker-children_add' });
            await userEvent.click(addButton);

            expect(mockProps.room.addChild).not.toHaveBeenCalled();
        });

        it('should not add infant when per room guest limit is exceeded', async () => {
            mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
            mockProps.room.addInfant = jest.fn();

            render(<RoomAllocationGroup {...mockProps} />);

            const addButton = screen.getByRole('button', { name: 'guest-picker-infants_add' });
            await userEvent.click(addButton);

            expect(mockProps.room.addInfant).not.toHaveBeenCalled();
        });

        describe('GroupBooking', () => {
            it('should disable adult add button when maximum number of adults is reached', () => {
                mockProps.room.addAdult();
                mockProps.room.addAdult();
                mockProps.room.addAdult();

                render(<RoomAllocationGroup {...mockProps} />);

                screen.logTestingPlaygroundURL();
                expect(screen.getByRole('button', { name: 'guest-picker-adults_add' })).toHaveClass('disabled');
            });

            it('should enable adult add button when maximum number of adults is not reached', () => {
                mockProps.room.addAdult();

                render(<RoomAllocationGroup {...mockProps} />);

                expect(screen.getByRole('button', { name: 'guest-picker-adults_add' })).not.toHaveClass('disabled');
            });

            it('should disable children add button when maximum number of children is reached', () => {
                mockProps.room.addChild();
                mockProps.room.addChild();
                mockProps.room.addChild();

                render(<RoomAllocationGroup {...mockProps} />);

                expect(screen.getByRole('button', { name: 'guest-picker-children_add' })).toHaveClass('disabled');
            });

            it('should enable children add button when maximum number of children is not reached', () => {
                mockProps.room.addChild();

                render(<RoomAllocationGroup {...mockProps} />);

                expect(screen.getByRole('button', { name: 'guest-picker-children_add' })).not.toHaveClass('disabled');
            });

            it('should disable adult add button when per room guest limit is exceeded', () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);

                render(<RoomAllocationGroup {...mockProps} />);

                expect(screen.getByRole('button', { name: 'guest-picker-adults_add' })).toHaveClass('disabled');
            });

            it('should not disable adult add button when per room guest limit is exceeded but isGroupBooking is true', () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
                mockProps.isGroupBooking = true;

                render(<RoomAllocationGroup {...mockProps} />);

                expect(screen.getByRole('button', { name: 'guest-picker-adults_add' })).not.toHaveClass('disabled');
            });

            it('should disable children add button when per room guest limit is exceeded', () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);

                render(<RoomAllocationGroup {...mockProps} />);

                expect(screen.getByRole('button', { name: 'guest-picker-children_add' })).toHaveClass('disabled');
            });

            it('should not disable children add button when per room guest limit is exceeded but isGroupBooking is true', () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
                mockProps.isGroupBooking = true;

                render(<RoomAllocationGroup {...mockProps} />);

                expect(screen.getByRole('button', { name: 'guest-picker-children_add' })).not.toHaveClass('disabled');
            });

            it('should disable infants add button when per room guest limit is exceeded', () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);

                render(<RoomAllocationGroup {...mockProps} />);

                expect(screen.getByRole('button', { name: 'guest-picker-infants_add' })).toHaveClass('disabled');
            });

            it('should not disable infants add button when per room guest limit is exceeded but isGroupBooking is true', () => {
                mockStores.searchStore.searchWho.validateGuestQuantityPerRoom.mockReturnValue(true);
                mockProps.isGroupBooking = true;
                mockProps.room.addAdult();

                render(<RoomAllocationGroup {...mockProps} />);

                expect(screen.getByRole('button', { name: 'guest-picker-infants_add' })).not.toHaveClass('disabled');
            });
        });
    });
});
