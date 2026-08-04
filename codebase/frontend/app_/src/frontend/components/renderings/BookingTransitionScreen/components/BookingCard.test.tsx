import React from 'react';
import { render } from '@testing-library/react';

import BookingCard from './BookingCard';

const createProps = () => ({
    TileTitle: { value: 'title' },
    TileDescription: { value: 'description' },
    TileIcon: { value: { src: 'icon' } },
});

const createStores = () => ({
    layoutStore: {},
    appStore: {},
    routerStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BookingCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render', () => {
        const { getByRole, getByText } = render(<BookingCard {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('title');
        expect(getByRole('img')).toBeInTheDocument();
        expect(getByText('description')).toBeInTheDocument();
    });

    it('should NOT render: title, descritpion, icon', () => {
        mockProps.TileDescription.value = '';
        mockProps.TileIcon.value = '';
        mockProps.TileTitle.value = '';
        const { queryByRole, queryByText } = render(<BookingCard {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
        expect(queryByRole('img')).not.toBeInTheDocument();
        expect(queryByText('description')).not.toBeInTheDocument();
    });
});
