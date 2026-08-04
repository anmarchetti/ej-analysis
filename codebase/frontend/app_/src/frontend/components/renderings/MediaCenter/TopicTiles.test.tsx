import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import TopicTiles from './TopicTiles';

let mocks;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./components/TopicTileItem', () => ({
    __esModule: true,
    default: () => <div data-tid='topic-tile-item' />,
}));

describe('<TopicTiles />', () => {
    const resetMocks = () => ({
        name: 'name',
        fields: {
            TopicsTiles: [
                {
                    fields: {
                        name: 'name',
                        Image: mockSitecoreField(
                            mockSitecoreImageField('/-/jssmedia/7767779c074d40299dfa92854ab4c843.ashx)'),
                        ),
                        Title: mockSitecoreField('Title'),
                    },
                },
            ],
        },
    });

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({ layoutStore: { getSetting: jest.fn(() => false) } });
    });

    it('Should standart render', () => {
        render(<TopicTiles {...mocks} />);

        expect(screen.getByTestId('topic-tiles-block')).toBeInTheDocument();
        expect(screen.getAllByTestId('topic-tile-item')).toHaveLength(1);
    });

    it("Should NOT render Topic Tiles Item if 'TopicsTiles' is empty", () => {
        mocks.fields = null;
        render(<TopicTiles {...mocks} />);

        expect(screen.getByTestId('topic-tiles-block')).toBeInTheDocument();
        expect(screen.queryAllByTestId('topic-tile-item')).toHaveLength(0);
    });
});
