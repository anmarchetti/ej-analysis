import * as React from 'react';
import { render, screen } from '@testing-library/react';

import settings from 'code/settings';
import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { IRoomFacility } from 'models/data/IHotel';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IRoomFacilityItemProps, RoomFacilityItem } from './RoomFacilityItem';

const createProps = () =>
    ({
        roomFacility: {} as IRoomFacility,
        getPhrase: jest.fn(phrase => phrase),
        getFormattedNumber: jest.fn(number => `${number}`),
        tooltipClass: 'test',
    } as IRoomFacilityItemProps);

const createStores = () => createMockStores();

let props;
let mockStores;

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: ({ children }) => <div data-tid='tooltip-trigger'>{children}</div>,
    TooltipContent: ({ children }) => <div data-tid='tooltip-content'>{children}</div>,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomFacilityItem />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should render facility item', () => {
        props.roomFacility = {
            name: 'facilityname',
            code: 'facilitycode',
        };
        render(<RoomFacilityItem {...props} />);

        expect(screen.getByTestId('facility-item')).toHaveTextContent(props.roomFacility.name);
    });

    it('should render tooltip info icon if there is disclaimer message', () => {
        props.roomFacility = {
            name: 'facilityname',
            code: 'AC',
            disclaimerMessage: 'disclaimerMessage',
        };

        render(<RoomFacilityItem {...props} />);

        expect(screen.getByTestId('facility-item')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    });

    it('should not render tooltip info icon if there is no disclaimer message', () => {
        props.roomFacility = {
            name: 'facilityname',
            code: 'test',
            disclaimerMessage: '',
        };

        render(<RoomFacilityItem {...props} />);

        expect(screen.getByTestId('facility-item')).toBeInTheDocument();
        expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });

    it('should render room size facility when roomFacilityCode is RoomSizeFacilityCode', () => {
        props.roomFacility = {
            name: 'room size',
            code: settings.AlternativeRooms.RoomSizeFacilityCode,
            number: 3500,
        };

        render(<RoomFacilityItem {...props} />);

        expect(
            screen.getByText(`${SitecoreDictionary.RoomTypesLabelsRoomSizeFacility} ${props.roomFacility.number}`),
        ).toBeInTheDocument();
    });

    describe('deleteItem', () => {
        let component;
        let itemId;

        beforeEach(() => {
            props.onDeleteItem = jest.fn();
            component = new RoomFacilityItem(props);
            itemId = 'itemId';
            window.confirm = jest.fn(() => true);
        });

        it('should NOT call onDeleteItem on deleteItem when confirm returns false', () => {
            window.confirm = jest.fn(() => false);

            component.deleteItem({
                target: {
                    dataset: { itemId },
                },
                preventDefault: jest.fn(),
            });

            expect(props.onDeleteItem).not.toHaveBeenCalled();
        });

        it('should NOT call onDeleteItem on deleteItem when no itemId set', () => {
            itemId = null;

            component.deleteItem({
                target: {
                    dataset: { itemId },
                },
                preventDefault: jest.fn(),
            });

            expect(props.onDeleteItem).not.toHaveBeenCalled();
        });

        it('should call onDeleteItem on deleteItem', () => {
            component.deleteItem({
                target: {
                    dataset: { itemId },
                },
                preventDefault: jest.fn(),
            });

            expect(props.onDeleteItem).toHaveBeenCalledWith(itemId);
        });
    });
});
