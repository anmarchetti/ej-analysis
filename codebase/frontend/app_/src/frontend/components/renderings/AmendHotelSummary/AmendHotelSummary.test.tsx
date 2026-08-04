import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CancelTokenSource } from 'axios';

import { createMockStores, mockAmendHotelOffer, mockTransfer } from 'frontend/__mocks__';
import { deepClone } from 'frontend/utils/array.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';

import AmendHotelSummary from './AmendHotelSummary';

const createMockProps = () => ({
    fields: {
        Subtitle: mockSitecoreField('Subtitle'),
        Title: mockSitecoreField('Title'),
        RoomAndBoardTitle: mockSitecoreField('RoomAndBoardTitle'),
        RoomAndBoardIcon: mockSitecoreField('RoomAndBoardIcon'),
        RoomAndBoardCTA: mockSitecoreField('RoomAndBoardCTA'),
        TransferCTA: mockSitecoreField('TransferCTA'),
        TransferTitle: mockSitecoreField('TransferTitle'),
        HotelTitle: mockSitecoreField('HotelTitle'),
        HotelIcon: mockSitecoreField('HotelIcon'),
        HotelCTA: mockSitecoreField('HotelCTA'),
        TransferPopupAltOptionsPlural: mockSitecoreField('TransferPopupAltOptionsPlural'),
        TransferPopupAltOptionsSingle: mockSitecoreField('TransferPopupAltOptionsSingle'),
        TransferPopupChosenTitle: mockSitecoreField('TransferPopupChosenTitle'),
        TransferPopupSubtitle: mockSitecoreField('TransferPopupSubtitle'),
        TransferPopupTitle: mockSitecoreField('TransferPopupTitle'),
        PriceTooltip: mockSitecoreField('PriceTooltip'),
        MobileBasketLabel: mockSitecoreField('MobileBasketLabel'),
    },
    rendering: {},
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
    useTabletViewport: () => true,
}));

const mockOpenPopupFunction = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendRoomAndBoardPopup/store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore',
    () => ({
        __esModule: true,
        withRoomAndBoardLocalStore: jest.fn(n => n),
        useRoomAndBoardLocalStore: () => ({
            showPopup: mockOpenPopupFunction,
        }),
    }),
);

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder'>{props.children}</div>;
    },
    Text: props => <div data-tid={props['data-tid']}>{props.field.value}</div>,
}));

const mockAmendPageHeaderProps = jest.fn();
jest.mock('frontend/components/common/AmendPageHeader/AmendPageHeader', () => ({
    __esModule: true,
    default: props => {
        mockAmendPageHeaderProps(props);

        return <div data-tid='amend-header' />;
    },
}));

const mockHotelDetailsProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/HotelDetails/HotelDetails', () => ({
    __esModule: true,
    default: props => {
        mockHotelDetailsProps(props);

        return <div data-tid='hotel-details' />;
    },
}));

const mockHotelDropdownProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/HotelDropdown/HotelDropdown', () => ({
    __esModule: true,
    default: ({ previewClickHandler, ...props }) => {
        mockHotelDropdownProps(props);

        return <div data-tid='hotel-dropdown' onClick={previewClickHandler} />;
    },
}));

const mockRoomAndBoardDropdownProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/RoomAndBoardDropdown/RoomAndBoardDropdown', () => ({
    __esModule: true,
    default: props => {
        mockRoomAndBoardDropdownProps(props);

        return (
            <div data-tid='room-and-board-dropdown'>
                <button onClick={props.onClickEditCTA} data-tid='room-and-board-dropdown-button' />
            </div>
        );
    },
}));

const mockTransferDropdownProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/TransferDropdown/TransferDropdown', () => ({
    __esModule: true,
    default: ({ onClickEditCTA, ...props }) => {
        mockTransferDropdownProps(props);

        return <div data-tid='transfer-dropdown' onClick={onClickEditCTA} />;
    },
}));

const mockHotelConfirmationCTAProps = jest.fn();
jest.mock(
    'frontend/components/common/AmendHotelStickyHeader/components/HotelConfirmationCTA/HotelConfirmationCTA',
    () => ({
        __esModule: true,
        default: props => {
            mockHotelConfirmationCTAProps(props);

            return <div data-tid='hotel-confirmation-cta' />;
        },
    }),
);

const mockOverlaySpinnerProps = jest.fn();
jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: props => {
        mockOverlaySpinnerProps(props);

        return <div data-tid='overlay-spinner' />;
    },
}));

const mockHotelBasketProps = jest.fn();
jest.mock('frontend/components/renderings/AmendmentBasket/components/HotelBasket/HotelBasket', () => ({
    __esModule: true,
    default: props => {
        mockHotelBasketProps(props);

        return <div data-tid='hotel-basket' />;
    },
}));

const mockAmendHotelStickyHeaderProps = jest.fn();
jest.mock('frontend/components/common/AmendHotelStickyHeader/StickyHeader', () => ({
    __esModule: true,
    default: props => {
        mockAmendHotelStickyHeaderProps(props);

        return <div data-tid='amend-hotel-summary-sticky-header' />;
    },
}));

const mockAMendTransferPopupProps = jest.fn();
jest.mock('frontend/components/common/AmendTransferPopup', () => ({
    __esModule: true,
    default: ({ onClose, onConfirm, ...props }) => {
        mockAMendTransferPopupProps(props);

        return (
            <div>
                <div data-tid='amend-transfer-popup' onClick={onClose} />
                <div data-tid='amend-transfer-popup-confirm' onClick={() => onConfirm(mockTransfer)} />
            </div>
        );
    },
}));
const mockCancelCallback = jest.fn();
const mockAxiosCancelSource = {
    token: {
        promise: Promise.resolve({
            message: 'cancel',
        }),
        reason: {
            message: 'cancel',
        },
        throwIfRequested: jest.fn(),
    },
    cancel: mockCancelCallback,
};

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        CancelToken: {
            source: (): CancelTokenSource => mockAxiosCancelSource,
        },
        isCancel: jest.fn(),
    },
}));

describe('<AmendHotelSummary />', () => {
    const mockAltHotelOffer = deepClone(mockAmendHotelOffer);
    mockAltHotelOffer.hotel.name = 'AltHotel';

    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            amendHotelStore: {
                newlySelectedHotelOffer: mockAmendHotelOffer,
                totalPrice: 1000,
                initializeSummaryPage: jest.fn(),
                setSelectedHotelDetailsOffer: jest.fn(),
                transfer: {
                    fetchAlternativeTransfers: jest.fn().mockResolvedValue([mockAltHotelOffer]),
                    isLoading: false,
                    dropStoreState: jest.fn(),
                    alternativeHotelOffers: [],
                    selectedTransfer: mockTransfer,
                    alternativeTransfers: [],
                    changeTransfer: jest.fn(),
                },
            },
            routerStore: {
                redirectToViewBookingPage: jest.fn(),
            },
            amendRoomAndBoardStore: {
                setShouldShowRoomAndBoardPopupOnHotelChange: jest.fn(),
            },
        });
    });

    it('should call initializeSummaryPage on mount and render components', () => {
        render(<AmendHotelSummary {...mockProps} />);

        expect(mockStores.amendHotelStore.initializeSummaryPage).toHaveBeenCalled();

        expect(screen.getByTestId('amend-hotel-summary-sticky-header')).toBeInTheDocument();
        expect(mockAmendHotelStickyHeaderProps).toHaveBeenCalledWith({
            amendOffer: mockAmendHotelOffer,
            dataTid: 'amend-hotel-summary-sticky-header',
            tooltipLabel: mockProps.fields.PriceTooltip.value,
        });

        expect(screen.getByTestId('amend-header')).toBeInTheDocument();
        expect(mockAmendPageHeaderProps).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            subtitle: mockProps.fields.Subtitle,
            rendering: mockProps.rendering,
            isAttentionMessageOn: true,
            breadcrumbRootPath: SitePath.AmendHotel,
            errataOverrides: { accomCode: mockAmendHotelOffer.accom.code },
        });

        expect(screen.getByTestId('hotel-details')).toBeInTheDocument();
        expect(mockHotelDetailsProps).toHaveBeenCalledWith({
            fallbackHotelImage: 'HotelFallbackImage',
            hotel: mockAmendHotelOffer.hotel,
        });

        expect(screen.getByTestId('hotel-dropdown')).toBeInTheDocument();
        expect(mockHotelDropdownProps).toHaveBeenCalledWith({
            hotel: mockAmendHotelOffer.hotel,
            icon: mockProps.fields.HotelIcon,
            title: mockProps.fields.HotelTitle,
            CTALabel: mockProps.fields.HotelCTA,
        });

        expect(screen.getByTestId('room-and-board-dropdown')).toBeInTheDocument();
        expect(mockRoomAndBoardDropdownProps).toHaveBeenCalledWith({
            icon: mockProps.fields.RoomAndBoardIcon,
            title: mockProps.fields.RoomAndBoardTitle,
            unit: mockAmendHotelOffer.accom.unit,
            onClickEditCTA: expect.any(Function),
            CTALabel: mockProps.fields.RoomAndBoardCTA,
        });

        expect(screen.getByTestId('transfer-dropdown')).toBeInTheDocument();
        expect(mockTransferDropdownProps).toHaveBeenCalledWith({
            icon: { value: { src: mockAmendHotelOffer.transfers[0].iconUrl } },
            title: mockProps.fields.TransferTitle,
            offerTransfer: mockAmendHotelOffer.transfers[0],
            ctaLabel: mockProps.fields.TransferCTA.value,
        });

        expect(screen.getByTestId('hotel-confirmation-cta')).toBeInTheDocument();
        expect(mockHotelConfirmationCTAProps).toHaveBeenCalledWith({
            dataTid: 'confirm-hotel-cta',
            className: 'continueButton',
        });

        expect(mockPlaceholderProps).not.toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.MobileBasket,
            }),
        );

        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.AmendRoomAndBoardPopup,
            }),
        );

        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.UnAvailableFlowPopup,
            }),
        );

        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.ChangeFeeInfo,
            rendering: mockProps.rendering,
        });

        expect(screen.queryByTestId('amend-transfer-popup')).not.toBeInTheDocument();

        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.PriceJumpPopup,
                rendering: mockProps.rendering,
            }),
        );
    });

    it('should handle click on room and board CTA', async () => {
        render(<AmendHotelSummary {...mockProps} />);

        const rbcCta = screen.getByTestId('room-and-board-dropdown-button');
        await userEvent.click(rbcCta);

        expect(mockOpenPopupFunction).toHaveBeenCalled();
        expect(mockStores.trackingStore.changeHotel.clickOnRoomAndBoardChange).toHaveBeenCalled();
    });

    it('should call handleHotelPreviewClick on click of hotel-dropdown', async () => {
        mockUseMobileViewport = true;
        render(<AmendHotelSummary {...mockProps} />);

        const hotelDropdown = screen.getByTestId('hotel-dropdown');

        await userEvent.click(hotelDropdown);

        expect(mockStores.amendHotelStore.setSelectedHotelDetailsOffer).toHaveBeenCalledWith(
            mockStores.amendHotelStore.newlySelectedHotelOffer,
            mockStores.amendHotelStore.newlySelectedHotelOffer.hotel,
        );
    });

    it('should NOT call handleHotelPreviewClick on click of hotel-dropdown on not mobile viewport', async () => {
        mockUseMobileViewport = false;
        render(<AmendHotelSummary {...mockProps} />);

        const hotelDropdown = screen.getByTestId('hotel-dropdown');

        await userEvent.click(hotelDropdown);

        expect(mockStores.amendHotelStore.setSelectedHotelDetailsOffer).not.toHaveBeenCalled();
    });

    it('should render OverlaySpinner if isLoadingBookingFromPayload', () => {
        mockStores.viewBookingStore.isLoadingBookingFromPayload = true;

        render(<AmendHotelSummary {...mockProps} />);

        expect(screen.getByTestId('overlay-spinner')).toBeInTheDocument();
        expect(mockOverlaySpinnerProps).toHaveBeenCalledWith({
            header: SitecoreDictionary.AmendHotelLabelsValidatingHotel,
        });
    });

    it('should render mobile basket on mobile and not sticky header', () => {
        mockUseMobileViewport = true;

        render(<AmendHotelSummary {...mockProps} />);

        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.MobileBasket,
                rendering: mockProps.rendering,
                applyNegativeMargin: true,
                price: mockStores.amendHotelStore.totalPrice,
                handleSubmit: mockStores.amendHotelStore.confirmChosenHotel,
            }),
        );
        expect(screen.getByTestId('hotel-basket')).toBeInTheDocument();
        expect(mockHotelBasketProps).toHaveBeenCalledWith({
            amendOffer: mockStores.amendHotelStore.newlySelectedHotelOffer,
            unchangedLabel: mockProps.fields.MobileBasketLabel.value,
        });
        expect(screen.queryByTestId('sticky-header')).not.toBeInTheDocument();
    });

    it('should NOT render continue button on mobile', () => {
        mockUseMobileViewport = true;

        render(<AmendHotelSummary {...mockProps} />);

        expect(screen.queryByTestId('hotel-confirmation-cta')).not.toBeInTheDocument();
        expect(mockHotelConfirmationCTAProps).not.toHaveBeenCalled();
    });

    it('should render null if no newlySelectedHotelOffer', () => {
        mockStores.amendHotelStore.newlySelectedHotelOffer = null;

        const { container } = render(<AmendHotelSummary {...mockProps} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render null if no fields', () => {
        mockProps.fields = null;

        const { container } = render(<AmendHotelSummary {...mockProps} />);

        expect(container.firstChild).toBeNull();
    });

    it('should call dropTransfersHotelStore on unmount', () => {
        const { unmount } = render(<AmendHotelSummary {...mockProps} />);

        unmount();
        expect(mockStores.amendHotelStore.transfer.dropStoreState).toHaveBeenCalled();
    });

    it('should call Axios.cancel when popup closed', async () => {
        render(<AmendHotelSummary {...mockProps} />);

        const transferCta = screen.getByTestId('transfer-dropdown');
        await userEvent.click(transferCta);

        const amendTransferPopup = screen.getByTestId('amend-transfer-popup');
        await userEvent.click(amendTransferPopup);

        expect(mockCancelCallback).toHaveBeenCalled();
    });

    describe('Click on transfer cta', () => {
        it('should call fetchAlternativeTransfers and open amend transfer popup', async () => {
            const mockHotelTransferStore = mockStores.amendHotelStore.transfer;
            render(<AmendHotelSummary {...mockProps} />);

            const transferCta = screen.getByTestId('transfer-dropdown');
            await userEvent.click(transferCta);

            expect(mockStores.amendHotelStore.transfer.fetchAlternativeTransfers).toHaveBeenCalledWith(
                mockAxiosCancelSource,
            );
            expect(mockStores.trackingStore.changeHotel.clickOnTransferChange).toHaveBeenCalled();
            expect(mockStores.trackingStore.changeHotel.clickOnTransferChange).toHaveBeenCalled();
            expect(screen.getByTestId('amend-transfer-popup')).toBeInTheDocument();
            expect(mockAMendTransferPopupProps).toHaveBeenCalledWith({
                fields: mockProps.fields,
                isLoading: false,
                initialTransfer: mockHotelTransferStore.selectedTransfer,
                altTransfers: mockHotelTransferStore.alternativeTransfers,
            });
        });

        it('should handle new transfer confirmation in AmendTransferPopup', async () => {
            render(<AmendHotelSummary {...mockProps} />);

            const transferCta = screen.getByTestId('transfer-dropdown');

            await userEvent.click(transferCta);

            const confirmCta = screen.getByTestId('amend-transfer-popup-confirm');
            await userEvent.click(confirmCta);

            expect(mockStores.amendHotelStore.transfer.changeTransfer).toHaveBeenCalledWith(mockTransfer);
            expect(mockStores.trackingStore.changeHotel.clickOnTransferConfirm).toHaveBeenCalledWith(mockTransfer);
        });

        it('should close amend transfer popup', async () => {
            render(<AmendHotelSummary {...mockProps} />);

            const transferCta = screen.getByTestId('transfer-dropdown');
            await userEvent.click(transferCta);

            const amendTransferPopup = screen.getByTestId('amend-transfer-popup');
            await userEvent.click(amendTransferPopup);

            expect(screen.queryByTestId('amend-transfer-popup')).not.toBeInTheDocument();
        });

        it('should NOT call fetchAlternativeTransfers if alternativeHotelTransfersOffers exist', async () => {
            mockStores.amendHotelStore.transfer.alternativeHotelOffers = [mockAmendHotelOffer];

            render(<AmendHotelSummary {...mockProps} />);

            const transferCta = screen.getByTestId('transfer-dropdown');
            await userEvent.click(transferCta);

            expect(mockStores.amendHotelStore.transfer.fetchAlternativeTransfers).not.toHaveBeenCalled();
        });
    });
});
