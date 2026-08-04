import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { roomWithFacilitiesAndPhotos } from 'frontend/components/renderings/RoomTypes/components/__mocks__/rooms';

import RoomSectionPreview, { IRoomSectionPreviewProps } from './RoomSectionPreview';

const createStores = () => ({
    appStore: { isScreenMedium: false },
    layoutStore: { isExtrasPage: false },
});

const createProps: () => IRoomSectionPreviewProps = () => ({
    roomType: roomWithFacilitiesAndPhotos.roomType,
    title: (roomWithFacilitiesAndPhotos.roomType.title as ISitecoreField<string>).value,
    altRoomsCount: 2,
    altLabel: 'other rooms available',
    openPanelLabel: 'Room information',
    panelLabel: 'Room 2',
    sectionIndex: 1,
    showAlternativeRooms: jest.fn(),
    openPanel: jest.fn(),
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('frontend/components/common/HotelImage/HotelImage', () => ({
    __esModule: true,
    default: () => <div data-tid='hotel-image' />,
}));

jest.mock('frontend/components/common/ShowMoreButton', () => ({
    __esModule: true,
    default: () => <div data-tid='show-more-button' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomSectionPreview />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<RoomSectionPreview {...mockProps} />);

        const element = screen.getByTestId('room-section-preview');

        expect(element).toBeInTheDocument();
        expect(element).toHaveAttribute('data-room-section', 'room-section');
        expect(element).toHaveAttribute('data-item-index', mockProps.sectionIndex.toString());
        expect(screen.getByTestId('hotel-image')).toBeInTheDocument();
        expect(screen.getByText(mockProps.panelLabel!)).toBeInTheDocument();
        expect(screen.getByText((mockProps.roomType!.title as ISitecoreField<string>).value)).toBeInTheDocument();
        expect(screen.queryByTestId('room-section-preview-link')).not.toBeInTheDocument();
        expect(screen.getByTestId('show-more-button')).toBeInTheDocument();
    });

    it('should skip render when roomType is undefined', () => {
        mockProps.roomType = undefined;

        const { container } = render(<RoomSectionPreview {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render HotelImage when have no image', () => {
        mockProps.roomType!.images = [];

        render(<RoomSectionPreview {...mockProps} />);

        expect(screen.queryByTestId('hotel-image')).not.toBeInTheDocument();
    });

    it('should NOT render altRooms link when altRoomsCount equal zero', () => {
        mockProps.altRoomsCount = 0;

        render(<RoomSectionPreview {...mockProps} />);

        expect(screen.getByTestId('room-section-preview')).toBeInTheDocument();
        expect(screen.queryByTestId('room-section-preview-link')).not.toBeInTheDocument();
    });

    it('should NOT render altRooms link on extras page ', () => {
        mockStores.layoutStore.isExtrasPage = true;

        render(<RoomSectionPreview {...mockProps} />);

        expect(screen.getByTestId('room-section-preview')).toBeInTheDocument();
        expect(screen.queryByTestId('room-section-preview-link')).not.toBeInTheDocument();
    });

    it('should render altLabel when screen is medium', () => {
        mockStores.appStore.isScreenMedium = true;

        render(<RoomSectionPreview {...mockProps} />);

        expect(screen.queryByTestId('room-section-preview-link')).toBeInTheDocument();
    });

    it('should NOT render ShowMoreButton when openPanelLabel is undefined', () => {
        mockProps.openPanelLabel = undefined;

        render(<RoomSectionPreview {...mockProps} />);

        expect(screen.queryByTestId('room-section-preview-link')).not.toBeInTheDocument();
    });
});
