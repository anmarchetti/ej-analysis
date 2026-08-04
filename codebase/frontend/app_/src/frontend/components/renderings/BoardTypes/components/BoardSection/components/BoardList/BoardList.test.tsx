import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { allInclusiveBoard, halfBoard } from 'frontend/__mocks__/boards';
import { IOffer, IUnit } from 'models/data/IOffer';
import { BoardTypeActionButtonType } from 'models/enum/BoardTypeActionButtonType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IAlterationResultItem } from 'frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer';
import { boardTypesFields } from 'frontend/components/renderings/BoardTypes/components/__mocks__/boardTypesFields';

import BoardList, { IBoardListProps } from './BoardList';

expect.extend(toHaveNoViolations);

const mockPriceLabelComponent = jest.fn();
jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => props => {
    mockPriceLabelComponent(props);

    return <div data-tid='price-label'>{props.price}</div>;
});

jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: jest.fn(() => true),
}));

const getMockedNewAlternativeRoom = (isKidsPlaceWilBeRemoved: boolean) =>
    ({
        isKidsPlaceWilBeRemoved,
    } as IAlterationResultItem<IUnit>);

let mockNewAlternativeRooms;

jest.mock('frontend/components/renderings/BoardTypes/components/BoardSection/BoardSection.utils', () => ({
    ...jest.requireActual('frontend/components/renderings/BoardTypes/components/BoardSection/BoardSection.utils'),
    getNewAlternativeRooms: jest.fn(() => mockNewAlternativeRooms),
}));

const mockBoardCardComponent = jest.fn();

jest.mock('frontend/components/renderings/BoardTypes/components/BoardCard/BoardCard', () => ({
    __esModule: true,
    default: ({ infoBlock, children, ...props }) => {
        mockBoardCardComponent(props);

        return (
            <div data-tid='board-card'>
                {infoBlock}
                {children}
            </div>
        );
    },
}));

const mockBoardTypeActionButtonComponent = jest.fn();

jest.mock('frontend/components/renderings/BoardTypes/components/BoardTypeActionButton/BoardTypeActionButton', () => ({
    __esModule: true,
    default: ({ onClick, children, ...props }) => {
        mockBoardTypeActionButtonComponent(props);

        return (
            <div data-tid='board-type-action-button'>
                <button onClick={onClick}>onChangeBoard</button>
                <div>{children}</div>
            </div>
        );
    },
}));

const mockSelectBoardTypeErrorComponent = jest.fn();

jest.mock('frontend/components/renderings/BoardTypes/components/SelectBoardTypeError/SelectBoardTypeError', () => ({
    __esModule: true,
    default: props => {
        mockSelectBoardTypeErrorComponent(props);

        return <div data-tid='select-board-type-error' />;
    },
}));
const mockAlertBannerComponent = jest.fn();

jest.mock('frontend/components/common/AlertBanner/AlertBanner', () => ({
    __esModule: true,
    default: props => {
        mockAlertBannerComponent(props);

        return <div data-tid='alert-banner' />;
    },
}));

const mockBoard = { ...allInclusiveBoard, price: 1569.01, pricePP: 785.01 };
const createProps = (): IBoardListProps => {
    const fields = boardTypesFields();

    return {
        items: [mockBoard],
        isCollapsed: true,
        isMostExpensiveBoardSelected: false,
        freeChildPlaceTooltip: 'freeChildPlaceTooltip',
        countryCode: 'ES',
        selectedRooms: [
            {
                code: 'B01',
                price: 803,
                pricePP: 402,
                board: 'AS',
                roomType: {
                    code: 'B01',
                    title: {
                        value: 'Double standard',
                    },
                    images: [{ small: '', medium: '', large: '' }],
                    description: 'description',
                    content: 'content',
                    iconUrl: 'iconUrl',
                    facilities: [],
                    stays: [],
                },
                isExt: false,
                originalCode: 'B01',
                boardType: {
                    description: 'boardTypeDescription',
                    code: 'HB',
                    title: 'Half board',
                    content: 'content',
                    iconUrl: '/-/jssmedia/ee09ab1161a34c1e93d08579844d9db0.ashx',
                },
                occupation: { adults: 1, children: 0, infants: 0, paxIds: [], childAges: [] },
            },
        ],
        alternativeBoardsCount: 2,
        onChangeBoard: jest.fn(),
        freeChildPlaceInfoTitle: fields.FreeChildPlaceInfoTitle,
        freeChildPlaceInfoText: fields.FreeChildPlaceInfoText,
        alterationInfoText: fields.AlterationInfoText,
        alterationInfoTitle: fields.AlterationInfoTitle,
        altTitleField: fields.AlternativeBoardsTitlePlural,
        offer: {
            price: 105,
            pricePP: 53,
            accom: {
                unit: [
                    {
                        code: 'B01',
                        price: 803,
                        pricePP: 402,
                        board: 'AS',
                        roomType: {
                            code: 'B01',
                            title: {
                                value: 'Double standard',
                            },
                            images: [{ small: '' }],
                        },
                        originalCode: 'B01',
                        isFreeForKids: true,
                        occupation: {
                            adults: 2,
                            children: 1,
                        },
                    },
                ],
            },
        } as IOffer,
        selectedBoardTypeCode: mockBoard.code,
        isPostBooking: false,
    };
};

let mockStores;
let props = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BoardList />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            bookingStore: {
                boardCodeError: 'boardCodeError',
                alternativeRooms: [
                    [
                        { code: 'B01', isFreeForKids: false },
                        { code: 'B02', isFreeForKids: false },
                    ],
                ],
                isLoadingOffer: false,
                notValidatedOfferPricePP: 0,
                notValidatedOfferPrice: 900,
            },
            marketStore: { formatMoney: jest.fn(a => `+£${a}`) },
        });
        props = createProps();
        mockNewAlternativeRooms = [];
    });

    it('should standard render', () => {
        render(<BoardList {...props} />);

        expect(screen.getByTestId('board-item-0')).toBeInTheDocument();
        expect(screen.getByTestId('board-item-0').classList.contains('spoilerBox')).toBeFalsy();
        expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();

        const boardCard = screen.getByTestId('board-card');

        expect(boardCard).toBeInTheDocument();
        expect(mockBoardCardComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                board: mockBoard,
                isSelected: true,
                isSpoiler: false,
                freeChildPlaceTooltip: props.freeChildPlaceTooltip,
                countryCode: props.countryCode,
            }),
        );
        expect(within(boardCard).getByTestId('board-type-action-button')).toBeInTheDocument();
        expect(mockBoardTypeActionButtonComponent).toHaveBeenCalledWith({
            buttonType: BoardTypeActionButtonType.Selected,
        });
        expect(within(boardCard).queryByTestId('alert-banner')).not.toBeInTheDocument();
        expect(screen.queryByTestId('select-board-type-error')).not.toBeInTheDocument();
    });

    describe('board card alert banners', () => {
        it('should render alteration info alert when getNewAlternativeRooms func returns not empty array', () => {
            mockNewAlternativeRooms = [getMockedNewAlternativeRoom(false)];
            render(<BoardList {...props} />);

            expect(within(screen.getByTestId('board-card')).getAllByTestId('alert-banner')).toHaveLength(1);
            expect(mockAlertBannerComponent).toHaveBeenCalledWith({
                dataTid: 'alteration-info-banner',
                title: props.alterationInfoTitle.value,
                description: props.alterationInfoText.value,
                collapsible: false,
                isInline: true,
            });
        });

        it('should render alteration info and free child place alerts when getNewAlternativeRooms func returns not empty array with specific room', () => {
            mockNewAlternativeRooms = [getMockedNewAlternativeRoom(true)];
            render(<BoardList {...props} />);

            expect(screen.getByTestId('board-item-0')).toBeInTheDocument();

            const boardCard = screen.getByTestId('board-card');

            expect(within(boardCard).getAllByTestId('alert-banner')).toHaveLength(2);
            expect(mockAlertBannerComponent).toHaveBeenCalledWith({
                dataTid: 'alteration-info-banner',
                title: props.alterationInfoTitle.value,
                description: props.alterationInfoText.value,
                collapsible: false,
                isInline: true,
            });
            expect(mockAlertBannerComponent).toHaveBeenCalledWith({
                dataTid: 'free-child-place-info-banner',
                title: props.freeChildPlaceInfoTitle.value,
                description: props.freeChildPlaceInfoText.value,
                collapsible: false,
                isInline: true,
            });
        });
    });

    describe('spoilerBox classname', () => {
        beforeEach(() => {
            props.isCollapsed = true;
        });

        it('should render parent div tag of last item with spoilerBox classname when isCollapsed prop is true and items length is greater then 1', () => {
            props.items = [allInclusiveBoard, halfBoard];
            props.isMostExpensiveBoardSelected = true;

            render(<BoardList {...props} />);

            expect(screen.getByTestId('board-item-0').classList.contains('spoilerBox')).toBeFalsy();
            expect(screen.getByTestId('board-item-1').classList.contains('spoilerBox')).toBeTruthy();
        });

        it('should render parent div tag with spoilerBox classname when isCollapsed is true, isMostExpensiveBoardSelected is false and items length is greater then 2', () => {
            props.items = [allInclusiveBoard, halfBoard, allInclusiveBoard];

            render(<BoardList {...props} />);

            expect(screen.getByTestId('board-item-0').classList.contains('spoilerBox')).toBeFalsy();
            expect(screen.getByTestId('board-item-1').classList.contains('spoilerBox')).toBeFalsy();
            expect(screen.getByTestId('board-item-2').classList.contains('spoilerBox')).toBeTruthy();
        });

        it('should render parent div tags without spoilerBox classname when isCollapsed and isMostExpensiveBoardSelected are true and items length is greater then 2', () => {
            props.items = [allInclusiveBoard, halfBoard, allInclusiveBoard];
            props.isMostExpensiveBoardSelected = true;

            render(<BoardList {...props} />);

            expect(screen.getByTestId('board-item-0').classList.contains('spoilerBox')).toBeFalsy();
            expect(screen.getByTestId('board-item-1').classList.contains('spoilerBox')).toBeFalsy();
            expect(screen.getByTestId('board-item-2').classList.contains('spoilerBox')).toBeFalsy();
        });
    });

    it('should render alternative boards count heading when isCollapsed prop is true', () => {
        props.items = [allInclusiveBoard, halfBoard];

        render(<BoardList {...props} />);

        const altBoardsCountHeading = screen.getByRole('heading', { level: 3 });

        expect(altBoardsCountHeading.classList.contains('boardsSubtitle')).toBeTruthy();
        expect(within(altBoardsCountHeading).getByText(props.altTitleField!.value)).toBeTruthy();
        expect(within(altBoardsCountHeading).getByText(2)).toBeTruthy();
    });

    it('should render BoardTypeActionButton component with specific title when selectedBoardTypeCode is not equal to item code and isPricesHidden is false', () => {
        props.selectedBoardTypeCode = halfBoard.code;

        render(<BoardList {...props} />);

        expect(screen.getByTestId('board-type-action-button')).toHaveTextContent('onChangeBoard+£733');
        expect(mockBoardTypeActionButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                buttonType: BoardTypeActionButtonType.Price,
                isLoading: mockStores.bookingStore.isLoadingOffer,
            }),
        );
    });

    it('should render BoardTypeActionButton component with specific title when selectedBoardTypeCode is not equal to item code and isPricesHidden is false on extras page', () => {
        props.selectedBoardTypeCode = halfBoard.code;
        mockStores.layoutStore.isExtrasPage = true;

        render(<BoardList {...props} />);

        expect(screen.getByTestId('board-type-action-button')).toHaveTextContent('onChangeBoard+£335');
        expect(mockBoardTypeActionButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                buttonType: BoardTypeActionButtonType.Price,
                isLoading: mockStores.bookingStore.isLoadingOffer,
            }),
        );
    });

    it('should render BoardTypeActionButton component with specific title when selectedBoardTypeCode is not equal to item code NOT on extras page', () => {
        props.selectedBoardTypeCode = halfBoard.code;
        mockStores.layoutStore.isExtrasPage = false;
        props.offer = {
            accom: {
                unit: [
                    {
                        code: 'B01',
                        price: 803,
                        pricePP: 402,
                        board: 'AS',
                        roomType: {
                            code: 'B01',
                            title: {
                                value: 'Double standard',
                            },
                            images: [{ small: '' }],
                        },
                        originalCode: 'B01',
                        isFreeForKids: true,
                        occupation: {
                            adults: 2,
                            children: 1,
                        },
                    },
                ],
            },
        } as unknown as IOffer;

        render(<BoardList {...props} />);

        expect(screen.getByTestId('board-type-action-button')).toHaveTextContent('onChangeBoard+£785');
        expect(mockBoardTypeActionButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                buttonType: BoardTypeActionButtonType.Price,
                isLoading: mockStores.bookingStore.isLoadingOffer,
            }),
        );
    });

    it('should render BoardTypeActionButton component with specific title when selectedBoardTypeCode is not equal to item code and isPricesHidden is true', () => {
        props.selectedBoardTypeCode = halfBoard.code;
        mockStores.layoutStore.isPricesHidden = true;

        render(<BoardList {...props} />);

        expect(screen.getByTestId('board-type-action-button')).toHaveTextContent(
            'onChangeBoardBoardTypes.Labels.Select',
        );
        expect(mockBoardTypeActionButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                buttonType: BoardTypeActionButtonType.Price,
                isLoading: mockStores.bookingStore.isLoadingOffer,
            }),
        );
    });

    it('should render BoardTypeActionButton component with price post booking type if isPostBooking is true', () => {
        props.isPostBooking = true;
        props.selectedBoardTypeCode = halfBoard.code;

        render(<BoardList {...props} />);

        expect(screen.getByTestId('board-type-action-button')).toHaveTextContent('onChangeBoard');
        expect(mockBoardTypeActionButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                buttonType: BoardTypeActionButtonType.PricePB,
                isLoading: mockStores.bookingStore.isLoadingOffer,
            }),
        );
        expect(mockPriceLabelComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'board-type__price',
                priceDictionary: 'Globals.PriceLabels.PerPerson',
                tag: 'span',
            }),
        );
        expect(screen.getByText('+ £1570')).toBeInTheDocument();
        expect(screen.getByText('PriceSummary.Labels.Total')).toBeInTheDocument();
    });

    it('should render PriceLabel with undefined priceDictionary when pricePP is NOT shown', () => {
        props.isPostBooking = true;
        props.selectedBoardTypeCode = halfBoard.code;
        props.offer!.price = 53;

        render(<BoardList {...props} />);

        expect(mockPriceLabelComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'board-type__price',
                priceDictionary: undefined,
                tag: 'span',
            }),
        );
    });

    it('should call onChangeBoard with expected params when click BoardTypeActionButton price button', () => {
        props.selectedBoardTypeCode = halfBoard.code;
        render(<BoardList {...props} />);

        fireEvent.click(screen.getByRole('button', { name: 'onChangeBoard' }));

        expect(props.onChangeBoard).toHaveBeenCalledWith(props.items[0], 733);
    });

    it('should render SelectBoardTypeError component when boardCodeError is equal to item board code', () => {
        mockStores.bookingStore.boardCodeError = allInclusiveBoard.code;

        render(<BoardList {...props} />);

        expect(screen.getByTestId('select-board-type-error')).toBeInTheDocument();
        expect(mockSelectBoardTypeErrorComponent).toHaveBeenCalledWith({
            errorMessage: SitecoreDictionary.BoardTypesErrorMessagesSelectBoardType,
        });
    });

    it('should not render SelectBoardTypeError component when item with error is a spoiler', () => {
        mockStores.bookingStore.boardCodeError = halfBoard.code;
        props.items = [allInclusiveBoard, halfBoard];
        props.isMostExpensiveBoardSelected = true;

        render(<BoardList {...props} />);

        expect(screen.queryByTestId('select-board-type-error')).not.toBeInTheDocument();
        expect(mockSelectBoardTypeErrorComponent).not.toBeCalled();
    });

    it('should pass isPostBooking prop to BoardCard component', () => {
        props.isPostBooking = true;

        render(<BoardList {...props} />);

        expect(mockBoardCardComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isPostBooking: true,
            }),
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            props.items = [allInclusiveBoard, halfBoard];
            props.isMostExpensiveBoardSelected = true;
            const { container } = render(<BoardList {...props} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });

        it('should render tab index of -1 for button when board is spoiler', () => {
            props.isCollapsed = true;
            props.items = [allInclusiveBoard, halfBoard];
            props.isMostExpensiveBoardSelected = true;
            render(<BoardList {...props} />);

            expect(mockBoardTypeActionButtonComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    tabIndex: -1,
                }),
            );
        });
    });
});
