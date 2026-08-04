import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { luggageInfoMock } from 'frontend/__mocks__/extraLuggage';
import { IBoardType, IRoomType } from 'models/data/IHotel';

import BoardSectionButton, { IBoardSectionButtonProps } from './BoardSectionButton';

const mockShowMoreButtonComponent = jest.fn();

jest.mock('frontend/components/common/ShowMoreButton', () => ({
    __esModule: true,
    default: props => {
        mockShowMoreButtonComponent(props);

        return <button data-tid='show-more-button' />;
    },
}));

jest.mock('frontend/components/icons-new/ExternalLink', () => ({
    __esModule: true,
    default: ({ className }) => <svg className={className} data-tid='icon-ext-link' />,
}));

const createStores = () => ({
    appStore: {
        isScreenMedium: true,
    },
    layoutStore: {
        isExtrasPage: false,
    },
});

const createProps = () =>
    ({
        isCollapsed: false,
        alternativeBoardsCount: 2,
        handleShowMore: jest.fn(),
        offer: {
            extraLuggageInfo: luggageInfoMock,
            accom: {
                unit: [
                    {
                        code: '1',
                        board: 'board',
                        boardType: {
                            name: 'test',
                        } as IBoardType,
                        roomType: {
                            name: 'test',
                        } as IRoomType,
                        occupation: { adults: 1, children: 0, infants: 0, paxIds: [], childAges: [] },
                        price: 100,
                        pricePP: 100,
                        isExt: false,
                    },
                ],
                code: '1',
                date: '2020-02-09T00:00:00',
                stay: 3,
                id: 'unitId',
                packageId: 'packageId',
                prom: 'prom',
                isExt: false,
            },
            id: 'offerId',
            stay: 3,
            price: 100,
            pricePP: 100,
            totalPrice: 100,
            transferPrice: 10,
            altBoards: [],
            transfers: [],
            ecoFacility: {
                name: '',
                tooltip: '',
            },
            hasDistressedFlights: false,
            date: '2020-02-09T00:00:00',
            transport: { routes: [] },
            hotel: null,
            packageId: 'packageId',
            prom: 'prom',
            isExt: false,
            touristTax: 0,
            touristTaxPP: 0,
            hasDiscountedBoardUpgrade: false,
            priceExcludingTouristTax: 100,
            pricePPExcludingTouristTax: 100,
        },
        title: 'editLabelText',
        isMostExpensiveBoardSelected: false,
    } as IBoardSectionButtonProps);

let mockStores;
let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BoardSectionButton />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    describe('empty render', () => {
        it('when offer prop is not defined', () => {
            props.offer = undefined;

            const { container } = render(<BoardSectionButton {...props} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('when isCollapsed prop is false and title is not defined', () => {
            props.title = undefined;

            const { container } = render(<BoardSectionButton {...props} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('when alternativeBoardsCount prop is equal to 0', () => {
            props.alternativeBoardsCount = 0;

            const { container } = render(<BoardSectionButton {...props} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('when alternativeBoardsCount prop is equal to 1, isMostExpensiveBoardSelected prop and isExtrasPage are falsy', () => {
            props.alternativeBoardsCount = 1;
            props.isMostExpensiveBoardSelected = false;
            mockStores.layoutStore.isExtrasPage = false;

            const { container } = render(<BoardSectionButton {...props} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    it('should render Button component when isScreenMedium is false', () => {
        mockStores.appStore.isScreenMedium = false;

        render(<BoardSectionButton {...props} />);

        expect(screen.getByRole('button', { name: props.title })).toHaveAttribute(
            'data-tid',
            'show-more-boards-button-mobile',
        );
        expect(screen.getByTestId('icon-ext-link').classList.contains('externalLinkIcon')).toBe(true);
    });

    it('should render ShowMoreButton component when isScreenMedium is true', () => {
        render(<BoardSectionButton {...props} />);

        expect(screen.getByRole('button')).toHaveAttribute('data-tid', 'show-more-button');
        expect(mockShowMoreButtonComponent).toHaveBeenCalledWith({
            onClick: props.handleShowMore,
            isChevronUp: true,
            title: props.title,
            dataTid: 'show-more-boards-button-desktop',
        });
    });

    it('should render ShowMoreButton component with specific props when isCollapsed prop is true', () => {
        props.isCollapsed = true;

        render(<BoardSectionButton {...props} />);

        expect(screen.getByRole('button')).toHaveAttribute('data-tid', 'show-more-button');
        expect(mockShowMoreButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isChevronUp: false,
                title: props.title,
            }),
        );
    });

    it('should render ShowMoreButton component on Extras page with a correct title on collapsed state', () => {
        props.isCollapsed = true;
        mockStores.layoutStore.isExtrasPage = true;

        render(<BoardSectionButton {...props} />);

        expect(screen.getByRole('button')).toHaveAttribute('data-tid', 'show-more-button');
        expect(mockShowMoreButtonComponent).toHaveBeenCalledWith(expect.objectContaining({ title: props.title }));
    });
});
