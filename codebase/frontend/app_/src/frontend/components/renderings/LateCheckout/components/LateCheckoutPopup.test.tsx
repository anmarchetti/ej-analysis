import React from 'react';
import { render, screen } from '@testing-library/react';

import LateCheckoutPopup from './LateCheckoutPopup';

const createProps = () => ({
    PopUpDescription: { value: 'desc' },
    PopUpTitle: { value: 'title' },
    PopUpIcon: { value: { src: 'icon' } },
    isLateCheckoutPopupShown: true,
    closePopup: () => jest.fn(),
});

const createStores = () => ({
    layoutStore: { isLateCheckoutEnabledBySitecore: true, getPhrase: jest.fn() },
    appStore: { isScreenMedium: true },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Drawer', () => () => <div data-tid='drawer' />);

describe('<LateCheckoutPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if disabled by sitecore', () => {
        mockStores.layoutStore.isLateCheckoutEnabledBySitecore = false;
        const { container } = render(<LateCheckoutPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if late checkout popup not shown', () => {
        mockProps.isLateCheckoutPopupShown = false;
        const { container } = render(<LateCheckoutPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render only drawer', () => {
        mockStores.appStore.isScreenMedium = false;
        render(<LateCheckoutPopup {...mockProps} />);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });

    it('should render only popup', () => {
        const { queryByTestId, container } = render(<LateCheckoutPopup {...mockProps} />);

        expect(queryByTestId('drawer')).not.toBeInTheDocument();
        expect(container.getElementsByClassName('container').length).toBe(1);
    });
});
