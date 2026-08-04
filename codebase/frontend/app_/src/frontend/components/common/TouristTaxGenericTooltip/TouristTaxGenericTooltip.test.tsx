import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import { type ITouristTaxGenericTooltipProps, TouristTaxGenericTooltip } from './TouristTaxGenericTooltip';

let mockStores;
let mockProps: Omit<ITouristTaxGenericTooltipProps, 'children'>;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTaxTooltip = jest.fn();
jest.mock('frontend/components/common/TouristTaxTooltip/TouristTaxTooltip', () => ({
    __esModule: true,
    TouristTaxTooltip: ({ children, dataId, ...props }) => {
        mockTaxTooltip(props);

        return <div data-tid={dataId}>{children}</div>;
    },
}));

describe('<TouristTaxGenericTooltip />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {
                isTouristTaxEnabled: true,
                getPhrase: (phrase: string) => phrase,
            },
        });
        mockProps = {
            triggerClassName: 'test',
        };
    });

    it('should render component when isTouristTaxEnabled is enabled', () => {
        render(
            <TouristTaxGenericTooltip {...mockProps}>
                <div data-tid='children' />
            </TouristTaxGenericTooltip>,
        );

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('tax-generic-tooltip-label')).toBeInTheDocument();
        expect(mockTaxTooltip).toHaveBeenCalledWith({
            tooltipText: 'TouristTax.Tooltips.GenericContent',
            triggerClassName: 'trigger test',
        });
    });

    it('should render component with custom className if provided', () => {
        mockProps.triggerClassName = 'customClass';
        render(
            <TouristTaxGenericTooltip {...mockProps}>
                <div data-tid='children' />
            </TouristTaxGenericTooltip>,
        );

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('tax-generic-tooltip-label')).toBeInTheDocument();
        expect(mockTaxTooltip).toHaveBeenCalledWith({
            tooltipText: 'TouristTax.Tooltips.GenericContent',
            triggerClassName: 'trigger customClass',
        });
    });

    it('should render only children when isTouristTaxEnabled is disabled', () => {
        mockStores.layoutStore.isTouristTaxEnabled = false;

        render(
            <TouristTaxGenericTooltip {...mockProps}>
                <div data-tid='children' />
            </TouristTaxGenericTooltip>,
        );

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.queryByTestId('tax-generic-tooltip-label')).not.toBeInTheDocument();
        expect(mockTaxTooltip).not.toHaveBeenCalled();
    });
});
