import React from 'react';
import { render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import {
    mockPendingObservablePromise,
    mockResolvedObservablePromise,
} from 'frontend/utils/observerablePromise/mockedObservableFromPromise';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import AmendEntityPopup from 'frontend/components/common/AmendEntityPopup/AmendEntityPopup';
import AmendRoomAndBoardPopup from 'frontend/components/renderings/AmendRoomAndBoardPopup/AmendRoomAndBoardPopup';

const createMockProps = () => ({
    fields: {
        Subtitle: mockSitecoreField('Subtitle'),
        Title: mockSitecoreField('Title'),
        OriginalRoomTitle: mockSitecoreField('RoomAndBoardTitle'),
        AltRoomsExpandLabel: mockSitecoreField('RoomAndBoardIcon'),
        AltRoomsCollapseLabel: mockSitecoreField('RoomAndBoardIcon'),
        CountRoomsToShow: mockSitecoreField('RoomAndBoardIcon'),
        RoomsMobileListTitle: mockSitecoreField('RoomsMobileListTitle'),
        RoomsMobileListDescription: mockSitecoreField('RoomsMobileListDescription'),
    },
    rendering: {},
});

const mockLoadRoomAndBoardData = jest.fn();
const mockSubmitOffer = jest.fn();
const mockHidePopup = jest.fn();
const mockSelectOffer = jest.fn();

const mockUseRoomAndBoardLocalStoreValue = {
    loadRoomAndBoardData: mockLoadRoomAndBoardData,
    isPopupShown: true,
    hidePopup: mockHidePopup,
    submitOffer: mockSubmitOffer,
    selectOffer: mockSelectOffer,
    isSubmitDisabled: false,
    offersRequest: mockResolvedObservablePromise(),
};
jest.mock(
    'frontend/components/renderings/AmendRoomAndBoardPopup/store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore',
    () => ({
        __esModule: true,
        withRoomAndBoardLocalStore: jest.fn(n => n),
        useRoomAndBoardLocalStore: () => mockUseRoomAndBoardLocalStoreValue,
    }),
);

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/boardsAndRooms.utils', () => ({
    __esModule: true,
    getAltRoomsTitle: jest.fn().mockReturnValue('AltRoomsTitle'),
}));

const mockRoomsSectionProps = jest.fn();
jest.mock('frontend/components/common/Room/RoomsSection/RoomsSection', () => ({
    __esModule: true,
    default: props => {
        mockRoomsSectionProps(props);

        return <div data-tid='rooms-selection' />;
    },
}));

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder'>{props.children}</div>;
    },
    Text: props => <div data-tid={props['data-tid']}>{props.field.value}</div>,
}));

jest.mock('frontend/components/common/AmendEntityPopup/AmendEntityPopup', () =>
    jest.fn(props => <div data-tid={props.tidPrefix}>{props.children}</div>),
);

describe('<AmendRoomAndBoardPopup />', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores();
        mockUseRoomAndBoardLocalStoreValue.isPopupShown = true;
        mockUseRoomAndBoardLocalStoreValue.isSubmitDisabled = false;
    });

    it('should render correctly when isPopupShown is true', () => {
        render(<AmendRoomAndBoardPopup {...mockProps} />);

        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.BoardTypes,
            rendering: mockProps.rendering,
        });

        expect(mockRoomsSectionProps).toHaveBeenCalledWith({
            showMoreExpandedTitle: mockProps.fields.AltRoomsExpandLabel?.value,
            originalRoomTitle: mockProps.fields.OriginalRoomTitle?.value,
            hideMoreCollapsedTitle: mockProps.fields.AltRoomsCollapseLabel?.value,
            altRoomsTitle: 'AltRoomsTitle',
            onChangeRoom: mockSelectOffer,
            chosenRoom: undefined,
            containerClass: 'roomsContainer',
            isLoading: false,
            mobileListMeta: {
                description: 'RoomsMobileListDescription',
                title: 'RoomsMobileListTitle',
            },
            pricePostfix: 'PriceSummary.Labels.Total',
            rooms: undefined,
            showRoomsPart: 'RoomAndBoardIcon',
            loadingSkeleton: expect.anything(),
        });

        expect(AmendEntityPopup).toHaveBeenCalledWith(
            {
                children: expect.anything(),
                contentClassName: 'content',
                isConfirmDisabled: false,
                onClose: mockHidePopup,
                onConfirm: mockSubmitOffer,
                subtitle: mockProps.fields.Subtitle,
                tidPrefix: 'room-and-board-popup',
                title: mockProps.fields.Title,
            },
            {},
        );
    });

    it('should pass right props on isLoading', () => {
        mockUseRoomAndBoardLocalStoreValue.offersRequest = mockPendingObservablePromise();

        render(<AmendRoomAndBoardPopup {...mockProps} />);

        expect(mockRoomsSectionProps).toHaveBeenCalledWith(
            expect.objectContaining({ isLoading: true, containerClass: 'roomsContainer isLoading' }),
        );
    });

    it('should not render when isPopupShown is false', () => {
        mockUseRoomAndBoardLocalStoreValue.isPopupShown = false;

        const { container } = render(<AmendRoomAndBoardPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call loadRoomAndBoardData on render', () => {
        render(<AmendRoomAndBoardPopup {...mockProps} />);

        expect(mockLoadRoomAndBoardData).toHaveBeenCalled();
    });
});
