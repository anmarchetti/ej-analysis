import * as React from 'react';
import { render } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { IAnimationTile } from './components/AnimationTile/AnimationTile';
import AnimationTiles from './AnimationTiles';

function createAnimationTileMockByDisplayName(displayName = 'displayName') {
    return {
        displayName,
        fields: {
            Title: mockSitecoreField('Title'),
            MoreText: mockSitecoreField('MoreText'),
            Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
            Image: mockSitecoreField(mockSitecoreImageField('Image')),
            ActiveTitle: mockSitecoreField('HoverTitle'),
            ActiveDescription: mockSitecoreField('HoverDescription'),
            ActiveIcon: mockSitecoreField(mockSitecoreImageField('HoverIcon')),
        },
    } as IAnimationTile;
}

const mockIdentifier = 'AnimationTile';

jest.mock('frontend/components/renderings/AnimationTiles/components/AnimationTile/AnimationTile', () => ({
    __esModule: true,
    default: () => <div>{mockIdentifier}</div>,
}));

let mocks;

describe('<AnimationTiles />', () => {
    const resetMocks = () => ({
        fields: {
            items: [
                createAnimationTileMockByDisplayName('test1'),
                createAnimationTileMockByDisplayName('test2'),
            ] as IAnimationTile[],
        },
        params: {} as any,
        rendering: {} as any,
    });

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should NOT render when no items', () => {
        mocks.fields.items = [];
        const { container } = render(<AnimationTiles {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when no fields', () => {
        delete mocks.fields;
        const { container } = render(<AnimationTiles {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render standard', () => {
        const { getAllByText } = render(<AnimationTiles {...mocks} />);

        const items = getAllByText(mockIdentifier);
        expect(items).toHaveLength(mocks.fields.items.length);
    });
});
