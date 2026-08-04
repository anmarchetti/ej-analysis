import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { isTradeStore } from 'frontend/store/tradePortal';
import countDifferenceSave from 'frontend/utils/countDifferenceSafe';
import { MarketCode } from 'models/data/MarketSettings';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IActiveExperiment } from 'frontend/components/cro/ExperimentOptimizely/utils/experiment.utils';
import {
    defaultRoom,
    roomWithFacilitiesAndPhotos,
} from 'frontend/components/renderings/RoomTypes/components/__mocks__/rooms';

import { RoomCard } from './RoomCard';

const createStores = () => ({
    layoutStore: {
        isPricesHidden: false,
        isTradePortal: false,
        isEditMode: false,
        getPhrase: jest.fn(p => p),
        getSetting: jest.fn(setting => setting),
    },
    appStore: {
        isScreenMedium: true,
    },
    editorStore: {
        getImageByItemId: jest.fn(),
    },
    marketStore: {
        formatMoney: jest.fn(a => `+£${a}`),
        marketCode: MarketCode.UK,
    },
});

const createProps = () => ({
    room: defaultRoom,
    isSelected: false,
    priceDifference: 0,
    adultAndChildrenGuests: 1,
    selectedRoomSectionIndex: 0,
    fallbackImage: '',
    offer: {
        accom: {
            unit: [{}],
        },
        price: 100,
        pricePP: 50,
    },
    isMultipleRoomSelected: false,
    extraActions: <div data-tid='extra-actions' />,
    onChangeRoom: jest.fn(),
    tooltipClass: 'test',
});

jest.mock('frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyExperiment', () => () => mockOptimizely);

const mockOptimizelyExperiment: IActiveExperiment = {
    activeVariantId: '28579720055',
    config: {
        experimentId: '28580050047',
        pagesId: '28585400053',
        originalVariant: '28592940040',
        variantA: '28579720055',
    },
};

let mockStores;
let mockIsUrgencyMessageVisable;
let mockOptimizely;
let props;

const mockOfferCardSliderComponent = jest.fn();
const mockRoomFacilitiesComponent = jest.fn();

jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({ price }) => <div>{price}</div>);
jest.mock('frontend/components/common/SeoReadMoreTextBlock', () => () => <div data-tid='seo-read-more-text-block' />);

jest.mock('frontend/utils/countDifferenceSafe');

jest.mock('frontend/utils/urgencyMessage.utils', () => ({
    getRoomsUrgencyMessageVisibility: () => mockIsUrgencyMessageVisable,
    getRoomsUrgencyMessage: () => 'Urgency message',
}));

const mockRoomSkeletonComponent = jest.fn();
jest.mock('frontend/components/common/Room/RoomSkeleton/RoomSkeleton', () => ({
    __esModule: true,
    default: props => {
        mockRoomSkeletonComponent(props);

        return <div data-tid='room-skeleton' />;
    },
}));

jest.mock('frontend/components/common/BlockSelected', () => ({
    __esModule: true,
    default: () => <div data-tid='block-selected' />,
}));

jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardSliderComponent(props);

        return <div data-tid='offer-card-slider' />;
    },
}));

jest.mock('../RoomFacilities/RoomFacilities', () => ({
    __esModule: true,
    default: props => {
        mockRoomFacilitiesComponent(props);

        return <div data-tid='room-facilities' />;
    },
}));

jest.mock('frontend/components/common/UrgencyMessage/UrgencyMessage', () => ({
    __esModule: true,
    default: () => <div data-tid='urgency-message' />,
}));

jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: jest.fn(),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomCard />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
        mockOptimizely = undefined;
    });

    it('should standard render', () => {
        (countDifferenceSave as any).mockReturnValue(0);
        mockIsUrgencyMessageVisable = true;

        render(<RoomCard {...props} />);

        expect(screen.queryByTestId('offer-card-slider')).not.toBeInTheDocument();
        expect(screen.getByTestId('room-card-details-without-facilities-and-slider')).toBeInTheDocument();
        expect(screen.getByText(props.room.roomType.title.value)).toBeInTheDocument();
        expect(screen.queryByTestId('seo-read-more-text-block')).not.toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveTextContent(`£0`);
        expect(screen.getByTestId('urgency-message')).toBeInTheDocument();
    });

    it('should render urgencyMessage on UK region', () => {
        mockStores.marketStore.marketCode = 'UK';
        mockIsUrgencyMessageVisable = true;
        render(<RoomCard {...props} />);
        expect(screen.getByTestId('urgency-message')).toBeInTheDocument();
    });

    it('should NOT render urgencyMessage on UK region when rooms more than 5 on UK', () => {
        mockStores.marketStore.marketCode = 'UK';
        mockIsUrgencyMessageVisable = false;
        render(<RoomCard {...props} />);
        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
    });

    it('should NOT render urgencyMessage on EUX region', () => {
        mockStores.marketStore.marketCode = 'FR';
        render(<RoomCard {...props} />);
        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
    });

    it('should render urgencyMessage on EUX region with AB Experiment', () => {
        mockStores.marketStore.marketCode = 'FR';
        mockIsUrgencyMessageVisable = true;
        mockOptimizely = mockOptimizelyExperiment;
        render(<RoomCard {...props} />);
        expect(screen.getByTestId('urgency-message')).toBeInTheDocument();
    });

    it('should NOT render urgencyMessage when rooms more than 5 on EUX region with AB Experiment', () => {
        mockStores.marketStore.marketCode = 'FR';
        mockIsUrgencyMessageVisable = false;
        mockOptimizely = mockOptimizelyExperiment;
        render(<RoomCard {...props} />);
        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
    });

    it('should NOT render pp when multiple rooms selected', () => {
        (countDifferenceSave as any).mockReturnValue(0);
        props.isMultipleRoomSelected = true;

        render(<RoomCard {...props} />);

        expect(screen.getByRole('button')).toHaveTextContent(`£0`);
    });

    it('should render room card with images and facilities with correct class name when isSelected prop is true', () => {
        props.isSelected = true;
        props.room = roomWithFacilitiesAndPhotos;
        props.room.roomType.description = 'test description';

        const { container } = render(<RoomCard {...props} />);

        expect(screen.getByTestId('offer-card-slider')).toBeInTheDocument();
        expect(screen.getByTestId('room-facilities')).toBeInTheDocument();
        expect(screen.getByTestId('block-selected')).toBeInTheDocument();
        expect(screen.getByTestId('seo-read-more-text-block')).toBeInTheDocument();
        expect(screen.queryByTestId('room-card-price')).not.toBeInTheDocument();
        expect(screen.queryByTestId('room-card-top-action')).not.toBeInTheDocument();

        expect(container.querySelector('.cardBrief')).not.toBeInTheDocument();
    });

    it('should display room card with title and urgency message over the action button when getRoomsUrgencyMessageVisibility returns true', () => {
        mockIsUrgencyMessageVisable = true;

        render(<RoomCard {...props} />);

        expect(screen.getByTestId('room-card-details-without-facilities-and-slider')).toBeInTheDocument();
        expect(screen.queryByTestId('room-card-title-section')).toBeInTheDocument();
        expect(screen.queryByTestId('room-card-action-section')).toBeInTheDocument();
        expect(screen.queryByTestId('room-card-title-section')).toHaveClass('col-md-12');
        expect(screen.queryByTestId('room-card-action-section')).toHaveClass('col-md-12');
    });

    it('should display room card only with title and action button in row when getRoomsUrgencyMessageVisibility returns false', () => {
        mockIsUrgencyMessageVisable = false;

        render(<RoomCard {...props} />);

        expect(screen.getByTestId('room-card-details-without-facilities-and-slider')).toBeInTheDocument();
        expect(screen.queryByTestId('room-card-title-section')).toBeInTheDocument();
        expect(screen.queryByTestId('room-card-action-section')).toBeInTheDocument();
        expect(screen.queryByTestId('room-card-title-section')).toHaveClass('col-md-8');
        expect(screen.queryByTestId('room-card-action-section')).toHaveClass('col-md-4');
    });

    it('should NOT render price block at the bottom of card when offer is not defined', () => {
        props.offer = null;

        render(<RoomCard {...props} />);

        expect(screen.queryByTestId('room-card-bottom-action')).not.toBeInTheDocument();
    });

    it('should render description block when room has description field', () => {
        props.room.roomType.description = 'test description';

        render(<RoomCard {...props} />);

        expect(screen.getByTestId('seo-read-more-text-block')).toBeInTheDocument();
    });

    it('should render extra actions block when is passed in props', () => {
        props.extraActions = 'extra-action';

        render(<RoomCard {...props} />);

        expect(screen.getByText(props.extraActions)).toBeInTheDocument();
    });

    describe('RoomSkeleton', () => {
        beforeEach(() => {
            props.isLoadingOffer = true;
            mockStores.appStore.isScreenMedium = true;
        });

        it('should render when offer is loading and screen is more than medium', () => {
            render(<RoomCard {...props} />);

            expect(screen.getByTestId('room-skeleton')).toBeInTheDocument();
            expect(mockRoomSkeletonComponent).toHaveBeenCalledWith({
                isLarge: false,
                height: undefined,
                containerClass: undefined,
            });
        });

        it('should render with correct props', () => {
            props.isSelected = true;
            props.isSpoiler = true;

            render(<RoomCard {...props} />);

            expect(screen.getByTestId('room-skeleton')).toBeInTheDocument();
            expect(mockRoomSkeletonComponent).toHaveBeenCalledWith({
                isLarge: true,
                height: undefined,
                containerClass: 'skeletonSpoiler',
            });
        });
    });

    it('should render button without a price when isPricesHidden and this is trade portal page', () => {
        (isTradeStore as any).mockReturnValue(true);
        mockStores.layoutStore.isPricesHidden = true;

        render(<RoomCard {...props} />);

        expect(
            screen.getByRole('button', { name: SitecoreDictionary.AlternativeFlightsButtonsSelect }),
        ).toBeInTheDocument();
    });

    it('should contain spoiler class name when isSpoiler prop is true', () => {
        props.isSpoiler = true;

        render(<RoomCard {...props} />);

        expect(screen.getByTestId('room-card')).toHaveClass('spoiler');
    });

    it('should contain alteration class name when isAlteration prop is true', () => {
        props.isAlteration = true;

        render(<RoomCard {...props} />);

        expect(screen.getByTestId('room-card')).toHaveClass('alteration');
    });

    it('should contain selected class name when isSelected prop is true', () => {
        props.isSelected = true;

        render(<RoomCard {...props} />);

        expect(screen.getByTestId('room-card')).toHaveClass('selected');
    });

    it('should not render a title when it does not exist in the room', () => {
        props.room.roomType.title = undefined;

        render(<RoomCard {...props} />);

        expect(screen.queryByTestId('room-card-title')).not.toBeInTheDocument();
    });

    it('should display correctly the title even it is not a Sitecore field', () => {
        props.room.roomType.title = 'Test title';

        render(<RoomCard {...props} />);

        expect(screen.getByText('Test title')).toBeInTheDocument();
    });

    it('should change the room on click', async () => {
        props.room.roomType.title = 'Test title';
        (countDifferenceSave as any).mockReturnValue(1);

        render(<RoomCard {...props} />);

        await userEvent.click(screen.getByRole('button'));

        expect(props.onChangeRoom).toHaveBeenCalledWith(props.selectedRoomSectionIndex, props.room, 0);
    });

    describe('render title', () => {
        it('should render room-details__title without room-details__title-with-subtitle when description NOT provided', () => {
            props.room.roomType.title = { value: 'title' };
            props.room.roomType.description = null;

            const { container } = render(<RoomCard {...props} />);

            expect(screen.getByText('title')).toBeInTheDocument();
            expect(container.getElementsByClassName('room-details__title-with-subtitle').length).toBe(0);
        });

        it('should render code, title and "Room name:" when roomType provided and isEditMode', () => {
            mockStores.layoutStore.isEditMode = true;
            props.room.roomType.code = 'code';
            props.room.roomType.title = { value: 'title' };
            props.room.boardType = { title: 'room board type' };

            render(<RoomCard {...props} />);

            expect(screen.getByTestId('expected-title')).toHaveTextContent(
                `code - Room name: ${props.room.boardType.title}`,
            );
        });

        it('should NOT render code, title and "Room name:" when roomType provided and is NOT EditMode', () => {
            props.room.roomType.code = 'code';
            props.room.roomType.title = { value: 'title' };

            render(<RoomCard {...props} />);

            expect(screen.queryByText('code - title')).not.toBeInTheDocument();
            expect(screen.queryByText('Room name:')).not.toBeInTheDocument();
        });

        it('should render header without lineSeparator className when room is selected and room facilities are NOT provided', () => {
            props.isSelected = true;
            props.room.roomType.facilities = [];
            render(<RoomCard {...props} />);

            expect(screen.getByTestId('room-card-header')).not.toHaveClass('lineSeparator');
        });

        it('should render header with lineSeparator className when room is NOT selected and room facilities are NOT provided', () => {
            props.isSelected = false;
            props.room.roomType.facilities = [];
            render(<RoomCard {...props} />);

            expect(screen.getByTestId('room-card-header')).toHaveClass('lineSeparator');
        });

        it('should render header with lineSeparator className when room is selected and room facilities are provided', () => {
            props.isSelected = true;
            props.room.roomType.facilities = [{ code: 'code', name: 'name', number: 'number' }];
            render(<RoomCard {...props} />);

            expect(screen.getByTestId('room-card-header')).toHaveClass('lineSeparator');
        });

        it('should render header with headerWithoutContent className when isCardWithoutFacilitiesAndSlider is true', () => {
            props.room.roomType.facilities = [];
            props.room.roomType.images = [];

            render(<RoomCard {...props} />);

            expect(screen.getByTestId('room-card-header')).toHaveClass('headerWithoutContent');
        });
    });

    describe('Experience Editor renderings', () => {
        beforeEach(() => {
            mockStores.layoutStore.isEditMode = true;
        });

        it('Display title on EE', () => {
            props.room.roomType.code = 'code';
            props.room.boardType = { title: 'room board type' };

            render(<RoomCard {...props} />);

            expect(screen.getByTestId('expected-title')).toHaveTextContent(
                `code - Room name: ${props.room.boardType.title}`,
            );
        });

        it('Slider and Facilities components should contain receive isEditMode prop', () => {
            const expectedRes = { isEditMode: true };

            render(<RoomCard {...props} />);

            expect(mockOfferCardSliderComponent).toHaveBeenCalledWith(expect.objectContaining(expectedRes));
            expect(mockRoomFacilitiesComponent).toHaveBeenCalledWith(expect.objectContaining(expectedRes));
        });
    });

    it('should NOT render when rommType is NOT provided', () => {
        props.room.roomType = undefined;
        const { container } = render(<RoomCard {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
