import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockUnitRoom } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RoomCardContent, { IRoomCardContentProps } from './RoomCardContent';

expect.extend(toHaveNoViolations);

const createProps = (): IRoomCardContentProps => ({
    room: mockUnitRoom,
    isSelected: true,
    onClick: jest.fn(),
    pricePostfix: SitecoreDictionary.GlobalsPriceLabelsTotal,
    freeChildPlaceTooltip: 'freeChildPlaceTooltip',
    countryCode: 'ES',
});

let mockProps;

const mockActionProps = jest.fn();
jest.mock('frontend/components/common/Room/RoomCard/components/RoomCardAction/RoomCardAction', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockActionProps(props);

        return <div data-tid='action' onClick={onClick} />;
    },
}));

const mockTitleProps = jest.fn();
jest.mock('frontend/components/common/Room/RoomCard/components/RoomCardTitle/RoomCardTitle', () => ({
    __esModule: true,
    default: props => {
        mockTitleProps(props);

        return <div data-tid='title' />;
    },
}));

const mockFacilitiesProps = jest.fn();
jest.mock('frontend/components/renderings/RoomTypes/components/RoomFacilities/RoomFacilities', () => ({
    __esModule: true,
    default: props => {
        mockFacilitiesProps(props);

        return <div data-tid='facilities' />;
    },
}));

describe('<RoomCardContent />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('Should render children', () => {
        render(<RoomCardContent {...mockProps} />);

        expect(screen.getByTestId('facilities')).toBeInTheDocument();
        expect(screen.getByTestId('title')).toBeInTheDocument();
        expect(screen.getByTestId('action')).toBeInTheDocument();
        expect(mockFacilitiesProps).toHaveBeenCalledWith(
            expect.objectContaining({
                facilities: mockUnitRoom.roomType.facilities,
                roomFacilityFolderId: 'roomFacilityFolderId',
            }),
        );
        expect(mockActionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                price: 20,
                isPriceVisible: true,
                isSelected: true,
                pricePostfix: SitecoreDictionary.GlobalsPriceLabelsTotal,
                className: 'action',
            }),
        );
        expect(mockTitleProps).toHaveBeenCalledWith(
            expect.objectContaining({
                withIncludedSubtitle: true,
                room: mockUnitRoom,
                freeChildPlaceTooltip: mockProps.freeChildPlaceTooltip,
                countryCode: mockProps.countryCode,
            }),
        );
    });

    it('Should call onClick on action click', async () => {
        render(<RoomCardContent {...mockProps} />);

        await userEvent.click(screen.getByTestId('action'));

        expect(mockProps.onClick).toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<RoomCardContent {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
