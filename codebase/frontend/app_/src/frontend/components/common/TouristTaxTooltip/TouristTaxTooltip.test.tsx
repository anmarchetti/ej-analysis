import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import { ITouristTaxTooltip, TouristTaxTooltip } from './TouristTaxTooltip';

let mockProps: ITouristTaxTooltip;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTooltipTriggerProps = jest.fn();
const mockTooltipContentProps = jest.fn();
jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: ({ children, ...props }) => {
        mockTooltipTriggerProps(props);

        return <div data-tid='tooltip-trigger'>{children}</div>;
    },
    TooltipContent: props => {
        mockTooltipContentProps(props);

        return <div data-tid='tooltip-content' />;
    },
}));

describe('<TouristTaxTooltip />', () => {
    beforeEach(() => {
        mockProps = {
            tooltipText: 'tooltipText',
            children: <div data-tid='children' />,
            triggerClassName: 'triggerClassName',
            dataId: 'children-wrapper',
        };
        mockStores = createMockStores();
    });

    it('should render component', () => {
        render(<TouristTaxTooltip {...mockProps} />);

        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('children-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();

        expect(mockTooltipTriggerProps).toHaveBeenCalledWith({ tabIndex: 0 });
        expect(mockTooltipContentProps).toHaveBeenCalledWith({
            text: 'tooltipText',
            className: 'content tooltipContent',
        });
    });
});
