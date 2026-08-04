import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { mockFields } from 'frontend/components/renderings/TradePortalGroupBooking/__mocks__/tradePortalGroupBookingFields';
import GroupBookingAgentInformation from 'frontend/components/renderings/TradePortalGroupBooking/components/GroupBookingForm/GroupBookingAgentInformation/GroupBookingAgentInformation';
import {
    GroupBooking,
    GroupBookingFormFields,
} from 'frontend/components/renderings/TradePortalGroupBooking/data/GroupBooking';

jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => ({
    __esModule: true,
    default: ({ label, onChange, id }) => (
        <label>
            {label} <input data-tid={id} id={id} onChange={e => onChange(e.target.value)} type='text' />
        </label>
    ),
}));

const createLocalStore = () => ({
    groupBooking: {
        isValid: true,
        onChangeField: jest.fn(),
        isFieldRequired: jest.fn(),
        validateField: jest.fn(),
    } as Partial<GroupBooking>,
    forceErrors: false,
});

let mockLocalStore;
let mockStores;
let mockProps;

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

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<GroupBookingAgentInformation />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
        mockProps = createProps();
        mockLocalStore = createLocalStore();
    });

    it('Should render title and 3 text fields', () => {
        const { getByText, getAllByRole, getByLabelText } = render(<GroupBookingAgentInformation {...mockProps} />);

        expect(getByText(mockFields.AgentInfoTitle.value)).toHaveClass('form-section-title');
        expect(getAllByRole('textbox')).toHaveLength(3);
        expect(getByLabelText(mockFields.AgentNamePlaceholder.value, { selector: 'input' })).toBeInTheDocument();
        expect(getByLabelText(mockFields.AgentEmailPlaceholder.value, { selector: 'input' })).toBeInTheDocument();
        expect(getByLabelText(mockFields.AgentNumberPlaceholder.value, { selector: 'input' })).toBeInTheDocument();
    });

    it('Should NOT render anything when groupBooking is not defined', () => {
        mockLocalStore.groupBooking = undefined;
        const { container } = render(<GroupBookingAgentInformation {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render anything when no fields', () => {
        delete mockProps.fields;
        const { container } = render(<GroupBookingAgentInformation {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should set empty text field label when props fields values are not defined', () => {
        mockProps.fields = {} as any;
        const { getByTestId } = render(<GroupBookingAgentInformation {...mockProps} />);

        expect(getByTestId(GroupBookingFormFields.AgentName)).toHaveAccessibleName('');
        expect(getByTestId(GroupBookingFormFields.AgentEmail)).toHaveAccessibleName('');
        expect(getByTestId(GroupBookingFormFields.AgentNumber)).toHaveAccessibleName('');
    });

    describe('groupBooking.onChangeField()', () => {
        it('Should call onChangeField() when agent name changed', () => {
            const { getByRole } = render(<GroupBookingAgentInformation {...mockProps} />);

            const value = 'test';
            const textbox = getByRole('textbox', { name: mockFields.AgentNamePlaceholder.value });
            fireEvent.change(textbox, { target: { value } });

            expect(mockLocalStore.groupBooking.onChangeField).toBeCalledWith(GroupBookingFormFields.AgentName, value);
        });

        it('Should call groupBooking.onChangeField when agent email changed', () => {
            const { getByRole } = render(<GroupBookingAgentInformation {...mockProps} />);

            const value = 'email@test.com';
            const textbox = getByRole('textbox', { name: mockFields.AgentEmailPlaceholder.value });
            fireEvent.change(textbox, { target: { value } });

            expect(mockLocalStore.groupBooking.onChangeField).toBeCalledWith(GroupBookingFormFields.AgentEmail, value);
        });

        it('Should call groupBooking.onChangeField when agent number changed', () => {
            const { getByRole } = render(<GroupBookingAgentInformation {...mockProps} />);

            const value = '123';
            const textbox = getByRole('textbox', { name: mockFields.AgentNumberPlaceholder.value });
            fireEvent.change(textbox, { target: { value } });

            expect(mockLocalStore.groupBooking.onChangeField).toBeCalledWith(GroupBookingFormFields.AgentNumber, value);
        });
    });
});
