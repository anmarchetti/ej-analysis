import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockUnitRoom } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import RoomAndBoardDropdown, { IRoomAndBoardDropdownProps } from './RoomAndBoardDropdown';

const createMockProps = (): IRoomAndBoardDropdownProps => ({
    icon: mockSitecoreField(mockSitecoreImageField('icon')),
    title: mockSitecoreField('title'),
    unit: [mockUnitRoom],
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: ({ field }) => <span>{field.value}</span>,
}));

const mockAmendSummaryAccordionProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockAmendSummaryAccordionProps(props);

        return <div data-tid={props.dataTid}>{children}</div>;
    },
}));

const mockEditButtonProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/EditButton/EditButton', () => ({
    __esModule: true,
    default: props => {
        mockEditButtonProps(props);

        return (
            <button onClick={props.onClick} data-tid='edit-button'>
                {props.children}
            </button>
        );
    },
}));

const mockGetRoomsMetaResult = [
    {
        rooms: [
            {
                roomNumber: 'RoomTypes.Labels.Room',
                forPeople: 'BookingSummary.Labels.ForPeople',
                title: 'roomType_title',
                room: {
                    ...mockUnitRoom,
                    roomOccupationCount: 4,
                },
            },
        ],
        board: {
            code: 'boardType_code',
            title: 'boardType_title',
            itemName: 'boardType_title',
            name: 'boardType_name',
            content: 'boardType_content',
            description: 'boardType_description',
            iconUrl: 'boardType_icon',
            price: 14,
            pricePP: 7,
        },
        totalOccupation: 8,
        boardForPeopleLabel: 'BookingSummary.Labels.ForPeople',
    },
];

jest.mock('frontend/utils/HolidaySummaryRoom.utils', () => ({
    getRoomsMeta: jest.fn(() => mockGetRoomsMetaResult),
}));

describe('<RoomAndBoardDropdown />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createMockProps();
    });

    it('Render passed rooms', () => {
        render(<RoomAndBoardDropdown {...mockProps} />);

        expect(screen.getByTestId(mockUnitRoom.code)).toBeInTheDocument();
        expect(
            screen.getByText(
                `${mockGetRoomsMetaResult[0].rooms[0].roomNumber}: ${mockGetRoomsMetaResult[0].rooms[0].title}`,
            ),
        ).toBeInTheDocument();
        expect(screen.getByText(mockGetRoomsMetaResult[0].board.title)).toBeInTheDocument();
        expect(screen.getAllByText(mockGetRoomsMetaResult[0].boardForPeopleLabel).length).toBe(2);
        expect(mockAmendSummaryAccordionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: mockProps.icon,
                title: mockProps.title.value,
                dataTid: 'amend-summary-room-and-board',
            }),
        );
    });

    describe('Edit button', () => {
        beforeEach(() => {
            mockProps.CTALabel = mockSitecoreField('Edit');
            mockProps.onClickEditCTA = jest.fn();
        });

        it('Should render CTA if onClickEditCTA is passed', () => {
            render(<RoomAndBoardDropdown {...mockProps} />);

            expect(screen.getByTestId('edit-button')).toBeInTheDocument();
            expect(screen.getByText(mockProps.CTALabel.value)).toBeInTheDocument();
        });

        it('Should call onClickEditCTA on click', async () => {
            render(<RoomAndBoardDropdown {...mockProps} />);

            await userEvent.click(screen.getByTestId('edit-button'));

            expect(mockProps.onClickEditCTA).toHaveBeenCalled();
        });

        it('Should NOT render CTA if CTALabel is NOT passed', () => {
            mockProps.CTALabel = undefined;
            render(<RoomAndBoardDropdown {...mockProps} />);

            expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
        });
    });

    it('Should NOT render component if no unit provided', () => {
        mockProps.unit = [];
        const { container } = render(<RoomAndBoardDropdown {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
