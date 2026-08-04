import React from 'react';
import { render } from '@testing-library/react';

import { mockFields } from './__mocks__/tradePortalGroupBookingFields';
import TradePortalGroupBooking from './TradePortalGroupBooking';

// mock children
jest.mock(
    'frontend/components/renderings/TradePortalGroupBooking/components/GroupBookingSuccess/GroupBookingSuccess.tsx',
    () => ({
        __esModule: true,
        default: () => <div>GroupBookingSuccess</div>,
    }),
);

jest.mock(
    'frontend/components/renderings/TradePortalGroupBooking/components/GroupBookingHeader/GroupBookingHeader',
    () => ({
        __esModule: true,
        default: () => <div>GroupBookingHeader</div>,
    }),
);

jest.mock(
    'frontend/components/renderings/TradePortalGroupBooking/components/GroupBookingForm/GroupBookingForm',
    () => ({
        __esModule: true,
        default: () => <div>GroupBookingForm</div>,
    }),
);

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    withDatasourceCheck: () => component => component,
}));

const createProps = () => ({
    fields: mockFields,
    params: {},
    rendering: {},
});

const createLocalStore = () => ({
    isSuccess: false,
});

let mockProps = createProps();
let mockLocalStore = createLocalStore();

jest.mock('frontend/components/renderings/TradePortalGroupBooking/store/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/TradePortalGroupBooking/store/createStore'),
    useGroupBookingStore: () => mockLocalStore,
}));

describe('<TradePortalGroupBooking />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockProps = createProps();
        mockLocalStore = createLocalStore();
    });

    it('Should render header and form', () => {
        const { queryByText, getByText } = render(<TradePortalGroupBooking {...mockProps} />);

        expect(getByText('GroupBookingHeader')).toBeInTheDocument();
        expect(getByText('GroupBookingForm')).toBeInTheDocument();
        expect(queryByText('GroupBookingSuccess')).toBeNull();
    });

    it('Should render success page when isSuccess is true', () => {
        mockLocalStore.isSuccess = true;
        const { getByText } = render(<TradePortalGroupBooking {...mockProps} />);

        expect(getByText('GroupBookingSuccess')).toBeInTheDocument();
    });

    it('Should NOT render when no fields', () => {
        mockProps.fields = undefined as any;
        const { container } = render(<TradePortalGroupBooking {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
