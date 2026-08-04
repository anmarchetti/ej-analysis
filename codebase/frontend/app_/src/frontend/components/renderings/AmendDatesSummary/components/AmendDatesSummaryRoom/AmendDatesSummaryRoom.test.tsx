import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockAmendDatesStore } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import AmendDatesSummaryRoom from './AmendDatesSummaryRoom';

const createProps = () => ({
    icon: mockSitecoreImageField('icon'),
    title: mockSitecoreField('title'),
});

const createMockStores = () => ({
    amendDatesStore: mockAmendDatesStore,
    layoutStore: {
        getPhrase: v => v,
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockExpandProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockExpandProps(props);

        return <div data-tid={props.dataTid}>{children}</div>;
    },
}));

describe('<AmendDatesSummaryRoom />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Render passed rooms', () => {
        render(<AmendDatesSummaryRoom {...mockProps} />);

        expect(screen.getByTestId('unitRoomMock_mock')).toBeInTheDocument();
        expect(screen.getByText('RoomTypes.Labels.Room: roomType_title')).toBeInTheDocument();
        expect(screen.getByText('boardType_title')).toBeInTheDocument();
        expect(screen.getAllByText('BookingSummary.Labels.ForPeople').length).toBe(2);
        expect(screen.getByTestId('amend-dates-summary-rooms')).toBeInTheDocument();
        expect(mockExpandProps).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: mockProps.icon,
                title: mockProps.title.value,
                dataTid: 'amend-dates-summary-rooms',
            }),
        );
    });

    it('Render null', () => {
        mockStores.amendDatesStore.offer.accom.unit = [];
        const { container } = render(<AmendDatesSummaryRoom {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
