import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    createMockStores,
    mockAltNoTransfer,
    mockAltPrivateTransfer,
    mockAltSharedTransfer,
    mockAltTransfer,
    mockTransferFields,
} from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import ScrollAnchorId from 'models/enum/ScrollAnchorId';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import Transfer, { ITransferFields } from './Transfer';

const createStores = () =>
    createMockStores({
        bookingStore: {
            transfer: mockAltPrivateTransfer,
            transfers: [mockAltSharedTransfer],
            alternativeTransfers: mockAltTransfer,
            changeTransfer: jest.fn(),
            showSEAccommodationPopupIfNeeded: jest.fn(),
            selectedOffer: mockedOffer,
        },
        searchStore: {
            searchWho: { adultsQuantity: 2, childrenQuantity: 0 },
        },
        layoutStore: {
            isPrivateTransferPromoEnabled: true,
            privateTransferPromoMinDiffTime: 30,
        },
    });

const createProps = (): ISitecoreComponent<ITransferFields> => ({
    fields: mockTransferFields,
    params: {},
    rendering: {},
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/offer.utils', () => ({
    __esModule: true,
    isFreeForKids: () => true,
}));

const mockTransferItemProps = jest.fn();
jest.mock('frontend/components/renderings/Transfer/components/TransferItem/TransferItem', () => ({
    __esModule: true,
    default: ({ promo, ...restProps }) => {
        mockTransferItemProps(restProps);

        return (
            <div data-tid='transfer-item'>
                {promo}
                <button onClick={restProps.onSelect} />
            </div>
        );
    },
}));

const mockTransferDurationPromoProps = jest.fn();
jest.mock('frontend/components/renderings/Transfer/components/TransferDurationPromo/TransferDurationPromo', () => ({
    __esModule: true,
    default: props => {
        mockTransferDurationPromoProps(props);

        return <div data-tid='transfer-duration-promo' />;
    },
}));

const mockErrorMessageProps = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: ({ icon, ...restProps }) => {
        mockErrorMessageProps(restProps);

        return <div data-tid='error-message'>{icon}</div>;
    },
}));

const mockSEAccommodationFailPopupProps = jest.fn();
jest.mock('frontend/components/renderings/Transfer/components/HoldLuggageCancelPopup/SEAccommodationFailPopup', () => ({
    __esModule: true,
    default: props => {
        mockSEAccommodationFailPopupProps(props);

        return <div data-tid='se-accommodation-fail-popup' />;
    },
}));

const mockAncillariesHeader = jest.fn();
jest.mock('frontend/components/common/Ancillaries/components/AncillariesHeader/AncillariesHeader', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockAncillariesHeader(props);

        return <div data-tid='ancillaries-header' />;
    },
}));

let mockProps;
let mockStores;

describe('<Transfer />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render component correct', () => {
        render(<Transfer {...mockProps} />);

        expect(screen.getByTestId('transfers')).toHaveClass('step step__with-triangle-start');
        expect(screen.getByTestId('ancillaries-header')).toBeInTheDocument();
        expect(mockAncillariesHeader).toHaveBeenCalledWith({
            title: { value: SitecoreDictionary.TransferLabelsTitleTransferSingular },
        });

        expect(screen.getAllByTestId('transfer-item')).toHaveLength(3);
        expect(mockTransferItemProps).toHaveBeenNthCalledWith(1, {
            fields: mockTransferFields,
            transfer: { ...mockAltSharedTransfer, price: 0, pricePP: 0 },
            isSelected: true,
            onSelect: expect.any(Function),
            isDefault: true,
        });
        expect(mockTransferItemProps).toHaveBeenNthCalledWith(2, {
            fields: mockTransferFields,
            transfer: { ...mockAltPrivateTransfer, price: 100, pricePP: 50 },
            isSelected: false,
            onSelect: expect.any(Function),
            isDefault: false,
        });
        expect(mockTransferItemProps).toHaveBeenNthCalledWith(3, {
            fields: mockTransferFields,
            transfer: { ...mockAltNoTransfer, price: 0, pricePP: 0 },
            isSelected: false,
            onSelect: expect.any(Function),
            isDefault: false,
        });

        expect(screen.getByTestId('transfer-duration-promo')).toBeInTheDocument();
        expect(mockTransferDurationPromoProps).toHaveBeenCalledWith({ timeDiff: 30 });

        expect(screen.getByTestId('se-accommodation-fail-popup')).toBeInTheDocument();
        expect(mockSEAccommodationFailPopupProps).toHaveBeenCalledWith({ fields: mockTransferFields });

        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledTimes(2);
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should have selected NoTransfer option when NO transfer available', () => {
        mockStores.bookingStore.transfers = null;

        render(<Transfer {...mockProps} />);

        expect(mockTransferItemProps).toHaveBeenNthCalledWith(3, {
            fields: mockTransferFields,
            transfer: { ...mockAltNoTransfer, price: 0, pricePP: 0 },
            isSelected: true,
            onSelect: expect.any(Function),
            isDefault: false,
        });
    });

    it('should remove NoTransfer if children and free for kids', () => {
        mockStores.searchStore.searchWho.childrenQuantity = 1;
        mockStores.searchStore.searchWho.adultsQuantity = 1;

        render(<Transfer {...mockProps} />);

        expect(screen.getAllByTestId('transfer-item')).toHaveLength(2);

        expect(mockTransferItemProps).toHaveBeenNthCalledWith(1, {
            fields: mockTransferFields,
            transfer: { ...mockAltSharedTransfer, price: 0, pricePP: 0 },
            isSelected: true,
            onSelect: expect.any(Function),
            isDefault: true,
        });
        expect(mockTransferItemProps).toHaveBeenNthCalledWith(2, {
            fields: mockTransferFields,
            transfer: { ...mockAltPrivateTransfer, price: 100, pricePP: 50 },
            isSelected: false,
            onSelect: expect.any(Function),
            isDefault: false,
        });
    });

    it('should show ErrorMessage when some transfer is hidden', () => {
        mockStores.bookingStore.alternativeTransfers = [{ ...mockAltSharedTransfer, isHidden: true }];

        render(<Transfer {...mockProps} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(mockErrorMessageProps).toHaveBeenCalledWith({
            IsNotification: true,
            description: SitecoreDictionary.TransferLabelsNoOtherTransferDescription,
            message: SitecoreDictionary.TransferLabelsNoOtherTransferOptions,
            errorMessageClass: 'errorMessage',
        });
    });

    describe('Private taxi promo banner ', () => {
        it('should NOT render private taxi promo banner  when it is disabled', () => {
            mockStores.layoutStore.isPrivateTransferPromoEnabled = false;

            render(<Transfer {...mockProps} />);

            expect(screen.queryByTestId('transfer-duration-promo')).not.toBeInTheDocument();
        });

        it('should NOT render private taxi promo banner  when duration difference is less than min', () => {
            mockStores.layoutStore.privateTransferPromoMinDiffTime = 90;

            render(<Transfer {...mockProps} />);

            expect(screen.queryByTestId('transfer-duration-promo')).not.toBeInTheDocument();
        });

        it('should NOT render private taxi promo banner when either transfer has 0 duration', () => {
            mockStores.bookingStore.alternativeTransfers[0].transferInfo.duration = 0;

            render(<Transfer {...mockProps} />);

            expect(screen.queryByTestId('transfer-duration-promo')).not.toBeInTheDocument();
        });
    });

    it('should select transfer on button click', async () => {
        render(<Transfer {...mockProps} />);

        const btn = screen.queryAllByRole('button')[0];

        await userEvent.click(btn);

        expect(mockStores.bookingStore.changeTransfer).toHaveBeenCalled();
        expect(mockStores.bookingStore.showSEAccommodationPopupIfNeeded).toHaveBeenCalledWith(
            true,
            mockAltPrivateTransfer,
        );
    });

    it('should render scroll anchor for navigation', () => {
        render(<Transfer {...mockProps} />);

        const scrollAnchor = screen.getByTestId('transfer-scroll-anchor');
        expect(scrollAnchor).toHaveAttribute('id', ScrollAnchorId.Transfer);
        expect(scrollAnchor).toHaveAttribute('aria-hidden', 'true');
    });
});
