import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import { mockFields } from 'frontend/components/renderings/TradePortalGroupBooking/__mocks__/tradePortalGroupBookingFields';
import GroupBookingForm from 'frontend/components/renderings/TradePortalGroupBooking/components/GroupBookingForm/GroupBookingForm';
import { MIN_PEOPLE_COUNT_FOR_GROUP_BOOKING } from 'frontend/components/renderings/TradePortalGroupBooking/data/constants';

jest.mock('frontend/utils/search/search.utils', () => ({
    __esModule: true,
    getChildrenQuantity: jest.fn(() => 9),
    getInfantsQuantity: jest.fn(() => 9),
    getAdultsQuantity: jest.fn(() => 9),
}));

jest.mock('frontend/utils/date.utils', () => ({
    __esModule: true,
    parseDateL10n: jest.fn(() => 'date'),
    formatDateToQuery: jest.fn(() => '12-12-2023'),
}));

jest.mock('frontend/utils/ui.utils', () => ({
    __esModule: true,
    scrollToErrorBlock: jest.fn(),
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div>{field.value}</div>,
}));

jest.mock('./GroupBookingAgentInformation/GroupBookingAgentInformation', () => ({
    __esModule: true,
    default: () => <div>GroupBookingAgentInformation</div>,
}));

jest.mock('./GroupBookingCustomersInfo/GroupBookingCustomersInfo', () => ({
    __esModule: true,
    default: () => <div>GroupBookingCustomersInfo</div>,
}));

jest.mock('./GroupBookingHolidayInformation/GroupBookingHolidayInformation', () => ({
    __esModule: true,
    default: () => <div>GroupBookingHolidayInformation</div>,
}));

const createLocalStore = () => ({
    formKey: 'formKey',
    groupBooking: {
        isValid: true,
        agentName: 'agentName',
        agentEmail: 'agentEmail',
        agentNumber: '1',
        departureDate: 'departureDate',
        duration: '20',
        isFlexible: false,
        destination: 'destination',
        additionalDetails: 'additionalDetails',
        departureAirport: 'departureAirport',
        boards: [{ value: 'board1' }, { value: 'board2' }, { value: 'board3' }],
    },
    submitForm: jest.fn(),
    toggleForceErrors: jest.fn(),
    forceErrors: false,
});

jest.mock('frontend/components/renderings/TradePortalGroupBooking/store/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/TradePortalGroupBooking/store/createStore'),
    useGroupBookingStore: () => mockLocalStore,
}));

const createProps = () => ({
    fields: mockFields,
});

const createStores = () => ({
    routerStore: {},
    appStore: {},
    layoutStore: {},
});

let mockLocalStore;
let mockStores;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<GroupBookingForm />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
        mockProps = createProps();
        mockLocalStore = createLocalStore();
    });

    it('Should render standard', () => {
        const { getByRole, getByText } = render(<GroupBookingForm {...mockProps} />);

        expect(getByRole('heading', { level: 2 })).toHaveTextContent(mockFields.FormTitle.value);
        expect(getByText(mockFields.FormDescription.value)).toBeInTheDocument();
        expect(getByText('GroupBookingAgentInformation')).toBeInTheDocument();
        expect(getByText('GroupBookingCustomersInfo')).toBeInTheDocument();
        expect(getByText('GroupBookingHolidayInformation')).toBeInTheDocument();
        expect(getByRole('button')).toHaveTextContent(mockFields.SubmitCTAText.value);
    });

    it('Should NOT render title when FormTitle value is not defined', () => {
        mockFields.FormTitle.value = '';

        const { queryByRole } = render(<GroupBookingForm {...mockProps} />);

        expect(queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });

    it('Should submit data when form is valid', async () => {
        const { getByRole } = render(<GroupBookingForm {...mockProps} />);

        await userEvent.click(getByRole('button'));

        expect(mockLocalStore.submitForm).toHaveBeenCalled();
    });

    it('Should NOT scroll when groupBooking is valid', async () => {
        // TODO: find a way to test scrollToErrorMessageBlock function
        // const mockedScrollIntoViewMock = jest.fn();

        // Element.prototype.scrollIntoView = scrollIntoViewMock;
        // window.HTMLElement.prototype.scrollIntoView = mockedScrollIntoViewMock;

        mockLocalStore.forceErrors = true;

        // mock shouldScrollToError
        jest.mock('react', () => ({
            useState: () => [true, jest.fn()],
        }));

        const { getByRole } = render(<GroupBookingForm {...mockProps} />);

        await userEvent.click(getByRole('button'));

        expect(scrollToErrorBlock).not.toBeCalled();
        //TODO: expect(mockedScrollIntoViewMock).toBeCalled();

        mockLocalStore.forceErrors = false;
    });

    it('Should scroll to input with error when groupBooking is not valid', async () => {
        mockLocalStore.forceErrors = true;
        mockLocalStore.groupBooking.isValid = false;

        jest.mock('react', () => ({
            useState: () => [true, jest.fn()],
        }));

        const { getByRole } = render(<GroupBookingForm {...mockProps} />);

        await userEvent.click(getByRole('button'));

        expect(scrollToErrorBlock).toBeCalled();
    });
});
