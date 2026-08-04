import React from 'react';
import { render } from '@testing-library/react';

import { GreyOverlay } from './GreyOverlay';

jest.mock('frontend/utils/ui.utils');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createStores = () => ({
    layoutStore: { isShown: true },
    appStore: { wasMaintenancePopupShown: true },
});

let mockStores;

describe('<GreyOverlay />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('Should NOT render component when isShown disabled', () => {
        mockStores.layoutStore.isShown = false;
        const { container } = render(
            <GreyOverlay
                isShown={mockStores.layoutStore.isShown}
                wasMaintenancePopupShown={mockStores.appStore.wasMaintenancePopupShown}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render component', () => {
        const { container } = render(
            <GreyOverlay
                isShown={mockStores.layoutStore.isShown}
                wasMaintenancePopupShown={mockStores.appStore.wasMaintenancePopupShown}
            />,
        );

        expect(container.querySelector('.grey-overlay')).toBeInTheDocument();
    });

    it('Should render component with d-none className if wasMaintenancePopupShown prop disabled', () => {
        mockStores.appStore.wasMaintenancePopupShown = false;
        const { container } = render(
            <GreyOverlay
                isShown={mockStores.layoutStore.isShown}
                wasMaintenancePopupShown={mockStores.appStore.wasMaintenancePopupShown}
            />,
        );

        expect(container.querySelector('.grey-overlay.d-none')).toBeInTheDocument();
    });
});
