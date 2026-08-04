import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ShortlistsNoResults, { TShortlistsNoResultsProps } from './ShortlistsNoResults';

const mockPathBreadcrumbs = jest.fn();
jest.mock('frontend/components/renderings/DestinationBreadcrumbs', () => ({
    __esModule: true,
    default: props => {
        mockPathBreadcrumbs(props);

        return <div data-tid='path-breadcrumbs' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/DestinationBreadcrumbs', () => () => <div data-tid='bread-crumbs' />);

jest.mock('frontend/components/icons/Heart', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-heart' />,
}));

const createProps = (): TShortlistsNoResultsProps => ({
    fields: {
        Title: mockSitecoreField('test1'),
        Description: mockSitecoreField('test2'),
    },
    rendering: null,
    params: {},
});

let mockProps: TShortlistsNoResultsProps;
let mockStores;

describe('<ShortlistsNoResults />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            shortlistStore: {
                initializeShortlists: jest.fn(),
            },
            layoutStore: {
                getBreadcrumb: jest.fn(path => path),
            },
            trackingStore: {
                trackShortlistView: jest.fn(),
            },
        });
    });

    it('should NOT render when fields are NOT provided', () => {
        mockProps.fields = undefined;
        const { container } = render(<ShortlistsNoResults {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should call initialize and trackShortlistView on component mount', () => {
        render(<ShortlistsNoResults {...mockProps} />);

        expect(mockStores.shortlistStore.initializeShortlists).toHaveBeenCalled();
        expect(mockStores.trackingStore.trackShortlistView).toHaveBeenCalledWith([]);
    });

    it('should render PathBreadcrumbs, title and description', () => {
        render(<ShortlistsNoResults {...mockProps} />);

        expect(screen.getByTestId('bread-crumbs')).toBeInTheDocument();
        expect(screen.getByText('test1')).toBeInTheDocument();
        expect(screen.getByText('test2')).toBeInTheDocument();
        expect(screen.getByTestId('icon-heart')).toBeInTheDocument();
    });
});
