import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { getPersonProps } from 'frontend/utils/seatAndBags.utils';
import {
    mockPassenger,
    mockPersonDetailsProps,
} from 'frontend/components/renderings/SeatAndBags/__mocks__/mockPasenger';
import { mockAncillariesChildren } from 'frontend/components/renderings/SeatAndBags/__mocks__/mockSeatAndBagsFields';

import { AncillariesPassengerType, IAncillariesPassengerTypeProps } from './AncillariesPassengerType';

const createProps = (): IAncillariesPassengerTypeProps => ({
    outboundPassenger: mockPassenger,
    fields: { Children: mockAncillariesChildren },
    numberOfPerson: 1,
});

const createStores = () => ({ layoutStore: { getPhrase: jest.fn(p => p) } });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/seatAndBags.utils', () => ({
    __esModule: true,
    getPersonProps: jest.fn(() => mockPersonDetailsProps),
}));

const mockPersonDetails = jest.fn();
jest.mock('frontend/components/common/AncillariesPersonDetails/AncillariesPersonDetails', () => ({
    __esModule: true,
    default: props => {
        mockPersonDetails(props);

        return <div data-tid='ancillaries-person-details' {...props} />;
    },
}));

describe('<AncillariesPassengerType />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should skip when NO Children in props', () => {
        const { container } = render(<AncillariesPassengerType {...mockProps} fields={undefined} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should skip when getPersonProps does NOT return anything', () => {
        const mockGetPersonProps = getPersonProps as jest.MockedFn<typeof getPersonProps>;
        mockGetPersonProps.mockReturnValueOnce(undefined);

        const { container } = render(<AncillariesPassengerType {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render component with correct props', () => {
        render(<AncillariesPassengerType {...mockProps} />);

        expect(getPersonProps).toHaveBeenCalledWith(
            mockPassenger,
            mockAncillariesChildren,
            1,
            mockStores.layoutStore.getPhrase,
        );

        expect(screen.getByTestId('passenger-wrapper')).toHaveClass('passenger');
        expect(screen.getByTestId('ancillaries-person-details')).toBeInTheDocument();
        expect(mockPersonDetails).toHaveBeenCalledWith(mockPersonDetailsProps);
    });
});
