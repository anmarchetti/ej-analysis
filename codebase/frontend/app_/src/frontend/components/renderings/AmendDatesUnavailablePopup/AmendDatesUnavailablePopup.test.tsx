import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockUnavailablePopupFields } from 'frontend/__mocks__';
import { IUnavailablePopupFields } from 'models/data/IUnavailablePopup';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import AmendDatesUnavailablePopup from './AmendDatesUnavailablePopup';

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

describe('<AmendDatesUnavailablePopup />', () => {
    beforeEach(() => {
        mockProps = {
            fields: mockUnavailablePopupFields,
            params: {},
            rendering: 'rendering',
        };
        mockStores = createMockStores({
            amendDatesStore: {
                isNoAvailableDates: true,
                isError: false,
                setIsNoAvailableDates: jest.fn(),
                clearStore: jest.fn(),
            },
            viewBookingStore: {
                isManageHolidayPopupOpened: true,
            },
        });
    });

    it('should NOT be rendered if no fields', () => {
        mockProps.fields = undefined;
        render(<AmendDatesUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
    });

    it('should NOT be rendered if isNoAmendDatesAvailability and isAmendDatesError are false', () => {
        mockStores.amendDatesStore.isNoAvailableDates = false;
        mockStores.amendDatesStore.isError = false;
        render(<AmendDatesUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
    });

    it('should render component with isNoAvailableDates is true', () => {
        render(<AmendDatesUnavailablePopup {...mockProps} />);

        expect(screen.getByTestId('unavailable-popup')).toBeInTheDocument();
        expect(mockUnavailablePopupProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            isInnerPopup: true,
        });
    });

    it('should call onClose functions', async () => {
        mockStores.amendDatesStore.clearStore = jest.fn();
        mockStores.amendDatesStore.setIsNoAvailableDates = jest.fn();

        render(<AmendDatesUnavailablePopup {...mockProps} />);

        const popup = screen.getByTestId('unavailable-popup');
        await userEvent.click(popup);

        expect(mockStores.amendDatesStore.clearStore).toHaveBeenCalled();
        expect(mockStores.amendDatesStore.setIsNoAvailableDates).toHaveBeenCalledWith(false);
    });
});
