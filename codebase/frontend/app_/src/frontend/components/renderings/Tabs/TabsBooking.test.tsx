import React from 'react';
import { render } from '@testing-library/react';

import TabsBooking from './TabsBooking';

const createProps = () => ({
    fields: {
        items: [],
    },
});

const createStores = () => ({
    bookingStore: {
        hotel: {
            numberOfReviews: 10,
        },
    },
});

const mockAnchorsComponent = jest.fn();
let props;
let mockStores = createStores();

jest.mock('frontend/components/renderings/Tabs/components/Anchors', () => ({
    __esModule: true,
    default: props => {
        mockAnchorsComponent(props);

        return <div />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TabsBooking />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<TabsBooking {...props} />);

        expect(mockAnchorsComponent).toHaveBeenCalledWith({
            items: [],
            reviews: mockStores.bookingStore.hotel.numberOfReviews,
        });
    });

    it('should NOT render when fields are NOT provided', () => {
        props.fields = null;

        const { container } = render(<TabsBooking {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
