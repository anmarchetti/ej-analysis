import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockUnitRoom } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RoomCard, { IRoomCardProps } from './RoomCard';

expect.extend(toHaveNoViolations);

const mockRoomSkeletonProps = jest.fn();
jest.mock('frontend/components/common/Room/RoomSkeleton/RoomSkeleton', () => ({
    __esModule: true,
    default: props => {
        mockRoomSkeletonProps(props);

        return <div data-tid='room-skeleton' />;
    },
}));

const mockOfferSliderProps = jest.fn();
jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    default: props => {
        mockOfferSliderProps(props);

        return <div data-tid='offer-slider' />;
    },
}));

const mockRoomContentProps = jest.fn();
jest.mock('./components/RoomCardContent/RoomCardContent', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockRoomContentProps(props);

        return <div data-tid='room-content' onClick={onClick} />;
    },
}));

const createProps = (): IRoomCardProps => ({
    room: mockUnitRoom,
    fallbackImage: 'fallbackImage',
    isLoading: false,
    isSelected: true,
    onChange: jest.fn(),
    pricePostfix: SitecoreDictionary.GlobalsPriceLabelsTotal,
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
    countryCode: 'ES',
});

let mockProps;
let mockStores;
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomCard />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Should render children with props', () => {
        const { container } = render(<RoomCard {...mockProps} />);

        expect(screen.getByTestId('room-card')).toBeInTheDocument();
        expect(screen.getByTestId('offer-slider')).toBeInTheDocument();
        expect(screen.getByTestId('room-content')).toBeInTheDocument();
        expect(container.querySelector('.isSelected')).toBeInTheDocument();
        expect(mockOfferSliderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fallbackImage: 'fallbackImage',
                images: mockUnitRoom.roomType.images,
                showIndex: true,
                isFullScreenEnabled: true,
                className: 'carousel',
            }),
        );
        expect(mockRoomContentProps).toHaveBeenCalledWith(
            expect.objectContaining({
                room: mockUnitRoom,
                pricePostfix: mockProps.pricePostfix,
                isSelected: true,
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
            }),
        );
    });

    describe('Loading skeleton', () => {
        const mockLoadingSkeleton = <div data-tid='custom-loading-skeleton'>Loading...</div>;

        it('Should render skeleton when isLoading', () => {
            mockProps.isLoading = true;
            render(<RoomCard {...mockProps} />);

            expect(screen.getByTestId('room-skeleton')).toBeInTheDocument();
            expect(mockRoomSkeletonProps).toHaveBeenCalledWith(expect.objectContaining({ height: undefined }));
        });

        it('should render the provided loadingSkeleton when isLoading is true', () => {
            mockProps.isLoading = true;
            mockProps.loadingSkeleton = mockLoadingSkeleton;

            render(<RoomCard {...mockProps} />);

            expect(screen.getByTestId('custom-loading-skeleton')).toBeInTheDocument();
        });

        it('should not render loadingSkeleton or RoomSkeleton when isLoading is false', () => {
            mockProps.isLoading = false;
            mockProps.loadingSkeleton = mockLoadingSkeleton;

            render(<RoomCard {...mockProps} />);

            expect(screen.queryByTestId('custom-loading-skeleton')).not.toBeInTheDocument();
            expect(screen.queryByTestId('room-skeleton')).not.toBeInTheDocument();
        });
    });

    it('Should render offerSlider with default fallbackImage', () => {
        mockProps.fallbackImage = null;
        render(<RoomCard {...mockProps} />);

        expect(mockOfferSliderProps).toHaveBeenCalledWith(
            expect.objectContaining({
                fallbackImage: 'HotelFallbackImage',
            }),
        );
    });

    it('Click on content should call onChange prop', async () => {
        render(<RoomCard {...mockProps} />);

        await userEvent.click(screen.getByTestId('room-content'));

        expect(mockProps.onChange).toHaveBeenCalledWith(mockUnitRoom);
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<RoomCard {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
