import React from 'react';
import { render, screen } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores, mockRoom } from 'frontend/__mocks__';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RoomAndBoard from './RoomAndBoard';

const replaceTokenMock = jest.fn(s => s);
jest.mock('frontend/utils/tokenizer');
Tokenizer.replaceToken = replaceTokenMock;

const mockAmendClickCTA = jest.fn();

const createProps = () => ({
    onAmendClick: mockAmendClickCTA,
    rooms: [
        {
            ...mockRoom,
            roomType: {
                ...mockRoom.roomType,
                title: 'Double room',
                images: [],
            },
        },
        {
            ...mockRoom,
            code: 'FM01',
            roomType: {
                ...mockRoom.roomType,
                code: 'FM01',
                title: 'Family room',
                images: [],
            },
            boardType: {
                ...mockRoom.boardType,
                code: 'HB',
                title: 'Half board',
                content: 'content',
                iconUrl: '/-/jssmedia/ee09ab1161a34c1e93d08579844d9db0.ashx',
            },
        },
    ],
});

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper', () => ({
    __esModule: true,
    default: ({ dataTid, Title, children }) => (
        <div data-tid={dataTid}>
            {Title?.value && <h3>{Title.value}</h3>}
            {children}
        </div>
    ),
}));

const mockEntryCTAProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendRoomAndBoard/components/AmendRoomAndBoardEntry/AmendRoomAndBoardEntry',
    () => ({
        __esModule: true,
        default: ({ onClick, ...props }) => {
            mockEntryCTAProps(props);

            return <button data-tid='amend-cta' onClick={onClick} />;
        },
    }),
);

const mockImageWithFilterProps = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: props => {
        mockImageWithFilterProps(props);

        return <div data-tid='image-with-filter' />;
    },
    SVGFilterMatrix: {
        Orange: 'orange',
    },
}));

jest.mock('frontend/components/icons-new/FullBoard', () => ({
    __esModule: true,
    default: () => <div data-tid='board-icon' />,
}));

const mockOfferCardSliderComponent = jest.fn();
const mockRoomFacilitiesComponent = jest.fn();

jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    OfferCardSlider: props => {
        mockOfferCardSliderComponent(props);

        return <div data-tid='offer-card-slider' />;
    },
}));

jest.mock('frontend/components/renderings/RoomTypes/components/RoomFacilities/RoomFacilities', () => ({
    __esModule: true,
    default: props => {
        mockRoomFacilitiesComponent(props);

        return <div data-tid='room-facilities' />;
    },
}));

describe('<RoomAndBoard />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            amendRoomAndBoardStore: {
                isAmendCTAVisible: true,
            },
        });
        replaceTokenMock.mockClear();
    });

    it('should render all rooms with board', () => {
        render(<RoomAndBoard {...props} />);

        expect(screen.getByText('BookingSummary.Titles.RoomsAndBoard')).toBeInTheDocument();
        expect(screen.getByText('Double room')).toBeInTheDocument();
        expect(screen.getAllByText('BookingSummary.Labels.ForPeople').length).toBe(2);
        expect(screen.getByText('Family room')).toBeInTheDocument();
        expect(screen.getByText('Half board')).toBeInTheDocument();
        expect(screen.getByText('content')).toBeInTheDocument();
        expect(screen.getByTestId('room-and-board')).toBeInTheDocument();
        expect(screen.getAllByTestId('room')).toHaveLength(2);
        expect(screen.getAllByTestId('room-type').length).toBe(2);
        expect(screen.getByTestId('amend-cta')).toBeInTheDocument();
        expect(mockOfferCardSliderComponent).toHaveBeenCalledWith({
            fallbackImage: 'HotelFallbackImage',
            images: [],
            isFullScreenEnabled: true,
            isPromoPage: false,
            isSearchResultsPage: false,
            roomImagesFolderId: 'roomImagesFolderId',
            roomItemId: 'R001',
            showIndex: true,
        });
        expect(replaceTokenMock).toHaveBeenNthCalledWith(1, SitecoreDictionary.RoomTypesLabelsRoom, Tokens.Number, '1');
        expect(replaceTokenMock).toHaveBeenNthCalledWith(
            4,
            SitecoreDictionary.BookingSummaryLabelsForPeople,
            Tokens.People,
            '3',
        );
        expect(mockEntryCTAProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'amendCta',
            }),
        );
    });

    it('should render one room for 1 person', () => {
        props.rooms = [
            {
                code: 'DB01',
                roomType: { code: 'DB01', title: 'Double room' },
                board: null,
                occupation: { adults: 1, children: 0, infants: 0 },
            },
        ];
        render(<RoomAndBoard {...props} />);

        expect(screen.getAllByTestId('room-type').length).toBe(1);
        expect(screen.getByText('Double room')).toBeInTheDocument();
        expect(replaceTokenMock).toBeCalledWith(SitecoreDictionary.BookingSummaryLabelsForPerson, Tokens.People, '1');
    });

    it('should NOT render room title if no room type info', () => {
        props.rooms = [
            {
                code: 'DB01',
                occupation: { adults: 1, children: 0, infants: 0 },
            },
        ];
        render(<RoomAndBoard {...props} />);

        expect(screen.queryByText('RoomTypes.Labels.Room: Double room')).not.toBeInTheDocument();
        expect(screen.queryByText('BookingSummary.Labels.ForPeople')).not.toBeInTheDocument();
        expect(screen.queryByText('RoomTypes.Labels.Room: Family room')).not.toBeInTheDocument();
    });

    it('should render nothing when no rooms were passed', () => {
        props.rooms = [];
        const { container } = render(<RoomAndBoard {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Render board', () => {
        it('should render board image', () => {
            render(<RoomAndBoard {...props} />);

            expect(screen.queryByTestId('board-icon')).not.toBeInTheDocument();
            expect(mockImageWithFilterProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    imageSrc: 'undefined/-/jssmedia/ee09ab1161a34c1e93d08579844d9db0.ashx',
                    filterMatrix: 'orange',
                }),
            );
        });

        it('should render default board icon', () => {
            props.rooms.forEach(room => {
                room.boardType.iconUrl = null;
            });
            render(<RoomAndBoard {...props} />);

            expect(screen.getByTestId('board-icon')).toBeInTheDocument();
            expect(mockImageWithFilterProps).not.toHaveBeenCalled();
        });
    });

    describe('Amend CTA', () => {
        it('should AmendCta NOT be rendered when onCLick handler was no provided', () => {
            mockStores.amendRoomAndBoardStore.isAmendCTAVisible = true;
            props.onAmendClick = null;
            render(<RoomAndBoard {...props} />);

            expect(screen.queryByTestId('amend-cta')).not.toBeInTheDocument();
        });

        it('should AmendCta NOT be rendered when it not allow', () => {
            mockStores.amendRoomAndBoardStore.isAmendCTAVisible = false;
            render(<RoomAndBoard {...props} />);

            expect(screen.queryByTestId('amend-cta')).not.toBeInTheDocument();
        });
    });

    describe('Board type', () => {
        it('should render board type part', () => {
            render(<RoomAndBoard {...props} />);

            expect(screen.getByTestId('board-type')).toBeInTheDocument();
            expect(screen.getByText('Half board')).toBeInTheDocument();
            expect(screen.getByText('content')).toBeInTheDocument();
        });

        it('should NOT render board type subtitle when title has not been provded', () => {
            props.rooms = props.rooms.map(room => ({ ...room, boardType: { ...room.boardType, title: undefined } }));
            render(<RoomAndBoard {...props} />);

            expect(screen.queryByText('Half board')).not.toBeInTheDocument();
        });
    });

    it('should not render anything if no rooms provided', () => {
        props.rooms = [];
        const { container } = render(<RoomAndBoard {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render boardType for last room even if only one board type exists and it is only on the last room', () => {
        props.rooms = [{ ...props.rooms[0], board: undefined, boardType: undefined }, props.rooms[1]];

        render(<RoomAndBoard {...props} />);

        expect(screen.getAllByTestId('board-type')).toHaveLength(1);
        expect(screen.getByText(props.rooms[1].boardType.title)).toBeInTheDocument();
    });

    it('should render different boardTypes for all the rooms', () => {
        props.rooms = [...props.rooms, { ...props.rooms[0], board: 'TEST' }];
        render(<RoomAndBoard {...props} />);

        expect(screen.getAllByTestId('board-type')).toHaveLength(3);
    });
});
