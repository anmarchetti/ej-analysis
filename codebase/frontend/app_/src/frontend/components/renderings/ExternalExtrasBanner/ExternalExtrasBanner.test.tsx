import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import { ExternalExtrasBanner, TExternalExtrasBannerProps } from './ExternalExtrasBanner';

const createProps = (): TExternalExtrasBannerProps => ({
    rendering: null,
    fields: {
        Hide: mockSitecoreField('hide'),
        Show: mockSitecoreField('show'),
        Title: mockSitecoreField('title'),
        Children: [
            {
                displayName: 'display',
                fields: {
                    CTA: mockSitecoreField(mockSitecoreLinkField('CTA 1', '/', SitecoreLinkType.Internal)),
                    Description: mockSitecoreField('description 1'),
                    Image: mockSitecoreField(mockSitecoreImageField('image 1')),
                    Logo: mockSitecoreField(mockSitecoreImageField('logo 1')),
                    Price: mockSitecoreField('price 1'),
                    PricePrefix: mockSitecoreField('priceSuperscript 1'),
                    Title: mockSitecoreField('title 1'),
                    Subtitle: mockSitecoreField('Subtitle 1'),
                },
                id: '1',
                name: 'name',
            },
            {
                displayName: 'display',
                fields: {
                    CTA: mockSitecoreField(mockSitecoreLinkField('CTA 2', '/', SitecoreLinkType.Internal)),
                    Description: mockSitecoreField('description 2'),
                    Image: mockSitecoreField(mockSitecoreImageField('image 2')),
                    Logo: mockSitecoreField(mockSitecoreImageField('logo 2')),
                    Price: mockSitecoreField('price 2'),
                    PricePrefix: mockSitecoreField('priceSuperscript 2'),
                    Title: mockSitecoreField('title 2'),
                    Subtitle: mockSitecoreField('Subtitle 2'),
                },
                id: '2',
                name: 'name',
            },
            {
                displayName: 'display',
                fields: {
                    CTA: mockSitecoreField(mockSitecoreLinkField('CTA 3', '/', SitecoreLinkType.Internal)),
                    Description: mockSitecoreField('description 3'),
                    Image: mockSitecoreField(mockSitecoreImageField('image 3')),
                    Logo: mockSitecoreField(mockSitecoreImageField('logo 3')),
                    Price: mockSitecoreField('price 3'),
                    PricePrefix: mockSitecoreField('priceSuperscript 3'),
                    Title: mockSitecoreField('title 3'),
                    Subtitle: mockSitecoreField('Subtitle 3'),
                },
                id: '3',
                name: 'name',
            },
        ],
    },
    params: {},
});

const parkingBannerCard = {
    displayName: 'display',
    fields: {
        CTA: mockSitecoreField(mockSitecoreLinkField('CTA 4', '/', SitecoreLinkType.Internal)),
        Description: mockSitecoreField('description 4'),
        Image: mockSitecoreField(mockSitecoreImageField('image 4')),
        Logo: mockSitecoreField(mockSitecoreImageField('logo 4')),
        Price: mockSitecoreField('price 4'),
        PricePrefix: mockSitecoreField('priceSuperscript 4'),
        Title: mockSitecoreField('title 4'),
        Subtitle: mockSitecoreField('Subtitle 4'),
    },
    id: '4',
    name: 'Airport parking',
};

const createStores = () => ({
    appStore: {
        isScreenLessMedium: false,
    },
    layoutStore: {
        getPhrase: jest.fn((key: string) => key),
        isViewBookingPage: false,
        isConfirmationPage: false,
        isBookingsListPage: true,
    },
    trackingStore: {
        trackExternalExtrasTileImpression: jest.fn(),
        trackExternalExtrasClickViewExtras: jest.fn(),
        trackExternalExtrasClickHide: jest.fn(),
    },
    bookingStore: {
        booking: {
            airportParking: null as Nullable<object>,
        },
    },
    viewBookingStore: {
        booking: {
            airportParking: null as Nullable<object>,
        },
    },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockBannerCardComponent = jest.fn();

jest.mock('frontend/components/common/BannerCard/BannerCard', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockBannerCardComponent(props);

        return <div data-tid='banner-card' />;
    },
}));

const mockReadMoreButtonComponent = jest.fn();

jest.mock('frontend/components/common/ReadMoreButton', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockReadMoreButtonComponent(props);

        return <div data-tid='read-more-button' {...props} />;
    },
}));

describe('<ExternalExtrasBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        jest.resetAllMocks();
    });

    it('should NOT render without fields', () => {
        delete mockProps.fields;
        const { container } = render(<ExternalExtrasBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render without Children fields', () => {
        mockProps.fields!.Children = [];
        const { container } = render(<ExternalExtrasBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('should render or not parking related items', () => {
        test.each([
            [true, false, {}, null],
            [false, true, null, {}],
        ])(
            'given the user is in a given page (confirmation or view booking) and has booked a parking, make sure the parking item is NOT rendered',
            (isConfirmationPage, isViewBookingPage, bookingStoreParking, viewBookingStoreParking) => {
                mockStores.layoutStore.isConfirmationPage = isConfirmationPage;
                mockStores.layoutStore.isViewBookingPage = isViewBookingPage;
                mockStores.bookingStore.booking.airportParking = bookingStoreParking;
                mockStores.viewBookingStore.booking.airportParking = viewBookingStoreParking;
                const gridItemCount = mockProps.fields!.Children.push(parkingBannerCard);
                const { getAllByTestId } = render(<ExternalExtrasBanner {...mockProps} />);
                const gridItems = getAllByTestId('external-extras-grid-item');

                expect(gridItems).toHaveLength(gridItemCount - 1);
            },
        );

        test.each([
            [true, false],
            [false, true],
        ])(
            'given the user is in a given page (confirmation or view booking) and has NOT booked a parking, make sure the parking item is rendered',
            (isConfirmationPage, isViewBookingPage) => {
                mockStores.layoutStore.isConfirmationPage = isConfirmationPage;
                mockStores.layoutStore.isViewBookingPage = isViewBookingPage;
                const gridItemCount = mockProps.fields!.Children.push(parkingBannerCard);
                const { getAllByTestId } = render(<ExternalExtrasBanner {...mockProps} />);
                const gridItems = getAllByTestId('external-extras-grid-item');

                expect(gridItems).toHaveLength(gridItemCount);
            },
        );
    });

    it('should render standard', () => {
        const mockRef = {
            current: {
                scrollHeight: 1000,
            },
        };

        jest.spyOn(React, 'useRef').mockReturnValue(mockRef);

        mockProps.fields!.Children = [...mockProps.fields!.Children, parkingBannerCard];

        const { getByTestId, getAllByTestId } = render(<ExternalExtrasBanner {...mockProps} />);

        expect(getByTestId('external-extras-banner-title')).toBeInTheDocument();
        expect(getByTestId('external-extras-grid')).toBeInTheDocument();
        expect(getByTestId('external-extras-grid-wrapper')).toHaveClass('bookingsListPageGridWrapper gridWrapper');

        const gridItems = getAllByTestId('external-extras-grid-item');

        expect(gridItems).toHaveLength(mockProps.fields!.Children.length);

        expect(mockBannerCardComponent).toHaveBeenNthCalledWith(1, {
            fields: {
                Description: mockProps.fields?.Children[0].fields.Description,
                CTA: mockProps.fields?.Children[0].fields.CTA,
                Subtitle: mockProps.fields?.Children[0].fields.Subtitle,
                Title: mockProps.fields?.Children[0].fields.Title,
                Logo: mockProps.fields?.Children[0].fields.Logo,
                Image: mockProps.fields?.Children[0].fields.Image,
                Price: mockProps.fields?.Children[0].fields.Price,
                PricePrefix: mockProps.fields?.Children[0].fields.PricePrefix,
            },
            isExternalExtras: true,
            childrenCount: mockProps.fields?.Children.length,
            index: 0,
        });

        expect(mockBannerCardComponent).toHaveBeenNthCalledWith(2, {
            fields: {
                Description: mockProps.fields?.Children[1].fields.Description,
                CTA: mockProps.fields?.Children[1].fields.CTA,
                Subtitle: mockProps.fields?.Children[1].fields.Subtitle,
                Title: mockProps.fields?.Children[1].fields.Title,
                Logo: mockProps.fields?.Children[1].fields.Logo,
                Image: mockProps.fields?.Children[1].fields.Image,
                Price: mockProps.fields?.Children[1].fields.Price,
                PricePrefix: mockProps.fields?.Children[1].fields.PricePrefix,
            },
            isExternalExtras: true,
            childrenCount: mockProps.fields?.Children.length,
            index: 1,
        });

        expect(mockBannerCardComponent).toHaveBeenNthCalledWith(3, {
            fields: {
                Description: mockProps.fields?.Children[2].fields.Description,
                CTA: mockProps.fields?.Children[2].fields.CTA,
                Subtitle: mockProps.fields?.Children[2].fields.Subtitle,
                Title: mockProps.fields?.Children[2].fields.Title,
                Logo: mockProps.fields?.Children[2].fields.Logo,
                Image: mockProps.fields?.Children[2].fields.Image,
                Price: mockProps.fields?.Children[2].fields.Price,
                PricePrefix: mockProps.fields?.Children[2].fields.PricePrefix,
            },
            isExternalExtras: true,
            childrenCount: mockProps.fields?.Children.length,
            index: 2,
        });

        expect(mockBannerCardComponent).toHaveBeenNthCalledWith(4, {
            fields: {
                Description: mockProps.fields?.Children[3].fields.Description,
                CTA: mockProps.fields?.Children[3].fields.CTA,
                Subtitle: mockProps.fields?.Children[3].fields.Subtitle,
                Title: mockProps.fields?.Children[3].fields.Title,
                Logo: mockProps.fields?.Children[3].fields.Logo,
                Image: mockProps.fields?.Children[3].fields.Image,
                Price: mockProps.fields?.Children[3].fields.Price,
                PricePrefix: mockProps.fields?.Children[3].fields.PricePrefix,
            },
            isExternalExtras: true,
            childrenCount: mockProps.fields?.Children.length,
            index: 3,
        });

        expect(getByTestId('read-more-button')).toBeInTheDocument();

        expect(mockReadMoreButtonComponent).toHaveBeenCalledWith({
            isReadLess: false,
            onClick: expect.anything(),
            readLessText: mockProps.fields?.Hide.value,
            readMoreText: mockProps.fields?.Show.value,
        });
        expect(mockStores.trackingStore.trackExternalExtrasTileImpression).toBeCalledTimes(4);
    });

    describe('grid wrapper styles', () => {
        beforeEach(() => {
            mockStores.layoutStore.isViewBookingPage = false;
        });

        it('should render isConfirmationPage class for grid wrapper when isConfirmationPage = true', () => {
            mockStores.layoutStore.isConfirmationPage = true;
            const { getByTestId } = render(<ExternalExtrasBanner {...mockProps} />);

            expect(getByTestId('external-extras-grid-wrapper')).toHaveClass('confirmationPageGridWrapper');
        });

        it('should render isViewBookingPage class for grid wrapper when isViewBookingPage = true', () => {
            mockStores.layoutStore.isViewBookingPage = true;
            const { getByTestId } = render(<ExternalExtrasBanner {...mockProps} />);

            expect(getByTestId('external-extras-grid-wrapper')).toHaveClass('viewBookingPageGridWrapper');
        });
    });

    it('should NOT apply different style logic for a last even banner card child', () => {
        mockProps.fields!.Children = mockProps.fields!.Children.slice(0, 2);
        const { getAllByTestId } = render(<ExternalExtrasBanner {...mockProps} />);
        const gridItems = getAllByTestId('external-extras-grid-item');

        expect(gridItems).toHaveLength(mockProps.fields!.Children.length);
        const lastGridChild = gridItems[gridItems.length - 1];
        expect(lastGridChild).not.toHaveClass('gridSingleItem');
    });

    it('should apply different style logic for a standalone banner card child', () => {
        mockProps.fields!.Children = mockProps.fields!.Children.slice(0, 1);
        const { getAllByTestId } = render(<ExternalExtrasBanner {...mockProps} />);
        const gridItems = getAllByTestId('external-extras-grid-item');

        expect(gridItems).toHaveLength(mockProps.fields!.Children.length);
        const lastGridChild = gridItems[gridItems.length - 1];
        expect(lastGridChild).toHaveClass('gridSingleItem');
    });

    it('should apply style .noAfter when isExpaned = true or Children less or equal then 2 items', async () => {
        mockProps.fields!.Children = mockProps.fields!.Children.slice(0, 2);
        render(<ExternalExtrasBanner {...mockProps} />);
        expect(screen.getByTestId('external-extras-grid')).toHaveClass('grid noAfter');
    });

    it('should NOT apply style .noAfter when isExpaned = false or Children more than 2 items', () => {
        render(<ExternalExtrasBanner {...mockProps} />);
        expect(screen.getByTestId('external-extras-grid')).toHaveClass('grid');
    });

    it('should NOT render ReadMoreButton if items count is less than 3', () => {
        mockProps.fields!.Children = mockProps.fields!.Children.slice(0, 2);
        const { queryByTestId } = render(<ExternalExtrasBanner {...mockProps} />);

        expect(queryByTestId('external-extras-read-more')).not.toBeInTheDocument();
    });

    describe('titleRef', () => {
        let scrollIntoViewMock: jest.Mock;

        beforeEach(() => {
            scrollIntoViewMock = jest.fn();
            window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
            jest.spyOn(React, 'useRef').mockReturnValue({ current: { scrollIntoView: scrollIntoViewMock } });
        });

        afterEach(() => {
            scrollIntoViewMock.mockClear();
        });

        it('should NOT scroll when isExpanded is false', async () => {
            render(<ExternalExtrasBanner {...mockProps} />);
            await userEvent.click(screen.getByTestId('read-more-button'));
            expect(scrollIntoViewMock).not.toHaveBeenCalled();
        });

        it('should scroll when isExpanded is true', async () => {
            render(<ExternalExtrasBanner {...mockProps} />);
            const readMoreButton = screen.getByTestId('read-more-button');

            // First click to expand
            await userEvent.click(readMoreButton);

            expect(mockStores.trackingStore.trackExternalExtrasClickViewExtras).toBeCalled();

            // Second click to trigger the scroll
            await userEvent.click(readMoreButton);
            expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

            expect(mockStores.trackingStore.trackExternalExtrasClickHide).toBeCalled();
        });

        it('should call trackExternalExtrasTileImpression when items couns > 4', async () => {
            mockProps.fields!.Children = [
                ...mockProps.fields!.Children,
                {
                    displayName: 'display',
                    fields: {
                        CTA: mockSitecoreField(mockSitecoreLinkField('CTA 4', '/', SitecoreLinkType.Internal)),
                        Description: mockSitecoreField('description 4'),
                        Image: mockSitecoreField(mockSitecoreImageField('image 4')),
                        Logo: mockSitecoreField(mockSitecoreImageField('logo 4')),
                        Price: mockSitecoreField('price 4'),
                        PricePrefix: mockSitecoreField('priceSuperscript 4'),
                        Title: mockSitecoreField('title 4'),
                        Subtitle: mockSitecoreField('Subtitle 4'),
                    },
                    id: '4',
                    name: 'name',
                },
                {
                    displayName: 'display',
                    fields: {
                        CTA: mockSitecoreField(mockSitecoreLinkField('CTA 5', '/', SitecoreLinkType.Internal)),
                        Description: mockSitecoreField('description 5'),
                        Image: mockSitecoreField(mockSitecoreImageField('image 5')),
                        Logo: mockSitecoreField(mockSitecoreImageField('logo 5')),
                        Price: mockSitecoreField('price 5'),
                        PricePrefix: mockSitecoreField('priceSuperscript 5'),
                        Title: mockSitecoreField('title 5'),
                        Subtitle: mockSitecoreField('Subtitle 5'),
                    },
                    id: '5',
                    name: 'name',
                },
            ];

            render(<ExternalExtrasBanner {...mockProps} />);
            const readMoreButton = screen.getByTestId('read-more-button');

            expect(mockStores.trackingStore.trackExternalExtrasTileImpression).toBeCalledTimes(4);

            await userEvent.click(readMoreButton);

            expect(mockStores.trackingStore.trackExternalExtrasClickViewExtras).toBeCalled();
            expect(mockStores.trackingStore.trackExternalExtrasTileImpression).toBeCalledTimes(5);
        });
    });
});
