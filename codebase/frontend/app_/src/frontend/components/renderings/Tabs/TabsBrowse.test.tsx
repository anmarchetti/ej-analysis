import React from 'react';
import { render } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import TabsBrowse from './TabsBrowse';

const createProps = () => ({
    fields: {
        items: [],
    },
});

const createStores = () => ({
    layoutStore: {
        layout: {
            sitecore: {
                route: {
                    fields: {
                        TotalNumberOfReviews: mockSitecoreField('10'),
                    },
                },
            },
        },
    },
});

let mockStores = createStores();

const mockAnchorsComponent = jest.fn();
let props;

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

describe('<TabsBrowse />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<TabsBrowse {...props} />);

        expect(mockAnchorsComponent).toBeCalledWith({
            items: [],
            reviews: 10,
        });
    });

    it('should NOT pass reviews to the anchor component when route fields are not defined', () => {
        (mockStores.layoutStore.layout.sitecore.route as any) = {};

        render(<TabsBrowse {...props} />);

        expect(mockAnchorsComponent).toHaveBeenCalledWith({ items: [] });
    });

    it('should NOT pass reviews to the anchor component when the value of total number of reviews is NOT provided in route fields', () => {
        (mockStores.layoutStore.layout.sitecore.route.fields as any) = {};

        render(<TabsBrowse {...props} />);

        expect(mockAnchorsComponent).toHaveBeenCalledWith({ items: [] });
    });

    it('should NOT render when fields are NOT provided', () => {
        props.fields = null;

        const { container } = render(<TabsBrowse {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
