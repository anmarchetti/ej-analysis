import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendBookingErrorPopup from './AmendBookingErrorPopup';

const scrollTo = jest.fn();
Object.defineProperty(global, 'scrollTo', { value: scrollTo });

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    viewBookingStore: { toggleAmendErrorPopup: jest.fn() },
});

const mockProps = {
    onClose: jest.fn(),
};
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPopupCallProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: props => {
        mockPopupCallProps(props);

        return (
            <div data-tid='popup'>
                <h2>{props.title}</h2>
                <div>{props.footerContent}</div>
                <div>{props.children}</div>
            </div>
        );
    },
}));

describe('<AmendBookingErrorPopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render title', () => {
        const { getByRole } = render(<AmendBookingErrorPopup {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent(SitecoreDictionary.AmendBookingErrorPopupTitle);
    });

    it('should render description if description is provided by dictionary', () => {
        const { getByText } = render(<AmendBookingErrorPopup {...mockProps} />);

        expect(getByText(SitecoreDictionary.AmendBookingErrorPopupDescription)).toBeInTheDocument();
    });

    it('calls onClose callback', async () => {
        render(<AmendBookingErrorPopup {...mockProps} />);

        const button = screen.getByRole('button', {
            name: SitecoreDictionary.GlobalsButtonsClose,
        });

        await userEvent.click(button);

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('passes right parameters to Popup', () => {
        render(<AmendBookingErrorPopup {...mockProps} />);

        expect(mockPopupCallProps).toBeCalledWith(
            expect.objectContaining({
                showCloseButton: true,
                isContentCentered: true,
                onClose: mockProps.onClose,
                title: SitecoreDictionary.AmendBookingErrorPopupTitle,
            }),
        );
        expect(React.isValidElement(mockPopupCallProps.mock.calls[0][0]?.footerContent)).toBe(true);
    });

    it('should NOT render description if description is NOT provided by dictionary', () => {
        mockStores.layoutStore.getPhrase = jest.fn();
        const { queryByText, container } = render(<AmendBookingErrorPopup {...mockProps} />);

        expect(container.getElementsByClassName('my-0').length).toBe(0);
        expect(queryByText(SitecoreDictionary.AmendBookingErrorPopupDescription)).not.toBeInTheDocument();
    });
});
