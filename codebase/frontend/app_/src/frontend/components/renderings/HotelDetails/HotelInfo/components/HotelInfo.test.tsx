import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import { HotelInfo, IHotelInfoProps } from './HotelInfo';

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockFeaturedFacilitiesBooking = jest.fn();
jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FeaturedFacilities/FeaturedFacilitiesBooking',
    () => ({
        __esModule: true,
        default: ({ ...props }) => {
            mockFeaturedFacilitiesBooking(props);

            return <div data-tid='featured-facilities-booking' />;
        },
    }),
);

const mockFacilities = jest.fn();
jest.mock('frontend/components/renderings/HotelDetails/HotelFacilities/components/Facilities', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockFacilities(props);

        return <div data-tid='facilities' />;
    },
}));

const mockReadMoreButton = jest.fn();
jest.mock('frontend/components/common/ReadMoreButton', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockReadMoreButton(props);

        return (
            <button data-tid={props.dataTid} onClick={props.onClick}>
                {props.isReadLess ? props.readLessText : props.readMoreText}
            </button>
        );
    },
}));

jest.mock('frontend/components/renderings/HotelDetails/components/HolidayTypeBanner', () => ({
    __esModule: true,
    default: () => <div data-tid='holiday-type-banner' />,
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
    Text: ({ ...props }) => <span>{props.field}</span>,
}));

const mockShimmer = jest.fn();
jest.mock('frontend/components/renderings/HotelDetails/HotelInfo/components/HotelInfoShimmer.tsx', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockShimmer(props);

        return <div data-tid='hotel-info-shimmer' />;
    },
}));

describe('<HotelInfo />', () => {
    const resetMocks = (): IHotelInfoProps => ({
        anchor: 'anchor',
        offer: { hotel: {} } as IOfferWithoutAltBoards,
        getPhrase: jest.fn(key => key),
        isHotelDetailsBrowsePage: false,
        isShowEcoFacilityPlaceholder: false,
        isExtrasPage: false,
        isLoading: false,
        isLoadingOffer: false,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it("should return null when we don't have offer and isLoading is false", () => {
        mocks.offer = null;
        mocks.isLoading = false;
        const { container } = render(<HotelInfo {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should show shimmer when loading offer', () => {
        mocks.offer = null;
        mocks.isLoadingOffer = true;
        render(<HotelInfo {...mocks} />);

        expect(mockShimmer).toHaveBeenCalledWith({ isExtrasPage: false });
        expect(screen.getByTestId('hotel-info-shimmer')).toBeInTheDocument();
    });

    it('should show shimmer when initial load', () => {
        mocks.offer = null;
        mocks.isLoading = true;
        render(<HotelInfo {...mocks} />);

        expect(screen.getByTestId('hotel-info-shimmer')).toBeInTheDocument();
    });

    it("should return null when we don't have offer and isLoading is false", () => {
        mocks.offer = null;
        mocks.isLoading = false;
        render(<HotelInfo {...mocks} />);

        expect(screen.queryByTestId('hotel-info-shimmer')).not.toBeInTheDocument();
    });

    it('should render with h2(strapline)', () => {
        mocks.offer = { hotel: { strapline: 'strapline' } } as IOfferWithoutAltBoards;
        render(<HotelInfo {...mocks} />);

        expect(screen.getByTestId('hotel-strapline')).toHaveTextContent('strapline');
        expect(screen.queryByTestId('more-description-text')).not.toBeInTheDocument();
    });

    it('should render component without h2(strapline)', () => {
        mocks.offer = { hotel: { strapline: '' } } as IOfferWithoutAltBoards;
        render(<HotelInfo {...mocks} />);

        expect(screen.queryByTestId('hotel-strapline')).not.toBeInTheDocument();
    });

    describe('read less', () => {
        beforeEach(() => {
            mocks.offer = {
                hotel: {
                    description:
                        '<p style="margin-top: 2px">test</p><p>test</p><p>test</p><p>test</p><p>test</p><p>test</p>',
                },
            } as IOfferWithoutAltBoards;
        });

        it('Should render with read less button and onClick function is called when clicked', async () => {
            render(<HotelInfo {...mocks} />);

            const readMoreButton = screen.getByTestId('read-more-button');
            expect(readMoreButton).toHaveTextContent('Globals.Buttons.ReadMore');
            expect(screen.queryByTestId('more-description-text')).toHaveAttribute('hidden');

            expect(mockReadMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    onClick: expect.any(Function),
                    isReadLess: false,
                }),
            );

            await userEvent.click(readMoreButton);

            expect(readMoreButton).toBeInTheDocument();
        });

        it('should render full description by default on extras page (pdf export)', () => {
            mocks.isExtrasPage = true;
            render(<HotelInfo {...mocks} />);

            expect(screen.queryByTestId('more-description-text')).not.toHaveAttribute('hidden');
        });
    });

    it('Should render facilities when offer has facilities', () => {
        mocks.offer = {
            hotel: {
                facilities: [
                    {
                        code: 'group-code',
                        items: [{ code: 'code' }],
                    },
                ],
            },
        } as IOfferWithoutAltBoards;

        render(<HotelInfo {...mocks} />);

        expect(screen.getByTestId('facilities')).toBeInTheDocument();
        expect(mockFacilities).toHaveBeenCalledWith(
            expect.objectContaining({
                facilityGroups: [{ code: 'group-code', items: [{ code: 'code' }] }],
                isShowEcoFacilityPlaceholder: false,
                rendering: undefined,
            }),
        );
    });

    it("Should render with empty facilityGroups array when hotel doesn't have facilities", () => {
        render(<HotelInfo {...mocks} />);

        expect(screen.getByTestId('facilities')).toBeInTheDocument();
        expect(mockFacilities).toHaveBeenCalledWith(
            expect.objectContaining({
                facilityGroups: [],
                isShowEcoFacilityPlaceholder: false,
            }),
        );
    });

    it('should render TilesCarousel placeholder', () => {
        render(<HotelInfo {...mocks} />);

        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.TilesCarousel,
            rendering: undefined,
        });
    });

    it('should not leak moreDescriptionText state between different hotel instances', () => {
        mocks.offer = {
            hotel: {
                description: '<p>Hotel A long desc</p><p>para2</p><p>para3</p><p>para4</p><p>para5</p><p>para6</p>',
            },
        } as IOfferWithoutAltBoards;

        const { unmount } = render(<HotelInfo {...mocks} />);

        expect(screen.getByTestId('read-more-button')).toBeInTheDocument();
        expect(screen.getByTestId('more-description-text')).toBeInTheDocument();

        unmount();

        mocks.offer = {
            hotel: {
                description: '<p>Hotel B short desc</p>',
            },
        } as IOfferWithoutAltBoards;

        render(<HotelInfo {...mocks} />);

        expect(screen.queryByTestId('read-more-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('more-description-text')).not.toBeInTheDocument();
        expect(screen.queryByTestId('read-more-box')).not.toBeInTheDocument();
    });
});
