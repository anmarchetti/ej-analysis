import * as React from 'react';
import { render, screen } from '@testing-library/react';

import * as urgencyUtils from 'frontend/utils/urgencyMessage.utils';

import UrgencyMessage, { IUrgencyMessageProps } from './UrgencyMessage';

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(a => a),
        isHotelDetailsBookPage: false,
        getSetting: jest.fn(() => 5),
    },
    appStore: {
        isScreenMedium: true,
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/Pill/Pill', () => ({
    __esModule: true,
    default: ({ icon, ...props }) => {
        mockPillComponent(props);

        return <div data-tid='pill'>{icon}</div>;
    },
}));

jest.mock('frontend/components/icons-new/TimeRunningOut', () => ({
    __esModule: true,
    default: () => <div data-tid='time-running-out' />,
}));

const mockGetUrgencyMessage = jest.spyOn(urgencyUtils, 'getRoomsUrgencyMessage');

describe('<UrgencyMessage />', () => {
    const resetMocks = (): IUrgencyMessageProps => ({
        message: 'message',
        className: 'test',
        tooltip: 'tooltip',
        tooltipClass: 'tooltip class',
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
        mockGetUrgencyMessage.mockReturnValue('message');
    });

    it('should NOT when urgencyMessage is NOT provided', () => {
        mocks.message = '';

        const { container } = render(<UrgencyMessage {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render pill with correct text - title - tooltip class', () => {
        render(<UrgencyMessage {...mocks} />);

        expect(screen.getByTestId('pill')).toBeInTheDocument();
        expect(screen.getByTestId('time-running-out')).toBeInTheDocument();
        expect(mockPillComponent).toHaveBeenCalledWith({
            contentClass: 'urgencyMessageWrapper priority test',
            ellipsis: true,
            text: 'tooltip',
            title: 'message',
            tooltipClass: 'tooltip class',
        });
    });
});
