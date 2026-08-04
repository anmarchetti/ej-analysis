import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import BookingNotFoundPopup, {
    IBookingNotFoundPopupProps,
} from 'frontend/components/renderings/TradePortalFindBooking/components/BookingNotFoundPopup';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: () => <div data-tid='richtext-with-links' />,
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: () => <button />,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

const resetMocks = () =>
    ({
        fields: {
            PopupTitle: mockSitecoreField('PopupTitle'),
            PopupMessage: mockSitecoreField('PopupMessage'),
            PopupButton: mockSitecoreField('PopupButton'),
        },
    } as IBookingNotFoundPopupProps);

let props;

describe('<BookingNotFoundPopup />', () => {
    beforeEach(() => {
        props = resetMocks();
    });

    it('Should render BookingNotFoundPopup', () => {
        render(<BookingNotFoundPopup {...props} />);

        expect(screen.getByTestId('richtext-with-links')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByTestId('popup')).toBeInTheDocument();
    });

    it('Should NOT render BookingNotFoundPopup', () => {
        props = null;
        render(<BookingNotFoundPopup {...props} />);

        expect(screen.queryByTestId('richtext-with-links')).not.toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
    });
});
