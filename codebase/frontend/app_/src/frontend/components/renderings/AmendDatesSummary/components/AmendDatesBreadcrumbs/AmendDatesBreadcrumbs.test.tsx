import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import SitePath, { SitePathOverload } from 'models/enum/SitePath';

import AmendDatesBreadcrumbs from './AmendDatesBreadcrumbs';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockDestinationBreadcrumbs = jest.fn();
jest.mock('frontend/components/renderings/DestinationBreadcrumbs', () => ({
    __esModule: true,
    default: props => {
        mockDestinationBreadcrumbs(props);

        return <div data-tid='destination-breadcrumbs' />;
    },
}));

describe('<AmendDatesBreadcrumbs/>', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {
                getBreadcrumb: (path, text) => ({ value: path, key: text || path }),
                currentPath: '/booking/change-dates/summary',
            },
        });
    });

    it('Render breadcrumbs', () => {
        render(<AmendDatesBreadcrumbs />);

        expect(screen.getByTestId('destination-breadcrumbs')).toBeInTheDocument();
        expect(mockDestinationBreadcrumbs).toHaveBeenCalledWith({
            breadcrumbs: [
                { key: '/booking/my_booking', value: '/booking/my_booking' },
                { key: '/booking/change-dates/summary', value: '/booking/change-dates/summary' },
            ],
            hideHomeBreadcrumb: true,
            isOpaqueStyle: true,
        });
    });

    it('Render breadcrumbs with rootPath and rootText', () => {
        render(<AmendDatesBreadcrumbs rootPath={SitePath.AmendDates} rootText={SitePathOverload.ChangeYourSeats} />);

        expect(screen.getByTestId('destination-breadcrumbs')).toBeInTheDocument();
        expect(mockDestinationBreadcrumbs).toHaveBeenCalledWith(
            expect.objectContaining({
                breadcrumbs: [
                    { key: 'ChangeYourSeats', value: '/booking/change-dates' },
                    { key: '/booking/change-dates/summary', value: '/booking/change-dates/summary' },
                ],
            }),
        );
    });
});
