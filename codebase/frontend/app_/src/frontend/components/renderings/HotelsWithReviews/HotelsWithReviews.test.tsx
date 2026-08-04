import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import HotelsWithReviews from './HotelsWithReviews';

const createProps = () => ({
    fields: {
        items: [
            {
                displayName: 'qawra',
                name: 'qawra',
                url: '/malta/malta/qawra',
                fields: { Name: 'name' },
            },
        ] as any,
    },
    params: {} as any,
    rendering: {} as any,
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        displayName: 'name',
    },
    appStore: { isScreenLessMedium: false },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HotelsWithReviews />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should NOT render', () => {
        mockProps.fields.items = [];
        const { queryByTestId } = render(<HotelsWithReviews {...mockProps} />);

        expect(queryByTestId('hotels')).not.toBeInTheDocument();
    });

    it('Should render', () => {
        render(<HotelsWithReviews {...mockProps} />);

        expect(mockStores.layoutStore.getPhrase).toBeCalledWith(SitecoreDictionary.GlobalsTitlesHotelsIn);
    });
});
