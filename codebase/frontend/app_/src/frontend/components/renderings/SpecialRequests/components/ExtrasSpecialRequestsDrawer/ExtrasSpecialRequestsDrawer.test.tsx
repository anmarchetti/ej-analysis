import React from 'react';
import { render } from '@testing-library/react';

import ExtrasSpecialRequestsDrawer from './ExtrasSpecialRequestsDrawer';

const createProps = () => ({
    fields: { Description: { value: 'description' } },
    isOpen: false,
    requests: [
        { isSelected: false, code: '1' },
        { isSelected: true, code: '2' },
    ],
    handlePreselectedDismissal: jest.fn(),
    onSelectRequest: jest.fn(),
    onClose: jest.fn(),
    alerts: [
        { description: 'description2', message: 'message' },
        { description: 'description3', message: 'message2' },
    ],
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    appStore: { isScreenLessMedium: false },
    bookingStore: { addSpecialRequests: jest.fn() },
    routerStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Drawer', () => ({ children }) => <div data-tid='drawer'>{children}</div>);

jest.mock(
    'frontend/components/renderings/SpecialRequests/components/ExtrasSpecialRequestsDrawer/ExtrasSpecialRequestsDrawerAlerts/ExtrasSpecialRequestsDrawerAlerts',
    () => () => <div data-tid='alert' />,
);

jest.mock(
    'frontend/components/renderings/SpecialRequests/components/SpecialRequestItem/SpecialRequestItem',
    () => () => <div data-tid='special-request-item' />,
);

jest.mock(
    'frontend/components/renderings/SpecialRequests/components/ExtrasSpecialRequestsDrawer/ExtrasSpecialRequestsDrawerActions/ExtrasSpecialRequestsDrawerActions',
    () => () => <div data-tid='extras-special-requests-drawer-actions' />,
);

describe('<ExtrasSpecialRequestsDrawer />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render Drawer', () => {
        const { getByTestId } = render(<ExtrasSpecialRequestsDrawer {...mockProps} />);

        expect(getByTestId('drawer')).toBeInTheDocument();
    });

    it('should render description', () => {
        const { getByText } = render(<ExtrasSpecialRequestsDrawer {...mockProps} />);

        expect(getByText('description')).toBeInTheDocument();
    });

    it('should NOT render description when description NOT provided', () => {
        mockProps.fields.Description = null;
        const { queryByText } = render(<ExtrasSpecialRequestsDrawer {...mockProps} />);

        expect(queryByText('description')).not.toBeInTheDocument();
    });

    it('should render alert when isOpen and alerts provided', () => {
        mockProps.isOpen = true;
        const { getByTestId } = render(<ExtrasSpecialRequestsDrawer {...mockProps} />);

        expect(getByTestId('alert')).toBeInTheDocument();
    });

    it('should NOT render alert when is NOT Open', () => {
        const { queryByTestId } = render(<ExtrasSpecialRequestsDrawer {...mockProps} />);

        expect(queryByTestId('alert')).not.toBeInTheDocument();
    });

    it('should NOT render alert when alerts NOT provided', () => {
        mockProps.isOpen = true;
        mockProps.alerts = [];
        const { queryByTestId } = render(<ExtrasSpecialRequestsDrawer {...mockProps} />);

        expect(queryByTestId('alert')).not.toBeInTheDocument();
    });

    it('should render 2 SpecialRequestItems', () => {
        const { getAllByTestId } = render(<ExtrasSpecialRequestsDrawer {...mockProps} />);

        expect(getAllByTestId('special-request-item').length).toBe(2);
    });

    it('should render ExtrasSpecialRequestsDrawerActions', () => {
        const { getByTestId } = render(<ExtrasSpecialRequestsDrawer {...mockProps} />);

        expect(getByTestId('extras-special-requests-drawer-actions')).toBeInTheDocument();
    });
});
