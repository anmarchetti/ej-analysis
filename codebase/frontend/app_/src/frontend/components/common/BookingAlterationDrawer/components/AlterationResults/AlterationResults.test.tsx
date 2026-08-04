import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import * as utils from 'frontend/utils/url.utils';
import { IUnit } from 'models/data/IOffer';
import { boardTypesFields } from 'frontend/components/renderings/BoardTypes/components/__mocks__/boardTypesFields';

import AlterationResults, { IAlterationResultsProps, OLD_IMAGE_HEIGHT, OLD_IMAGE_WIDTH } from './AlterationResults';

const mockBoardCardComponent = jest.fn();
jest.mock('frontend/components/renderings/BoardTypes/components/BoardCard/BoardCard', () => ({
    __esModule: true,
    default: props => {
        mockBoardCardComponent(props);

        return <div data-tid='board-card' />;
    },
}));

const mockRoomCardBaseComponent = jest.fn();
jest.mock('frontend/components/renderings/RoomTypes/components/RoomCardBase/RoomCardBase', () => ({
    __esModule: true,
    default: props => {
        mockRoomCardBaseComponent(props);

        return <div data-tid='room-card-base' />;
    },
}));

const mockJSSImageNext = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageNext(props);

        return <div data-tid='jss-image-next' />;
    },
}));

jest.mock('frontend/components/icons-new/HotelBedFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='hotel-bed-filled-icon' />,
}));

jest.mock('frontend/components/icons-new/Cup', () => ({
    __esModule: true,
    default: () => <div data-tid='cup-icon' />,
}));

const createProps = (): IAlterationResultsProps => {
    const { AlterationRoomResultTitle, AlterationResultSubtitle, AlterationRoomResultTextSingular } =
        boardTypesFields();

    return {
        fallbackImage: 'fallback-img',
        alterationResult: {
            title: AlterationRoomResultTitle,
            subtitle: AlterationResultSubtitle,
            text: AlterationRoomResultTextSingular,
            items: [
                {
                    newItem: {
                        item: {} as IUnit,
                        roomIdx: 1,
                    },
                    oldItemName: 'replaceableItemName',
                    oldItemImgSrc: 'oldItemImgSrc',
                },
            ],
            isBoardAlteration: false,
        },
    };
};

let props;
jest.spyOn(utils, 'getImageUrl').mockReturnValue('mocked url');

describe('<AlterationResults />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should NOT render when alterationResultItems prop is empty array', () => {
        props.alterationResult.items = [];

        const { container } = render(<AlterationResults {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render with RoomCardBase when isBoardAlteration is false', () => {
        render(<AlterationResults {...props} />);

        expect(screen.getByTestId('alteration-result-wrapper')).toHaveClass('alterationResults resultsWithSeparator');
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(props.alterationResult.title.value);
        expect(screen.getByText(props.alterationResult.subtitle.value)).toBeInTheDocument();
        expect(screen.getByTestId('alteration-old-item-image')).toBeInTheDocument();
        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(screen.getByTestId('hotel-bed-filled-icon')).toBeInTheDocument();
        expect(screen.getByTestId('room-card-base')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent(props.alterationResult.text.value);

        expect(mockJSSImageNext).toHaveBeenCalledWith({
            field: mockSitecoreField(mockSitecoreImageField('oldItemImgSrc')),
            className: 'oldImage',
            width: OLD_IMAGE_WIDTH,
            height: OLD_IMAGE_HEIGHT,
        });
        expect(mockRoomCardBaseComponent).toHaveBeenCalledWith({
            room: props.alterationResult.items[0].newItem.item,
            isAlteration: true,
            roomIdx: props.alterationResult.items[0].newItem.roomIdx,
            fallbackImg: undefined,
        });
    });

    it('should standard render with BoardCard when isBoardAlteration is true', () => {
        props.alterationResult.isBoardAlteration = true;

        render(<AlterationResults {...props} />);

        expect(screen.getByTestId('alteration-result-wrapper')).toHaveClass('alterationResults');
        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(screen.getByTestId('cup-icon')).toBeInTheDocument();
        expect(screen.getByTestId('board-card')).toBeInTheDocument();

        expect(mockJSSImageNext).toHaveBeenCalledWith({
            field: mockSitecoreField(mockSitecoreImageField('mocked url')),
            className: 'oldImage',
            width: OLD_IMAGE_WIDTH,
            height: OLD_IMAGE_HEIGHT,
        });
        expect(mockBoardCardComponent).toHaveBeenCalledWith({
            board: props.alterationResult.items[0].newItem.item,
            isAlteration: true,
            isSelected: true,
            isSpoiler: false,
        });
    });

    it('should render image with fallback image when oldItemImgSrc is NOT provided', () => {
        props.alterationResult.items[0].oldItemImgSrc = undefined;

        render(<AlterationResults {...props} />);

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSImageNext).toHaveBeenCalledWith({
            field: mockSitecoreField(mockSitecoreImageField('fallback-img')),
            className: 'oldImage',
            width: OLD_IMAGE_WIDTH,
            height: OLD_IMAGE_HEIGHT,
        });
    });
});
