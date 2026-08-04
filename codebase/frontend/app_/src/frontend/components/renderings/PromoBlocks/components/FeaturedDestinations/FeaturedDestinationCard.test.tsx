import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { IModalContentFields } from 'frontend/components/renderings/ContentModal/ContentModal';

import { FeaturedDestinationCard, IFeaturedDestinationCardProps } from './FeaturedDestinationCard';

const mockRouterLinkRender = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: jest.fn(({ children, onClick, link, className }) => {
        mockRouterLinkRender({ children, onClick, link, className });

        return (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid, react/prop-types
            <a href={link?.href || '#'} data-tid='router-link' onClick={onClick} className={className}>
                {children}
            </a>
        );
    }),
}));

const mockJSSImageRender = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: jest.fn(props => {
        mockJSSImageRender(props);

        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text, react/prop-types
        return <img data-tid='jss-image' src={props.field?.value?.src || 'jss-image.jpg'} />;
    }),
}));

const mockStarRatingRender = jest.fn();
jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: jest.fn(props => {
        mockStarRatingRender(props);

        // eslint-disable-next-line react/prop-types
        return <div data-tid='star-rating'>Rating: {props.rating}</div>;
    }),
}));

const mockSitecoreTextRender = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => {
    const originalModule = jest.requireActual('@sitecore-jss/sitecore-jss-nextjs');

    return {
        ...originalModule,
        Text: jest.fn(({ field, tag: Tag = 'span', className }) => {
            mockSitecoreTextRender({ field, tag: Tag, className });

            // eslint-disable-next-line react/prop-types
            return <Tag className={className}>{field?.value || ''}</Tag>;
        }),
    };
});

const mockFormatDateL10n = jest.fn();
const mockGetParsedPath = jest.fn();

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    formatDateL10n: (...args) => mockFormatDateL10n(...args),
}));

jest.mock('frontend/utils/getParsedPath', () => ({
    getParsedPath: (...args) => mockGetParsedPath(...args),
}));

const createProps = (): IFeaturedDestinationCardProps => ({
    item: {
        id: 'test-id',
        fields: {
            Description: mockSitecoreField('test'),
            Image: mockSitecoreField(mockSitecoreImageField('test')),
            Link: mockSitecoreField(mockSitecoreLinkField('/test')),
            LinkedDestination: [],
            Title: mockSitecoreField('Test'),
            ModalContent: { fields: {} as IModalContentFields },
        },
        isLivePriceValid: true,
    },
    titleClassName: 'titleClassName',
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isEditMode: false,
            isLivePriceEnabled: false,
            isNumberOfNightsLabelsEnabled: false,
        },
    });

let props: IFeaturedDestinationCardProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockLivePriceComponent = jest.fn();
jest.mock('frontend/components/renderings/LivePrice/LivePrice', () => ({
    __esModule: true,
    default: props => {
        mockLivePriceComponent(props);

        return <div data-tid='live-price-component' />;
    },
}));

const mockJSSIMageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSIMageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

describe('<FeaturedDestinationCard />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should return null if item.fields is missing', () => {
        props.item.fields = undefined as unknown as IPromoBlockFields['fields'];
        const { container } = render(<FeaturedDestinationCard {...props} />);
        expect(container.firstChild).toBeNull();
    });

    describe('Image Rendering', () => {
        it('should render JSSImageNext when not in Edit Mode', () => {
            mockStores.layoutStore.isEditMode = false;

            render(<FeaturedDestinationCard {...props} />);

            console.log(mockStores.layoutStore.isEditMode);

            expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
            expect(mockJSSIMageNextProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    field: props.item.fields.Image,
                    mediaSize: { desktop: MediaSize.Medium },
                    fill: true,
                }),
            );
            expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
        });

        it('should render JSSImage (legacy) when in Edit Mode', () => {
            mockStores.layoutStore.isEditMode = true;
            render(<FeaturedDestinationCard {...props} />);
            expect(screen.getByTestId('jss-image')).toBeInTheDocument();
            expect(mockJSSImageRender).toHaveBeenCalledWith(
                expect.objectContaining({ field: props.item.fields.Image }),
            );
            expect(screen.queryByTestId('jss-image-next')).not.toBeInTheDocument();
        });
    });

    describe('Destination Card (No Edit Mode)', () => {
        it('should render title and link if link exists', () => {
            render(<FeaturedDestinationCard {...props} />);

            const linkElement = screen.getByTestId('router-link');

            expect(linkElement).toBeInTheDocument();
            expect(mockRouterLinkRender).toHaveBeenCalledWith(
                expect.objectContaining({
                    link: props.item.fields.Link,
                }),
            );
            expect(linkElement).toBeInTheDocument();
            expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
        });

        it('should render title as plain text if no link', () => {
            props.item.fields.Link = null as unknown as ISitecoreField<ISitecoreLink>;

            render(<FeaturedDestinationCard {...props} />);

            expect(screen.getByText(props.item.fields.Title.value)).toBeInTheDocument();
            expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
        });
    });

    describe('Destination Card (Edit mode)', () => {
        beforeEach(() => {
            mockStores.layoutStore.isEditMode = true;
        });

        it('should render JSSImage, Text for title, and RouterLink', () => {
            render(<FeaturedDestinationCard {...props} />);

            expect(screen.getByTestId('jss-image')).toBeInTheDocument();
            expect(screen.getByText(props.item.fields.Title.value)).toBeInTheDocument();
            expect(mockSitecoreTextRender).toHaveBeenCalledWith(
                expect.objectContaining({
                    field: props.item.fields.Title,
                    tag: 'h3',
                }),
            );
            expect(screen.getByTestId('router-link')).toBeInTheDocument();
            expect(mockRouterLinkRender).toHaveBeenCalledWith(
                expect.objectContaining({
                    link: props.item.fields.Link,
                }),
            );
        });
    });

    describe('Hotel Info (Not Edit Mode)', () => {
        beforeEach(() => {
            props.item.fields.LinkedDestination = [
                {
                    id: 'linked-destination-id',
                    fields: {
                        PageCategory: mockSitecoreField('Hotel'),
                        StarRating: mockSitecoreField('5'),
                        FeaturedHotelBookFromTitle: mockSitecoreField('from'),
                        FeaturedHotelDate: mockSitecoreField('0001-01-01'),
                        FeaturedHotelDateText: mockSitecoreField('10 March'),
                        Code: mockSitecoreField('code'),
                        Name: mockSitecoreField('name'),
                        Image: mockSitecoreField(mockSitecoreImageField('test')),
                    },
                    url: '/spain/tenerife/hotel',
                },
            ];
            mockFormatDateL10n.mockImplementation((dateStr, format) => {
                if (dateStr === '2025-03-10T00:00:00Z' && format === 'Do MMM') return '10th Mar';

                if (dateStr === '2025-01-01T00:00:00Z' && format === 'Do MMM') return '1st Jan';

                return `formatted: ${dateStr} as ${format}`;
            });
            mockGetParsedPath.mockReturnValue([{ label: 'Spain' }, { label: 'Tenerife' }]);
        });

        it('should render full hotel info with star rating, destination, and date', () => {
            render(<FeaturedDestinationCard {...props} />);

            expect(screen.getByTestId('star-rating')).toHaveTextContent('Rating: 5');
            expect(screen.getByText('Tenerife, Spain')).toBeInTheDocument();
            expect(screen.getByText(/from/)).toBeInTheDocument();
            expect(screen.getByText('10 March')).toBeInTheDocument();
        });

        it('should NOT render star rating if value is invalid or missing', () => {
            props.item.fields.LinkedDestination![0].fields.StarRating = { value: '0' };
            render(<FeaturedDestinationCard {...props} />);
            expect(screen.queryByTestId('star-rating')).not.toBeInTheDocument();

            props.item.fields.LinkedDestination![0].fields.StarRating = undefined;
            render(<FeaturedDestinationCard {...props} />);
            expect(screen.queryByTestId('star-rating')).not.toBeInTheDocument();
        });

        it('should NOT render destination info if URL is missing for parsing', () => {
            props.item.fields.LinkedDestination![0].url = '';

            render(<FeaturedDestinationCard {...props} />);

            expect(screen.queryByText('Tenerife, Spain')).not.toBeInTheDocument();
        });

        it('should use FeaturedHotelDateText if FeaturedHotelDate is invalid (year 1)', () => {
            props.item.fields.LinkedDestination![0].fields.FeaturedHotelDate = { value: '0001-01-01T00:00:00Z' };

            render(<FeaturedDestinationCard {...props} />);

            expect(screen.getByText('10 March')).toBeInTheDocument();
            expect(mockFormatDateL10n).not.toHaveBeenCalledWith('0001-01-01T00:00:00Z', 'Do MMM');
        });

        it('should correctly parse and render a valid FeaturedHotelDate', () => {
            props.item.fields.LinkedDestination![0].fields.FeaturedHotelDate = { value: '2025-01-01T00:00:00Z' };

            render(<FeaturedDestinationCard {...props} />);

            expect(screen.getByText('1st Jan')).toBeInTheDocument();
            expect(mockFormatDateL10n).toHaveBeenCalledWith('2025-01-01T00:00:00Z', 'Do MMM');
        });
    });

    describe('LivePrice (Not Edit Mode)', () => {
        it('should render LivePrice if enabled and data exists', () => {
            mockStores.layoutStore.isLivePriceEnabled = true;
            props.item.livePrice = { pricePP: 100 } as ILivePrice;

            render(<FeaturedDestinationCard {...props} />);

            expect(screen.getByTestId('live-price-component')).toBeInTheDocument();
            expect(mockLivePriceComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    livePrice: { pricePP: 100 },
                    isNumberOfNightsLabelsEnabled: false,
                }),
            );
        });

        it('should NOT render LivePrice if live price data is missing', () => {
            mockStores.layoutStore.isLivePriceEnabled = true;
            props.item.livePrice = null;

            render(<FeaturedDestinationCard {...props} />);

            expect(screen.queryByTestId('live-price-component')).not.toBeInTheDocument();
            expect(mockLivePriceComponent).not.toHaveBeenCalled();
        });

        it('should NOT render LivePrice if disabled', () => {
            mockStores.layoutStore.isLivePriceEnabled = false;
            props.item.livePrice = { pricePP: 100 } as ILivePrice;

            render(<FeaturedDestinationCard {...props} />);

            expect(screen.queryByTestId('live-price-component')).not.toBeInTheDocument();
            expect(mockLivePriceComponent).not.toHaveBeenCalled();
        });

        it('should pass isNumberOfNightsLabelsEnabled to LivePrice', () => {
            mockStores.layoutStore.isNumberOfNightsLabelsEnabled = true;
            mockStores.layoutStore.isLivePriceEnabled = true;
            props.item.livePrice = { pricePP: 100 } as ILivePrice;

            render(<FeaturedDestinationCard {...props} />);

            expect(mockLivePriceComponent).toHaveBeenCalledWith({
                isNumberOfNightsLabelsEnabled: true,
                livePrice: { pricePP: 100 },
            });
        });
    });
});
