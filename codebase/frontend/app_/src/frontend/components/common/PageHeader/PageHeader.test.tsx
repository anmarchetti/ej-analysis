import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import PageHeader, { TPageHeaderProps } from './PageHeader';

const createProps = (): TPageHeaderProps => ({
    Title: mockSitecoreField('Special Assistance'),
    breadcrumbs: [
        {
            key: 'breadcrumb-1',
            value: '/breadcrumb-1',
        },
        {
            key: 'breadcrumb-2',
            value: '/breadcrumb-2',
        },
    ],
});

let mockProps = createProps();

const mockDestinationBreadcrumbs = jest.fn();
jest.mock('frontend/components/renderings/DestinationBreadcrumbs', () => ({
    __esModule: true,
    default: props => {
        mockDestinationBreadcrumbs(props);

        return <div data-tid='destination-breadcrumbs' />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='jss-text' />;
    },
}));

jest.mock('frontend/utils/viewBooking.utils', () => ({
    getDaysBeforeDeparture: jest.fn(() => 30),
}));

describe('<PageHeader />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        render(<PageHeader {...mockProps} />);

        expect(screen.getByTestId('page-header')).toBeInTheDocument();

        expect(screen.getByTestId('destination-breadcrumbs')).toBeInTheDocument();
        expect(mockDestinationBreadcrumbs).toHaveBeenCalledWith({
            breadcrumbs: mockProps.breadcrumbs,
            hideHomeBreadcrumb: true,
            isOpaqueStyle: true,
            onBreadcrumbClick: undefined,
        });

        expect(screen.getByTestId('jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.Title,
            tag: 'h1',
            className: 'title',
            'data-tid': 'page-header-title',
        });
    });

    it('should pass onBreadcrumbClick to DestinationBreadcrumbs', () => {
        const onBreadcrumbClick = jest.fn();
        render(<PageHeader {...mockProps} onBreadcrumbClick={onBreadcrumbClick} />);

        expect(mockDestinationBreadcrumbs).toHaveBeenCalledWith(
            expect.objectContaining({
                onBreadcrumbClick,
            }),
        );
    });
});
