import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { ExperimentTestIds, ExperimentVariants } from 'models/enum/cro/Experiment';

import { Basket, IBasketProps } from './Basket';

const createNotEmptyOffer = (depDate = '', arrDate = '') =>
    ({
        accom: {
            unit: [
                {
                    occupation: {
                        adults: 2,
                        children: 1,
                        infants: 1,
                    },
                },
            ],
        },
        transport: {
            routes: [{ depDate }, { arrDate }],
        },
    } as any);

const createStores = () =>
    createMockStores({
        layoutStore: {
            getPhrase: jest.fn(p => p),
            isPricesHidden: true,
            isTradePortal: true,
            isSummaryBarEnabled: false,
            isSummaryBarHidden: false,
            isExtrasPage: true,
            isGuestDetailsPage: false,
        },
        engageStore: { contentOrder: null },
        bookingStore: {
            selectedOffer: createNotEmptyOffer(),
            boardType: null,
            room: undefined,
            isPackageValid: true,
            totalPricePP: 0,
            totalPrice: 0,
            isLoadingOffer: false,
        },
        searchStore: {
            isEditSearchCriteriaBtnClicked: false,
            setEditSearchCriteriaBtnClicked: jest.fn(),
            setIsSearchPodExpanded: jest.fn(),
        },
        appStore: {
            isScreenLessMedium: false,
            isScreenLessLarge: false,
            isLoading: false,
        },
    });

const navigationTabs = [
    {
        id: 'tab-0',
        fields: {
            Id: { value: 'tab-id' },
            Name: { value: 'Tab Name' },
            Icon: { value: { src: '/img/tab.svg', alt: '' } },
        },
    },
];

const resetMocks = () =>
    ({
        fields: {
            NavigationTabs: navigationTabs,
        } as any,
        params: {} as any,
        rendering: {} as any,
        isNotSticky: true,
    } as IBasketProps);

let mockStores = createStores();
let mocks = resetMocks();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/StickyBox', () => ({
    __esModule: true,
    default: ({ render }) => <div data-tid='sticky-box'>{render({}, { isSticky: true })}</div>,
}));

const mockBasketVerticalCells = jest.fn();
jest.mock('./components/BasketVerticalCells/BasketVerticalCells', () => ({
    __esModule: true,
    default: props => {
        mockBasketVerticalCells(props);

        return <div data-tid='basket-vertical-cells'>{props.children}</div>;
    },
}));

jest.mock('frontend/components/cro/BasketVerticalCellsAB/BasketVerticalCellsAB', () => ({
    __esModule: true,
    default: () => <div data-tid='basket-vertical-cells-ab' />,
}));

const mockBasketDiagonalCells = jest.fn();
jest.mock('frontend/components/renderings/Basket/components/BasketDiagonalCells', () => ({
    __esModule: true,
    default: props => {
        mockBasketDiagonalCells(props);

        return <div data-tid='basket-diagonal-cells'>{props.children}</div>;
    },
}));

jest.mock('frontend/components/cro/BasketAB/components/BasketDiagonalCellsAB', () => ({
    __esModule: true,
    default: () => <div data-tid='basket-diagonal-cells-ab' />,
}));

const mockUseNavigationTabsList = jest.fn(tabs => tabs ?? []);
jest.mock('./components/NavigationTabs/NavigationTabs.utils', () => ({
    __esModule: true,
    useNavigationTabsList: tabs => mockUseNavigationTabsList(tabs),
}));

jest.mock('./components/NavigationTabs/NavigationTabs', () => ({
    __esModule: true,
    default: () => <div data-tid='navigation-tabs' />,
}));

describe('<Basket />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mocks = resetMocks();
        mockUseNavigationTabsList.mockClear();
    });

    it('should render component when offer received and isPackageValid is true', () => {
        const { container } = render(<Basket {...mocks} />);

        expect(container).not.toBeEmptyDOMElement();
    });

    it('should NOT render when no offer received', () => {
        mockStores.bookingStore.selectedOffer = null;

        const { container } = render(<Basket {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isPackageValid is false', () => {
        mockStores.bookingStore.isPackageValid = false;

        const { container } = render(<Basket {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render shimmer when initial loading', () => {
        mockStores.appStore.isLoading = true;
        mockStores.bookingStore.selectedOffer = null;

        render(<Basket {...mocks} />);

        expect(screen.getByTestId('shimmer')).toBeInTheDocument();
    });

    it('should render shimmer when loading offer', () => {
        mockStores.bookingStore.isLoadingOffer = true;
        mockStores.bookingStore.selectedOffer = null;

        render(<Basket {...mocks} />);

        expect(screen.getByTestId('shimmer')).toBeInTheDocument();
    });

    it('should render StickyBox when isNotSticky is false', () => {
        mocks.isNotSticky = false;

        render(<Basket {...mocks} />);

        expect(screen.getByTestId('sticky-box')).toBeInTheDocument();
    });

    it('should NOT render NavigationTabs when isHotelDetailsBookPage is false', () => {
        mocks.isNotSticky = false;
        mockStores.layoutStore.isHotelDetailsBookPage = false;

        render(<Basket {...mocks} />);

        expect(screen.queryByTestId('navigation-tabs')).not.toBeInTheDocument();
    });

    it('should NOT render NavigationTabs when isNotSticky is true', () => {
        mocks.isNotSticky = true;
        mockStores.layoutStore.isHotelDetailsBookPage = true;

        render(<Basket {...mocks} />);

        expect(screen.queryByTestId('navigation-tabs')).not.toBeInTheDocument();
    });

    it('should render NavigationTabs on hotel details page', () => {
        mocks.isNotSticky = false;
        mockStores.layoutStore.isHotelDetailsBookPage = true;

        render(<Basket {...mocks} />);

        expect(screen.getByTestId('navigation-tabs')).toBeInTheDocument();
        expect(mockUseNavigationTabsList).toHaveBeenCalledWith(navigationTabs);
    });

    it('should render BasketVerticalCells when isScreenLessMedium is true', () => {
        mockStores.appStore.isScreenLessMedium = true;

        const { container } = render(<Basket {...mocks} />);

        expect(container.querySelector('.basket')).toBeInTheDocument();
        expect(container.querySelector('.basket.basket--booked')).not.toBeInTheDocument();
        expect(container.querySelector('.basket__side-left')).toBeInTheDocument();
        expect(screen.getByTestId('basket-vertical-cells')).toBeInTheDocument();
        expect(container.querySelector('.basket__side-right')).toBeInTheDocument();
        expect(container.querySelector('.basket__side-right.basket__side-right--grey')).not.toBeInTheDocument();
    });

    it('should render BasketDiagonalCells when isScreenExtraSmall is false', () => {
        render(<Basket {...mocks} />);

        expect(screen.queryByTestId('basket-diagonal-cells')).toBeInTheDocument();
    });

    it('should add additional class to basket__side-right div when isPriceVisible is true', () => {
        mockStores.layoutStore.isPricesHidden = false;

        const { container } = render(<Basket {...mocks} />);

        expect(container.querySelector('.basket__side-right')).toBeInTheDocument();
    });

    it('should add additional class to basket div when IsNextButtonHidden param is true', () => {
        mocks.params = { IsNextButtonHidden: true };

        const { container } = render(<Basket {...mocks} />);

        expect(container.querySelector('.basket.basket--booked')).toBeInTheDocument();
    });

    it('should add class from props to basket div when className prop is defined', () => {
        mocks.className = 'className';

        const { container } = render(<Basket {...mocks} />);

        expect(container.querySelector('.basket.className')).toBeInTheDocument();
    });

    describe('AB Testing EHD-280: mobile summary bar redesign', () => {
        beforeEach(() => {
            mockStores.appStore.isScreenLessMedium = true;
        });

        afterEach(() => {
            delete window['dataLayer'];
        });

        it('should render default variant', () => {
            render(<Basket {...mocks} />);

            expect(screen.getByTestId('basket-vertical-cells')).toBeInTheDocument();
            expect(screen.queryByTestId('basket-vertical-cells-ab')).not.toBeInTheDocument();
        });

        it('should render variantA with new mobile summary bar desktop', () => {
            Object.defineProperty(window, 'dataLayer', {
                configurable: true,
                value: [{ testId: ExperimentTestIds.Basket, testVariant: ExperimentVariants.VariantA }],
            });

            render(<Basket {...mocks} />);

            expect(screen.getByTestId('basket-vertical-cells-ab')).toBeInTheDocument();
            expect(screen.queryByTestId('basket-vertical-cells')).not.toBeInTheDocument();
        });
    });

    describe('AB Testing EHD-111: Summary Bar EUX - Desktop', () => {
        afterEach(() => {
            delete window['dataLayer'];
        });

        it('should return default variant: old summary bar desktop design', () => {
            render(<Basket {...mocks} />);

            expect(screen.getByTestId('basket-diagonal-cells')).toBeInTheDocument();
            expect(screen.queryByTestId('basket-diagonal-cells-ab')).not.toBeInTheDocument();
        });

        it('should return variantA: new summary bar desktop design', () => {
            Object.defineProperty(window, 'dataLayer', {
                configurable: true,
                value: [{ testId: ExperimentTestIds.Non, testVariant: ExperimentVariants.VariantA }],
            });

            render(<Basket {...mocks} />);

            expect(screen.queryByTestId('basket-diagonal-cells')).not.toBeInTheDocument();
            expect(screen.getByTestId('basket-diagonal-cells-ab')).toBeInTheDocument();
        });
    });

    describe('render/display basket depending on the Summary bar toggle ', () => {
        it('should render the basket for screens less than medium when IsSummaryBarEnabled is enabled', () => {
            mockStores.layoutStore.isSummaryBarEnabled = true;
            mockStores.appStore.isScreenLessMedium = true;
            mockStores.appStore.isScreenLessLarge = true;

            const { container } = render(<Basket {...mocks} />);

            expect(container).not.toBeEmptyDOMElement();
        });

        it('should render the basket for screens less than large when IsSummaryBarEnabled is enabled', () => {
            mockStores.layoutStore.isSummaryBarEnabled = true;
            mockStores.appStore.isScreenLessMedium = false;
            mockStores.appStore.isScreenLessLarge = true;

            const { container } = render(<Basket {...mocks} />);

            expect(container).not.toBeEmptyDOMElement();
        });

        it('should render the basket in mobile when IsSummaryBarEnabled is disabled', () => {
            mockStores.appStore.isScreenLessMedium = true;

            const { container } = render(<Basket {...mocks} />);

            expect(container).not.toBeEmptyDOMElement();
        });

        it('should render the basket for screens less than large when IsSummaryBarEnabled is disabled', () => {
            mockStores.appStore.isScreenLessMedium = false;
            mockStores.appStore.isScreenLessLarge = true;

            const { container } = render(<Basket {...mocks} />);

            expect(container).not.toBeEmptyDOMElement();
        });

        it('should include the summaryBarBasket className when IsSummaryBarEnabled is enabled', () => {
            mockStores.appStore.isScreenLessMedium = false;
            mockStores.appStore.isScreenLessLarge = true;
            mockStores.layoutStore.isExtrasPage = false;
            mockStores.layoutStore.isGuestDetailsPage = true;
            mockStores.layoutStore.isSummaryBarEnabled = true;

            const { container } = render(<Basket {...mocks} />);

            expect(container.firstChild?.firstChild).toHaveClass('summaryBarBasket');
        });

        it('should not include the summaryBarBasket className when IsSummaryBarEnabled is disabled', () => {
            mockStores.appStore.isScreenLessMedium = true;
            mockStores.appStore.isScreenLessLarge = true;
            mockStores.layoutStore.isSummaryBarEnabled = false;

            const { container } = render(<Basket {...mocks} />);

            expect(container.firstChild?.firstChild).not.toHaveClass('summaryBarBasket');
        });

        it('should NOT render the basket in desktop when IsSummaryBarEnabled is enabled', () => {
            mockStores.layoutStore.isSummaryBarEnabled = true;

            const { container } = render(<Basket {...mocks} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should render the basket in desktop when IsSummaryBarEnabled is enabled but the user is not in extras page', () => {
            mockStores.layoutStore.isExtrasPage = false;
            mockStores.layoutStore.isSummaryBarEnabled = true;

            const { container } = render(<Basket {...mocks} />);

            expect(container).not.toBeEmptyDOMElement();
        });

        it('should render the basket in desktop when IsSummaryBarEnabled is disabled', () => {
            const { container } = render(<Basket {...mocks} />);

            expect(container).not.toBeEmptyDOMElement();
        });

        it.each([
            [false, true, true, 'summary-bar-old'],
            [true, false, true, 'summary-bar'],
        ])(
            'should have the appropriate "data-tid" depending on the basket rendered (old or new) in mobile',
            (isSummaryBarEnabled, isSummaryBarHidden, isExtrasPage, expectedAttribute) => {
                mockStores.layoutStore.isSummaryBarEnabled = isSummaryBarEnabled;
                mockStores.layoutStore.isSummaryBarHidden = isSummaryBarHidden;
                mockStores.layoutStore.isExtrasPage = isExtrasPage;
                mockStores.appStore.isScreenLessLarge = true;
                mockStores.appStore.isScreenLessMedium = true;

                const { container } = render(<Basket {...mocks} />);

                expect(container.firstChild?.firstChild).toHaveAttribute('data-tid', expectedAttribute);
            },
        );

        it('should have the appropriate "data-tid" when both baskets (old and new) are rendered in mobile', () => {
            mockStores.layoutStore.isSummaryBarEnabled = true;
            mockStores.layoutStore.isSummaryBarHidden = true;
            mockStores.layoutStore.isExtrasPage = true;
            mockStores.appStore.isScreenLessLarge = true;
            mockStores.appStore.isScreenLessMedium = true;

            const { container } = render(<Basket {...mocks} />);

            expect(container.firstChild?.childNodes[0]).toHaveAttribute('data-tid', 'summary-bar');
            expect(container.firstChild?.childNodes[1]).toHaveAttribute('data-tid', 'summary-bar-old');
        });

        it.each([
            { isSummaryBarEnabled: true, isSummaryBarHidden: true },
            { isSummaryBarEnabled: false, isSummaryBarHidden: true },
        ])('should NOT have a "data-tid" when rendered on desktop', query => {
            mockStores.layoutStore.isSummaryBarEnabled = query.isSummaryBarEnabled;
            mockStores.layoutStore.isSummaryBarHidden = query.isSummaryBarHidden;
            mockStores.appStore.isScreenLessLarge = false;
            mockStores.appStore.isScreenLessMedium = false;

            const { container } = render(<Basket {...mocks} />);

            expect(container.firstChild?.firstChild).not.toHaveAttribute('data-tid', 'summary-bar');
            expect(container.firstChild?.firstChild).not.toHaveAttribute('data-tid', 'summary-bar-old');
        });

        it('should NOT render the basket (in desktop) if isSummaryBarEnabled is true and isSummaryBarHidden is false', async () => {
            mockStores.layoutStore.isSummaryBarEnabled = true;
            mockStores.layoutStore.isSummaryBarHidden = false;

            const { container } = render(<Basket {...mocks} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should display the basket (in desktop) if isSummaryBarEnabled and isSummaryBarHidden are true', async () => {
            mockStores.layoutStore.isSummaryBarEnabled = true;
            mockStores.layoutStore.isSummaryBarHidden = true;

            render(<Basket {...mocks} />);

            expect(screen.queryByTestId('basket-container')).toBeInTheDocument();
        });

        it('should display the basket (in desktop) if isSummaryBarEnabled and isSummaryBarHidden are false', async () => {
            mockStores.layoutStore.isSummaryBarEnabled = false;

            render(<Basket {...mocks} />);

            expect(screen.queryByTestId('basket-container')).toBeInTheDocument();
        });

        it('should NOT render the old basket (in mobile) if isSummaryBarEnabled is true and isSummaryBarHidden is false', async () => {
            mockStores.layoutStore.isSummaryBarEnabled = true;
            mockStores.layoutStore.isSummaryBarHidden = false;
            mockStores.appStore.isScreenLessLarge = true;
            mockStores.appStore.isScreenLessMedium = true;

            render(<Basket {...mocks} />);

            expect(screen.queryByTestId('summary-bar-old')).not.toBeInTheDocument();
        });

        it('should display the old basket (in mobile) if isSummaryBarEnabled and isSummaryBarHidden are true', async () => {
            mockStores.layoutStore.isSummaryBarEnabled = true;
            mockStores.layoutStore.isSummaryBarHidden = true;
            mockStores.appStore.isScreenLessLarge = true;
            mockStores.appStore.isScreenLessMedium = true;

            render(<Basket {...mocks} />);

            expect(screen.queryByTestId('summary-bar-old')).not.toHaveClass('isHidden');
        });

        it('should display the old basket (in mobile) if isSummaryBarEnabled and isSummaryBarHidden are false', async () => {
            mockStores.layoutStore.isSummaryBarEnabled = false;
            mockStores.layoutStore.isSummaryBarHidden = false;
            mockStores.appStore.isScreenLessLarge = true;
            mockStores.appStore.isScreenLessMedium = true;

            render(<Basket {...mocks} />);

            expect(screen.queryByTestId('summary-bar-old')).not.toHaveClass('isHidden');
        });

        it('should display the new basket (in mobile) if isSummaryBarEnabled is true and isSummaryBarHidden is false', async () => {
            mockStores.layoutStore.isSummaryBarEnabled = true;
            mockStores.layoutStore.isSummaryBarHidden = false;
            mockStores.appStore.isScreenLessLarge = true;
            mockStores.appStore.isScreenLessMedium = true;

            render(<Basket {...mocks} />);

            expect(screen.queryByTestId('summary-bar')).not.toHaveClass('isHidden');
        });

        it('should not display (but render) the new basket (in mobile) if isSummaryBarEnabled and isSummaryBarHidden are true', async () => {
            mockStores.layoutStore.isSummaryBarEnabled = true;
            mockStores.layoutStore.isSummaryBarHidden = true;
            mockStores.appStore.isScreenLessLarge = true;
            mockStores.appStore.isScreenLessMedium = true;

            render(<Basket {...mocks} />);

            expect(screen.queryByTestId('summary-bar')).toHaveClass('isHidden');
        });

        it('should NOT render the new basket (in mobile) if isSummaryBarEnabled and isSummaryBarHidden are false', async () => {
            mockStores.layoutStore.isSummaryBarEnabled = false;
            mockStores.layoutStore.isSummaryBarHidden = false;
            mockStores.appStore.isScreenLessLarge = true;
            mockStores.appStore.isScreenLessMedium = true;

            render(<Basket {...mocks} />);

            expect(screen.queryByTestId('summary-bar')).not.toBeInTheDocument();
        });

        it('should NOT display the basket (in mobile) if not extra page', async () => {
            mockStores.layoutStore.isExtrasPage = false;
            mockStores.layoutStore.isSummaryBarEnabled = true;
            mockStores.layoutStore.isSummaryBarHidden = true;
            mockStores.appStore.isScreenLessLarge = true;
            mockStores.appStore.isScreenLessMedium = true;

            const { container } = render(<Basket {...mocks} />);

            expect(container.firstChild?.firstChild).not.toHaveAttribute('data-tid', 'summary-bar');
        });
    });
});
