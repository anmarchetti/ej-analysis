import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockAltTransfer, mockTransfer, mockTransferFields } from 'frontend/__mocks__';
import useSEAccommodationFail from 'frontend/components/renderings/Transfer/hooks/useSEAccommodationFail';

import SEAccommodationFailPopup, { ISEAccommodationFailPopupProps } from './SEAccommodationFailPopup';

const createProps = (): ISEAccommodationFailPopupProps => ({
    fields: mockTransferFields,
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            isTransferRemoveSE: false,
            isSERemoveTransfer: false,
            alternativeTransfers: mockAltTransfer,
            transferCandidate: mockTransfer,
            setIsTransferRemoveSE: jest.fn(),
            setIsSERemoveTransfer: jest.fn(),
            changeTransfer: jest.fn(),
            setTransferCandidate: jest.fn(),
            setPrevTransfer: jest.fn(),
            extraLuggage: {
                confirmExtraLuggage: jest.fn(),
                actualizeLuggageParams: jest.fn(),
            },
            holdLuggage: {
                selectedLuggage: 'selectedLuggage',
                selectedSportEquipment: 'selectedSportEquipment',
                clearHoldLuggage: jest.fn(),
                setSportEquipment: jest.fn(),
            },
        },
        trackingStore: {
            trackTransferAndSportsEquipmentChange: jest.fn(),
        },
    });

let mockProps;
let mockStores;

const mockUseSEAccommodationFail = jest.mocked(useSEAccommodationFail);
jest.mock('frontend/components/renderings/Transfer/hooks/useSEAccommodationFail');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field, className }) => (
        <div data-tid='text' className={className}>
            {field.value}
        </div>
    ),
    RichText: ({ field, className }) => (
        <div data-tid='rich-text' className={className}>
            {field.value}
        </div>
    ),
}));

const mockPopup = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, ...restProps }) => {
        mockPopup(restProps);

        return <div data-tid='popup'>{children}</div>;
    },
}));

describe('SEAccommodationFailPopup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render popup when useSEAccommodationFail return null', () => {
        mockUseSEAccommodationFail.mockReturnValue(null);

        render(<SEAccommodationFailPopup {...mockProps} />);

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
        expect(mockStores.trackingStore.trackTransferAndSportsEquipmentChange).not.toHaveBeenCalled();
    });

    it('should call tracking with true when isTransferRemoveSE === true AND isSERemoveTransfer === false', () => {
        mockStores.bookingStore.isTransferRemoveSE = true;

        render(<SEAccommodationFailPopup {...mockProps} />);

        expect(mockStores.trackingStore.trackTransferAndSportsEquipmentChange).toHaveBeenCalledWith(true);
    });

    it('should call tracking with false when isTransferRemoveSE === false AND isSERemoveTransfer === true', () => {
        mockStores.bookingStore.isSERemoveTransfer = true;

        render(<SEAccommodationFailPopup {...mockProps} />);

        expect(mockStores.trackingStore.trackTransferAndSportsEquipmentChange).toHaveBeenCalledWith(false);
    });

    it('should render popup with props from useSEAccommodationFail hook', () => {
        mockStores.bookingStore.isTransferRemoveSE = true;
        mockUseSEAccommodationFail.mockReturnValue([
            mockTransferFields.TransferRemoveSEPopup.fields,
            jest.fn(),
            jest.fn(),
        ]);

        render(<SEAccommodationFailPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopup).toHaveBeenCalledWith({
            containerClass: 'popupContainer',
            dialogClass: 'popupDialog',
            bodyClass: 'popupBody',
            contentClass: 'contentClass',
        });
        expect(screen.getByText(mockTransferFields.TransferRemoveSEPopup.fields.Title.value)).toHaveClass('title');
        expect(screen.getByText(mockTransferFields.TransferRemoveSEPopup.fields.Description.value)).toHaveClass(
            'content',
        );
        expect(screen.getByTestId('se-accommodation-fail-cancel-cta')).toHaveTextContent(
            mockTransferFields.TransferRemoveSEPopup.fields.CancelButtonLabel.value,
        );
        expect(screen.getByTestId('se-accommodation-fail-continue-cta')).toHaveTextContent(
            mockTransferFields.TransferRemoveSEPopup.fields.ConfirmButtonLabel.value,
        );
    });
});
