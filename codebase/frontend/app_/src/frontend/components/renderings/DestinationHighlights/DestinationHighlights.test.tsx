import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { DestinationHighlights } from './DestinationHighlights';

const createProps = () => ({
    fields: {
        Children: [
            {
                id: 'id1',
                fields: {
                    Title: mockSitecoreField('title1'),
                    Icon: mockSitecoreImageField('src1'),
                    Highlights: [],
                },
            },
            {
                id: 'id2',
                fields: {
                    Title: mockSitecoreField('title2'),
                    Icon: mockSitecoreImageField('src2'),
                    Highlights: [],
                },
            },
        ],
    },
});

let mockProps;

const mockDestinationHighlightsTabsProps = jest.fn();
const mockDestinationHighlightsTabPanelProps = jest.fn();

jest.mock(
    'frontend/components/renderings/DestinationHighlights/components/DestinationHighlightsTabs/DestinationHighlightsTabs',
    () => ({
        __esModule: true,
        default: props => {
            mockDestinationHighlightsTabsProps(props);

            return <div data-tid='destination-highlights-tabs' />;
        },
    }),
);

jest.mock('frontend/components/renderings/DestinationHighlights/components/DestinationHighlightsTabPanel', () => ({
    __esModule: true,
    default: props => {
        mockDestinationHighlightsTabPanelProps(props);

        return <div data-tid='destination-highlights-tab-panel' />;
    },
}));

describe('<DestinationHighlights />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT be rendered when fields are NOT provided', () => {
        mockProps.fields = undefined;
        const { container } = render(<DestinationHighlights {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when children are empty array', () => {
        mockProps.fields.Children = [];
        const { container } = render(<DestinationHighlights {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render DestinationHighlightsTabs and 2 DestinationHighlightsTabPanel', () => {
        render(<DestinationHighlights {...mockProps} />);

        expect(screen.getByTestId('destination-highlights-tabs')).toBeInTheDocument();
        expect(screen.getAllByTestId('destination-highlights-tab-panel')).toHaveLength(2);
        expect(mockDestinationHighlightsTabsProps).toHaveBeenCalledWith({
            tabs: mockProps.fields.Children,
            activeTabId: 'id1',
            setActiveTabId: expect.any(Function),
        });

        expect(mockDestinationHighlightsTabPanelProps).toHaveBeenNthCalledWith(1, {
            tabItem: mockProps.fields.Children[0],
            isActiveTab: true,
        });

        expect(mockDestinationHighlightsTabPanelProps).toHaveBeenNthCalledWith(2, {
            tabItem: mockProps.fields.Children[1],
            isActiveTab: false,
        });
    });
});
