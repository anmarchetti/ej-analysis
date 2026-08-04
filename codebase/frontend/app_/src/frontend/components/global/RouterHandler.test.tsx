import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';

import RouterHandler from './RouterHandler';

const createProps = () => ({
    children: <div data-tid='children' />,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RouterHandler />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            routerStore: {
                search: '',
                initialize: jest.fn(),
            },
            layoutStore: {
                layoutId: 'layoutId',
            },
            queryParamStore: {
                parseAndSyncQuery: jest.fn(),
            },
            bookingStore: {
                fetchOfferOnPageLoad: jest.fn(),
            },
        });
    });

    it('should render children', () => {
        render(<RouterHandler {...mockProps} />);

        expect(screen.getByTestId('children')).toBeInTheDocument();
    });

    it('should call initialize on render', () => {
        render(<RouterHandler {...mockProps} />);

        expect(mockStores.routerStore.initialize).toHaveBeenCalled();
    });

    it('should call syncParams and fetchOfferOnPageLoad on rerender after layoutId change', () => {
        const { rerender } = render(<RouterHandler {...mockProps} />);

        expect(mockStores.queryParamStore.parseAndSyncQuery).not.toHaveBeenCalled();
        expect(mockStores.bookingStore.fetchOfferOnPageLoad).not.toHaveBeenCalled();

        mockStores.layoutStore.layoutId = 'newLayoutId';
        mockProps.children = <div data-tid='new-children' />;

        rerender(<RouterHandler {...mockProps} />);

        expect(mockStores.queryParamStore.parseAndSyncQuery).toHaveBeenCalled();
        expect(mockStores.bookingStore.fetchOfferOnPageLoad).toHaveBeenCalledWith(true);
    });
});
