import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockAmendDatesOffer, mockBooking, mockUnavailablePopupFields } from 'frontend/__mocks__';
import { IUnavailablePopupFields } from 'models/data/IUnavailablePopup';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import AmendTransfersUnavailablePopup from './AmendTransfersUnavailablePopup';

let mockProps: ISitecoreComponent<IUnavailablePopupFields>;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUnavailablePopupProps = jest.fn();
jest.mock('frontend/components/common/UnavailableFlowPopup/UnavailableFlowPopup', () => ({
    __esModule: true,
    default: ({ onClose, ...props }) => {
        mockUnavailablePopupProps(props);

        return <div data-tid='unavailable-popup' onClick={onClose} />;
    },
}));

describe('<AmendTransfersUnavailablePopup />', () => {
    beforeEach(() => {
        mockProps = {
            fields: {
                ...mockUnavailablePopupFields,
                Description: {
                    value: 'Description {date}',
                },
            },
            params: {},
            rendering: 'rendering',
        };
        mockStores = createMockStores({
            amendTransfersStore: {
                isUnavailableTransferPopupShown: true,
                setIsUnavailableTransferPopupShown: jest.fn(),
                isFromChangeDate: false,
            },
            amendDatesStore: {
                offer: mockAmendDatesOffer,
            },
            viewBookingStore: {
                booking: mockBooking,
            },
        });
    });

    it('should NOT be rendered if no fields', () => {
        mockProps.fields = undefined;
        render(<AmendTransfersUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
    });

    it('should NOT be rendered if isUnavailableTransferPopupShown is false', () => {
        mockStores.amendTransfersStore.isUnavailableTransferPopupShown = false;
        render(<AmendTransfersUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
    });

    it('should NOT be rendered if no booking', () => {
        mockStores.viewBookingStore.booking = undefined;
        render(<AmendTransfersUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
    });

    it('should render component', () => {
        render(<AmendTransfersUnavailablePopup {...mockProps} />);

        expect(screen.getByTestId('unavailable-popup')).toBeInTheDocument();
        expect(mockUnavailablePopupProps).toHaveBeenCalledWith({
            fields: {
                ...mockProps.fields,
                Description: {
                    value: 'Description 06/19/2029',
                },
            },
        });
    });

    it('should render component for dates flow', () => {
        mockStores.amendTransfersStore.isFromChangeDate = true;
        render(<AmendTransfersUnavailablePopup {...mockProps} />);

        expect(screen.getByTestId('unavailable-popup')).toBeInTheDocument();
        expect(mockUnavailablePopupProps).toHaveBeenCalledWith({
            fields: {
                ...mockProps.fields,
                Description: {
                    value: 'Description 03/15/2023',
                },
            },
        });
    });

    it('should call onClose functions', async () => {
        render(<AmendTransfersUnavailablePopup {...mockProps} />);

        const popup = screen.getByTestId('unavailable-popup');
        await userEvent.click(popup);

        expect(mockStores.amendTransfersStore.setIsUnavailableTransferPopupShown).toHaveBeenCalledWith(false);
    });
});
