import * as React from 'react';
import { render, screen } from '@testing-library/react';

import RoomCardBase, { IRoomCardBaseProps } from './RoomCardBase';

const mockRoomCardComponent = jest.fn();

jest.mock('frontend/components/renderings/RoomTypes/components/RoomCard/RoomCard', () => ({
    __esModule: true,
    default: props => {
        mockRoomCardComponent(props);

        return <div data-tid='room-card' />;
    },
}));

const createProps = () =>
    ({
        room: {
            code: 'code',
        },
        fallbackImg: 'fallbackImg',
    } as IRoomCardBaseProps);

let props;

describe('<RoomCardBase />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Should render ShowMoreButton component when isScreenMedium is true', () => {
        render(<RoomCardBase {...props} />);

        expect(screen.getByTestId('room-card')).toBeInTheDocument();
        expect(mockRoomCardComponent).toHaveBeenCalledWith({
            room: props.room,
            fallbackImage: props.fallbackImg,
            offer: null,
            priceDifference: 0,
            selectedRoomSectionIndex: 0,
            isAlteration: undefined,
            isMultipleRoomSelected: false,
            isSelected: true,
            tooltipClass: 'tooltip priority',
        });
    });

    it('Should render RoomCard component with empty string in fallbackImage prop when fallbackImg prop is not defined', () => {
        props.fallbackImg = undefined;
        props.isAlteration = true;

        render(<RoomCardBase {...props} />);

        expect(screen.getByTestId('room-card')).toBeInTheDocument();
        expect(mockRoomCardComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                fallbackImage: '',
                isAlteration: true,
                tooltipClass: 'tooltip priority',
            }),
        );
    });
});
