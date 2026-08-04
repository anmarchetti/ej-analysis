import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    createMockStores,
    mockBoardType,
    mockBooking,
    mockRoomAndBoardRoomVariant,
    mockUnitRoom,
} from 'frontend/__mocks__';
import { deepClone } from 'frontend/utils/array.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IUnit } from 'models/data/IOffer';
import { GuestType } from 'models/enum/GuestType';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import AmendRoomAndBoard, { IAmendRoomAndBoardFields } from './AmendRoomAndBoard';

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Subtitle: mockSitecoreField('Subtitle'),
        AltRoomsCollapseLabel: mockSitecoreField('AltRoomsCollapseLabel'),
        OriginalRoomTitle: mockSitecoreField('OriginalRoomTitle'),
        AltRoomsExpandLabel: mockSitecoreField('AltRoomsExpandLabel'),
        AltRoomsTitle: mockSitecoreField('AltRoomsTitle'),
        RoomsMobileListTitle: mockSitecoreField('RoomsMobileListTitle'),
        RoomsMobileListDescription: mockSitecoreField('RoomsMobileListDescription'),
        AltRoomsTitlePlural: mockSitecoreField('AltRoomsTitlePlural'),
        CountRoomsToShow: mockSitecoreField(3),
        AdditionalCostLabel: mockSitecoreField('AdditionalCostLabel'),
        GoBackLabel: mockSitecoreField('GoBackLabel'),
        GoBackNoChangesLabel: mockSitecoreField('GoBackNoChangesLabel'),
        RefundAmountLabel: mockSitecoreField('RefundAmountLabel'),
        PriceTooltipContent: mockSitecoreField('PriceTooltipContent'),
        FreeChildPlaceTooltip: mockSitecoreField('FreeChildPlaceTooltip'),
    } as IAmendRoomAndBoardFields,
    rendering: 'rendering',
});

let mockStores;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAmendHeaderProps = jest.fn();
jest.mock('frontend/components/common/AmendPageHeader/AmendPageHeader', () => ({
    __esModule: true,
    default: props => {
        mockAmendHeaderProps(props);

        return <div data-tid='amend-header' />;
    },
}));

let mockRoom: IUnit;
const mockRoomSectionProps = jest.fn();
jest.mock('frontend/components/common/Room/RoomsSection/RoomsSection', () => ({
    __esModule: true,
    default: ({ onChangeRoom, ...props }) => {
        mockRoomSectionProps(props);

        return <button data-tid='room-section' onClick={() => onChangeRoom(mockRoom)} />;
    },
}));

jest.mock('frontend/utils/boardsAndRooms.utils', () => ({
    __esModule: true,
    getAltRoomsTitle: jest.fn().mockReturnValue('AltRoomsTitle'),
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return (
            <button onClick={props.onClose} data-tid={props.name}>
                {props.children}
            </button>
        );
    },
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='wrapper'>{children}</div>,
}));

const mockRBCHeaderProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendRoomAndBoard/components/AmendRoomAndBoardHeader/AmendRoomAndBoardHeader',
    () => ({
        __esModule: true,
        default: props => {
            mockRBCHeaderProps(props);

            return <div data-tid='header-rbc' />;
        },
    }),
);

const mockRBCFooterProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendRoomAndBoard/components/AmendRoomAndBoardFooter/AmendRoomAndBoardFooter',
    () => ({
        __esModule: true,
        default: props => {
            mockRBCFooterProps(props);

            return <div data-tid='footer-rbc' />;
        },
    }),
);

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/components/renderings/AmendmentBasket/components/RoomAndBoardBasket/RoomAndBoardBasket', () => ({
    __esModule: true,
    default: () => <div data-tid='room-and-board-basket' />,
}));

describe('<AmendRoomAndBoard />', () => {
    const mockTestRoom = { ...mockUnitRoom, price: 220.01, code: 'test' };
    const mockTestBoard = { ...mockUnitRoom.boardType, price: 220.01, code: 'boardType_code' };
    const mockTestVariant = { ...mockRoomAndBoardRoomVariant, units: [mockTestRoom] };

    beforeEach(() => {
        mockStores = createMockStores({
            amendRoomAndBoardStore: {
                roomVariants: [mockRoomAndBoardRoomVariant],
                changeRoom: jest.fn(),
                initiateRoomAndBoardPage: jest.fn(),
                cancelRequests: jest.fn(),
                chosenRoom: mockUnitRoom,
                chosenBoard: mockBoardType,
                isLoadingValidatedOptions: false,
                areOptionsNotValidated: false,
                selectedOptionIsUnavailable: false,
                setSelectedOptionIsUnavailable: jest.fn(),
                confirmChosenVariant: jest.fn(),
            },
            viewBookingStore: {
                booking: mockBooking,
            },
            routerStore: {
                redirectToViewBookingsPage: jest.fn(),
                redirectToViewBookingPage: jest.fn(),
            },
            appStore: {
                setAmendBookingItemPayload: jest.fn(),
            },
        });
        mockProps = createProps();
        mockRoom = deepClone(mockUnitRoom);
    });

    it('Should render children with passed props', () => {
        const altVariants = [mockTestVariant];
        mockStores.amendRoomAndBoardStore.chosenRoom = mockUnitRoom;
        mockStores.amendRoomAndBoardStore.chosenBoard = mockTestBoard;
        mockStores.amendRoomAndBoardStore.roomVariants = altVariants;
        render(<AmendRoomAndBoard {...mockProps} />);

        expect(screen.getByTestId('amend-header')).toBeInTheDocument();
        expect(screen.getByTestId('wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('wrapper')).toContainElement(screen.getByTestId('change-fee-info'));
        expect(screen.getByTestId('footer-rbc')).toBeInTheDocument();
        expect(screen.getByTestId('header-rbc')).toBeInTheDocument();
        expect(screen.getAllByTestId(PlaceholderNames.BoardTypes)).toHaveLength(1);
        expect(screen.getAllByTestId(PlaceholderNames.ChangeFeeInfo)).toHaveLength(1);
        expect(screen.getByTestId('room-section')).toBeInTheDocument();
        expect(screen.getByTestId('amend-room-and-board')).toBeInTheDocument();
        expect(mockAmendHeaderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.fields.Title,
                subtitle: mockProps.fields.Subtitle,
                rendering: mockProps.rendering,
                isAttentionMessageOn: true,
            }),
        );
        expect(mockRoomSectionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                chosenRoom: mockUnitRoom,
                showMoreExpandedTitle: 'AltRoomsExpandLabel',
                originalRoomTitle: 'OriginalRoomTitle',
                hideMoreCollapsedTitle: 'AltRoomsCollapseLabel',
                altRoomsTitle: 'AltRoomsTitle',
                pricePostfix: 'PriceSummary.Labels.Total',
                showRoomsPart: 3,
                rooms: [
                    {
                        ...mockTestRoom,
                        price: 221,
                    },
                ],
                mobileListMeta: {
                    title: 'RoomsMobileListTitle',
                    description: 'RoomsMobileListDescription',
                },
                isLoading: false,
                rendering: mockProps.rendering,
            }),
        );
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({ rendering: 'rendering', name: PlaceholderNames.BoardTypes }),
        );
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({ rendering: 'rendering', name: PlaceholderNames.ChangeFeeInfo }),
        );
        expect(mockRBCHeaderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                additionalCostLabel: 'AdditionalCostLabel',
                refundAmountLabel: 'RefundAmountLabel',
                priceTooltipContent: mockProps.fields.PriceTooltipContent,
            }),
        );
        expect(mockRBCFooterProps).toHaveBeenCalledWith(
            expect.objectContaining({
                additionalCostLabel: 'AdditionalCostLabel',
                refundAmountLabel: 'RefundAmountLabel',
                goBackLabel: 'GoBackLabel',
                goBackNoChangesLabel: 'GoBackNoChangesLabel',
                priceTooltipContent: mockProps.fields.PriceTooltipContent,
            }),
        );
    });

    it('Should return nothing when no fields', () => {
        mockProps.fields = null;
        const { container } = render(<AmendRoomAndBoard {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should return nothing when no booking', () => {
        mockStores.viewBookingStore.booking = null;
        const { container } = render(<AmendRoomAndBoard {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should initiateRoomAndBoardPage to called when component has been rendered', async () => {
        render(<AmendRoomAndBoard {...mockProps} />);

        await waitFor(() => expect(mockStores.amendRoomAndBoardStore.initiateRoomAndBoardPage).toHaveBeenCalled());
    });

    it('Should changeRoom and validateRoomVariant be called', async () => {
        mockStores.amendRoomAndBoardStore.changeRoom = jest.fn();
        mockStores.amendRoomAndBoardStore.validateRoomVariants = jest.fn();
        render(<AmendRoomAndBoard {...mockProps} />);

        await userEvent.click(screen.getByTestId('room-section'));

        expect(mockStores.amendRoomAndBoardStore.changeRoom).toHaveBeenCalled();
        expect(mockStores.amendRoomAndBoardStore.validateRoomVariants).toHaveBeenCalled();
    });

    describe('trackNewRoomOrBoardClick', () => {
        it('Should call tracking event when room is changed', async () => {
            mockStores.amendRoomAndBoardStore.changeRoom = jest.fn();
            mockStores.amendRoomAndBoardStore.validateRoomVariants = jest.fn();
            render(<AmendRoomAndBoard {...mockProps} />);

            await userEvent.click(screen.getByTestId('room-section'));

            expect(mockStores.trackingStore.roomAndBoard.trackNewRoomOrBoardClick).toHaveBeenCalledWith(
                EventTypes.PostBookingChangeRoomSelect,
                'roomType_title',
                20,
            );
        });

        it('Should use roomType.title when itemName is not available', async () => {
            mockRoom.roomType.itemName = undefined;
            mockStores.amendRoomAndBoardStore.changeRoom = jest.fn();
            mockStores.amendRoomAndBoardStore.validateRoomVariants = jest.fn();
            render(<AmendRoomAndBoard {...mockProps} />);

            await userEvent.click(screen.getByTestId('room-section'));

            expect(mockStores.trackingStore.roomAndBoard.trackNewRoomOrBoardClick).toHaveBeenCalledWith(
                EventTypes.PostBookingChangeRoomSelect,
                'roomType_title',
                20,
            );
        });
    });

    it('Should filter rooms to only roomVariants that match chosen board', () => {
        mockStores.amendRoomAndBoardStore.roomVariants = [
            mockRoomAndBoardRoomVariant,
            { ...mockRoomAndBoardRoomVariant, boardType: 'abc' },
        ];

        mockStores.amendRoomAndBoardStore.chosenRoom = {
            ...mockUnitRoom,
            boardType: {
                ...mockUnitRoom.boardType,
                code: 'abc',
            },
            code: 'cde',
        };
        mockStores.amendRoomAndBoardStore.chosenBoard = {
            ...mockUnitRoom.boardType,
            code: 'abc',
        };

        render(<AmendRoomAndBoard {...mockProps} />);

        expect(mockRoomSectionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                rooms: [mockUnitRoom],
            }),
        );
    });

    it('Should not set any rooms if no roomVariants match chosen board', () => {
        mockStores.amendRoomAndBoardStore.roomVariants = [mockRoomAndBoardRoomVariant, mockRoomAndBoardRoomVariant];

        mockStores.amendRoomAndBoardStore.chosenRoom = {
            ...mockUnitRoom,
            boardType: {
                ...mockUnitRoom.boardType,
                code: 'abc',
            },
            code: 'cde',
        };
        mockStores.amendRoomAndBoardStore.chosenBoard = {
            ...mockUnitRoom.boardType,
            code: 'abc',
        };

        render(<AmendRoomAndBoard {...mockProps} />);

        expect(mockRoomSectionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                rooms: [],
            }),
        );
    });

    it('Should render overlay spinner when isLoadingBookingFromPayload is true', () => {
        mockStores.viewBookingStore.isLoadingBookingFromPayload = true;
        const { container } = render(<AmendRoomAndBoard {...mockProps} />);

        expect(container.querySelector('.overlay-spinner')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsLabelsValidatingPackage)).toBeInTheDocument();
    });

    describe('ProductUnavailablePopup', () => {
        it('should render ProductUnavailablePopup when areOptionsNotValidated', () => {
            mockStores.amendRoomAndBoardStore.areOptionsNotValidated = true;
            render(<AmendRoomAndBoard {...mockProps} />);

            expect(mockPlaceholderProps).toHaveBeenNthCalledWith(3, {
                rendering: 'rendering',
                name: PlaceholderNames.ProductUnavailablePopup,
                onClose: expect.any(Function),
                areNoOptionsAvailable: true,
            });
        });

        it('should call onClose should call redirectToViewBookingsPage', () => {
            mockStores.amendRoomAndBoardStore.areOptionsNotValidated = true;
            render(<AmendRoomAndBoard {...mockProps} />);

            screen.getByTestId(PlaceholderNames.ProductUnavailablePopup).click();

            expect(mockStores.routerStore.redirectToViewBookingPage).toHaveBeenCalled();
        });
    });

    describe('MobileBasket', () => {
        it('Should render MobileBasket when isMobile', () => {
            mockUseMobileViewport = true;
            render(<AmendRoomAndBoard {...mockProps} />);

            expect(screen.getByTestId(PlaceholderNames.MobileBasket)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    rendering: 'rendering',
                    name: PlaceholderNames.MobileBasket,
                    hasOptionSelected: true,
                    handleSubmit: mockStores.amendRoomAndBoardStore.confirmChosenVariant,
                    price: 0,
                }),
            );
            expect(screen.getByTestId('room-and-board-basket')).toBeInTheDocument();
        });

        it('Should render MobileBasket when isMobile and with positive rounded price', () => {
            mockUseMobileViewport = true;
            mockStores.amendRoomAndBoardStore.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            mockStores.amendRoomAndBoardStore.chosenRoomVariant.fullAmendmentCharges = 10.01;
            render(<AmendRoomAndBoard {...mockProps} />);

            expect(screen.getByTestId(PlaceholderNames.MobileBasket)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    price: 11,
                }),
            );
        });

        it('Should render MobileBasket when isMobile and with negative rounded price', () => {
            mockUseMobileViewport = true;
            mockStores.amendRoomAndBoardStore.chosenRoomVariant = mockRoomAndBoardRoomVariant;
            mockStores.amendRoomAndBoardStore.chosenRoomVariant.fullAmendmentCharges = -10.01;
            render(<AmendRoomAndBoard {...mockProps} />);

            expect(screen.getByTestId(PlaceholderNames.MobileBasket)).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    price: -10,
                }),
            );
        });

        it('Should NOT render MobileBasket when is NOT mobile', () => {
            mockUseMobileViewport = false;
            render(<AmendRoomAndBoard {...mockProps} />);

            expect(screen.queryByTestId(PlaceholderNames.MobileBasket)).not.toBeInTheDocument();
            expect(screen.queryByTestId('room-and-board-basket')).not.toBeInTheDocument();
        });
    });

    describe('Unmount component', () => {
        it('Should call cancelRequests', () => {
            const { unmount } = render(<AmendRoomAndBoard {...mockProps} />);

            unmount();

            expect(mockStores.amendRoomAndBoardStore.cancelRequests).toHaveBeenCalled();
        });
    });

    it('Should render RoomSection and Board placeholder with free child place data when booking has a child', () => {
        mockStores.viewBookingStore.booking.guests[0].type = GuestType.Child;
        render(<AmendRoomAndBoard {...mockProps} />);

        expect(mockRoomSectionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                freeChildPlaceTooltip: mockProps.fields.FreeChildPlaceTooltip.value,
                countryCode: mockStores.viewBookingStore.booking.hotel.country.code,
            }),
        );
        expect(mockPlaceholderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                freeChildPlaceTooltip: mockProps.fields.FreeChildPlaceTooltip.value,
                countryCode: mockStores.viewBookingStore.booking.hotel.country.code,
            }),
        );
    });
});
