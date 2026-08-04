import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SiteSettings from 'models/enum/SiteSettings';
import { RoomAllocation } from 'models/RoomAllocation';
import { mockFields } from 'frontend/components/renderings/TradePortalGroupBooking/__mocks__/tradePortalGroupBookingFields';

import GroupBookingCustomersInfo from './GroupBookingCustomersInfo';

jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    ...jest.requireActual('frontend/components/common/ImageWithFilter/ImageWithFilter'),
    __esModule: true,
    default: ({ imageSrc }) => <img data-tid='icon' src={imageSrc} alt='' />,
}));

jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: ({ message }) => <div>{message}</div>,
}));

jest.mock('frontend/components/common/NumberOfRoomSelector/NumberOfRoomSelector', () => ({
    __esModule: true,
    default: ({ onChange }) => (
        <select data-tid='rooms-selector' onChange={onChange}>
            <option>1</option>
        </select>
    ),
}));

jest.mock('frontend/components/common/RoomAllocationGroup/RoomAllocationGroup', () => ({
    __esModule: true,
    default: ({ onRemove, validateChildrenAge }) => (
        <div data-tid='room-allocation-group'>
            <button onClick={() => onRemove()}>Remove Room</button>
            <button onClick={() => validateChildrenAge()}>Validate Children Age</button>
        </div>
    ),
}));

jest.mock('frontend/components/common/SearchBarFieldErrorMessage/SearchBarFieldErrorMessage', () => ({
    __esModule: true,
    default: () => <div data-tid='field-error-message' />,
}));

const createLocalStore = () => ({
    groupBooking: {
        isValid: true,
        isMinCountReached: false,
        adultsQuantity: 2,
        childrenQuantity: 0,
        infantsQuantity: 0,
        rooms: [new RoomAllocation()],
        initializeRooms: jest.fn(),
        removeRoom: jest.fn(),
        changeRoomsCount: jest.fn(),
        validateChildrenAge: jest.fn(),
    },
    forceErrors: false,
});

const createProps = () => ({
    fields: mockFields,
});

const createStores = () => ({
    appStore: { isScreenMedium: false },
    layoutStore: { getSetting: jest.fn(key => SiteSettings[key]), getPhrase: jest.fn(k => k) },
    searchStore: { clearErrorMessage: jest.fn() },
});

let mockLocalStore = createLocalStore();
let mockStores;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/TradePortalGroupBooking/store/createStore', () => ({
    __esModule: true,
    useGroupBookingStore: () => mockLocalStore,
}));

describe('<GroupBookingCustomersInfo />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
        mockProps = createProps();
        mockLocalStore = createLocalStore();
    });

    it('should render standard', () => {
        const { getByText, getByTestId, getAllByTestId } = render(<GroupBookingCustomersInfo {...mockProps} />);

        expect(getByText(mockFields.CustomersInfoTitle.value)).toBeInTheDocument();
        expect(getByText(mockFields.CustomersInfoDescription.value)).toBeInTheDocument();
        expect(getByText(mockFields.CustomersInfoTotal.value)).toBeInTheDocument();
        expect(getByTestId('rooms-selector')).toBeInTheDocument();
        expect(getAllByTestId('room-allocation-group')).toHaveLength(mockLocalStore.groupBooking.rooms.length);
        expect(getByTestId('field-error-message')).toBeInTheDocument();
        expect(mockLocalStore.groupBooking.initializeRooms).toHaveBeenCalled();
    });

    it('should NOT render when groupBooking is not defined', () => {
        (mockLocalStore.groupBooking as any) = undefined;
        const { container } = render(<GroupBookingCustomersInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when no fields', () => {
        delete mockProps.fields;
        const { container } = render(<GroupBookingCustomersInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render RoomAllocationGroup when no rooms', () => {
        mockLocalStore.groupBooking.rooms = [];
        const { queryAllByTestId } = render(<GroupBookingCustomersInfo {...mockProps} />);

        expect(queryAllByTestId('room-allocation-group')).toHaveLength(0);
    });

    it('should NOT render customer info title when CustomersInfoTitle value is not defined', () => {
        delete mockProps.fields.CustomersInfoTitle;
        const { queryByTestId } = render(<GroupBookingCustomersInfo {...mockProps} />);

        expect(queryByTestId('customers-info-title')).not.toBeInTheDocument();
    });

    it('should NOT render customer info description when CustomersInfoDescription value is not defined', () => {
        delete mockProps.fields.CustomersInfoDescription;
        const { queryByTestId } = render(<GroupBookingCustomersInfo {...mockProps} />);

        expect(queryByTestId('customers-info-description')).not.toBeInTheDocument();
    });

    describe('Error message', () => {
        it('should NOT render error message when forceErrors is false and min count of guests has not been reached', () => {
            const { queryByText } = render(<GroupBookingCustomersInfo {...mockProps} />);

            expect(queryByText(mockProps.fields.TotalCountErrorTitle.value)).not.toBeInTheDocument();
        });

        it('should render error message when forceErrors is true and min count of guests has not been reached', () => {
            mockLocalStore.forceErrors = true;
            const { getByText } = render(<GroupBookingCustomersInfo {...mockProps} />);

            expect(getByText(mockProps.fields.TotalCountErrorTitle.value)).toBeInTheDocument();
        });

        it('should NOT render error message when forceErrors is true and min count of guests has been reached', () => {
            mockLocalStore.groupBooking.isMinCountReached = true;
            mockLocalStore.forceErrors = true;
            const { queryByText } = render(<GroupBookingCustomersInfo {...mockProps} />);
            expect(queryByText(mockProps.fields.TotalCountErrorTitle.value)).not.toBeInTheDocument();
        });
    });

    describe('Total block', () => {
        it('should render only adults quantity', () => {
            const { getByTestId, queryByTestId, getByText, getAllByTestId } = render(
                <GroupBookingCustomersInfo {...mockProps} />,
            );

            expect(getByText(mockFields.CustomersInfoTotal.value)).toBeInTheDocument();
            expect(getByTestId('group-booking-adult-quantity')).toBeInTheDocument();
            expect(queryByTestId('group-booking-children-quantity')).not.toBeInTheDocument();
            expect(queryByTestId('group-booking-infants-quantity')).not.toBeInTheDocument();
            expect(getAllByTestId('icon')).toHaveLength(1);
        });

        it('should render adults, children and infants quantity', () => {
            mockLocalStore.groupBooking.childrenQuantity = 1;
            mockLocalStore.groupBooking.infantsQuantity = 1;
            const { getByTestId, getAllByTestId } = render(<GroupBookingCustomersInfo {...mockProps} />);

            expect(getByTestId('group-booking-adult-quantity')).toBeInTheDocument();
            expect(getByTestId('group-booking-children-quantity')).toBeInTheDocument();
            expect(getByTestId('group-booking-infants-quantity')).toBeInTheDocument();
            expect(getAllByTestId('icon')).toHaveLength(3);
        });

        it('should NOT render total block title when CustomersInfoTotal value is not defined', () => {
            delete mockProps.fields.CustomersInfoTotal;
            const { queryByTestId } = render(<GroupBookingCustomersInfo {...mockProps} />);
            expect(queryByTestId('customers-info-total')).not.toBeInTheDocument();
        });

        it('should NOT render images when settings are not defined', () => {
            mockStores.layoutStore.getSetting.mockReturnValue(undefined);
            const { queryByTestId } = render(<GroupBookingCustomersInfo {...mockProps} />);

            expect(queryByTestId('icon')).not.toBeInTheDocument();
        });
    });

    describe('Actions', () => {
        it('should call removeRoom()', () => {
            const { getByRole } = render(<GroupBookingCustomersInfo {...mockProps} />);
            fireEvent.click(getByRole('button', { name: 'Remove Room' }));
            expect(mockLocalStore.groupBooking.removeRoom).toHaveBeenCalled();
        });

        it('should call validateChildrenAge()', () => {
            const { getByRole } = render(<GroupBookingCustomersInfo {...mockProps} />);
            fireEvent.click(getByRole('button', { name: 'Validate Children Age' }));
            expect(mockLocalStore.groupBooking.validateChildrenAge).toHaveBeenCalled();
        });

        it('should call changeRoomsCount()', () => {
            const { getByTestId } = render(<GroupBookingCustomersInfo {...mockProps} />);
            fireEvent.change(getByTestId('rooms-selector'));

            expect(mockLocalStore.groupBooking.changeRoomsCount).toHaveBeenCalled();
        });
    });
});
