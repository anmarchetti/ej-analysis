import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendUnavailablePopup from './AmendUnavailablePopup';

const createProps = () => ({ fields: {} as any });

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    amendPaymentStore: { onErrorPopupClose: jest.fn(), isAmendItemUnavailable: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendUnavailablePopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        Object.defineProperty(window, 'scrollTo', {
            configurable: true,
        });
        window.scrollTo = jest.fn();
    });

    it('should NOT render if is Amend Item is Unavailable', () => {
        mockStores.amendPaymentStore.isAmendItemUnavailable = true;
        const { container } = render(<AmendUnavailablePopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render popup without title when title not provided', () => {
        const { container, queryByRole } = render(<AmendUnavailablePopup {...mockProps} />);

        expect(container.getElementsByClassName('holiday-unavailable').length).toBe(1);
        expect(queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render popup with title when title provided', () => {
        mockProps.fields = { ErrorPopupTitle: { value: 'ErrorPopupTitle' } };
        const { container, getByRole } = render(<AmendUnavailablePopup {...mockProps} />);

        expect(container.getElementsByClassName('holiday-unavailable').length).toBe(1);
        expect(getByRole('heading')).toHaveTextContent('ErrorPopupTitle');
    });

    it('should NOT render description when description NOT provided', () => {
        const { container } = render(<AmendUnavailablePopup {...mockProps} />);

        expect(container.getElementsByClassName('additional-text').length).toBe(0);
    });

    it('should render description when description provided', () => {
        mockProps.fields = { ErrorPopupDescription: { value: 'ErrorPopupDescription' } };
        const { getByText } = render(<AmendUnavailablePopup {...mockProps} />);

        expect(getByText('ErrorPopupDescription')).toBeInTheDocument();
    });

    it('should render button with global button OK text when ErrorPopupButton NOT provided', () => {
        const { getByRole } = render(<AmendUnavailablePopup {...mockProps} />);

        expect(getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsOK);
    });

    it('should render button with ErrorPopupButton text when ErrorPopupButton provided', () => {
        mockProps.fields = { ErrorPopupButton: { value: 'ErrorPopupButton' } };
        const { getByRole } = render(<AmendUnavailablePopup {...mockProps} />);

        expect(getByRole('button')).toHaveTextContent('ErrorPopupButton');
    });
});
