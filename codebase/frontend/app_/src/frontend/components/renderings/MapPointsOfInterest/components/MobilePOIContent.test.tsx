import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IMapPOIContentProps } from 'frontend/components/renderings/MapPointsOfInterest/IMapPointsOfInterest';

import { contentProps } from './__mocks__';
import MobilePOIContent from './MobilePOIContent';

const createProps = (): IMapPOIContentProps => contentProps;

let mockProps;

jest.mock('frontend/components/renderings/MapPointsOfInterest/components/SinglePointCard', () => ({
    __esModule: true,
    default: () => <div data-tid='single-point-card' />,
}));

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: ({ children }) => <div data-tid='tooltip-trigger'>{children}</div>,
    TooltipContent: ({ children }) => <div data-tid='tooltip-content'>{children}</div>,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: () => <div data-tid='text' />,
}));

jest.mock('frontend/components/icons-new/Arrow', () => ({
    __esModule: true,
    default: () => <div data-tid='arrow' />,
}));

jest.mock('frontend/components/renderings/MapPointsOfInterest/components/MobilePOIDrawerContent', () => ({
    __esModule: true,
    default: ({ handleCategoryClick }) => <button onClick={handleCategoryClick} data-tid='mobile-poi-drawer-content' />,
}));

jest.mock('frontend/components/common/Button/Button', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='button'>{children}</div>,
}));

describe('<MobilePOIContent />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<MobilePOIContent {...mockProps} />);

        expect(screen.getAllByTestId('single-point-card')).toHaveLength(4);
        expect(screen.getAllByTestId('tooltip')).toHaveLength(2);
        expect(screen.getAllByTestId('tooltip-trigger')).toHaveLength(2);
        expect(screen.getAllByTestId('tooltip-content')).toHaveLength(2);
        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(screen.getByTestId('arrow')).toBeInTheDocument();
    });

    it('should call handleCategoryClick when button is clicked', async () => {
        render(<MobilePOIContent {...mockProps} />);

        await userEvent.click(screen.getByTestId('mobile-poi-drawer-content'));

        expect(mockProps.handleCategoryClick).toHaveBeenCalled();
    });

    it('should NOT render SinglePointCard when first category does NOT have items', () => {
        mockProps.categoriesWithItems[0].items = undefined;

        render(<MobilePOIContent {...mockProps} />);

        expect(screen.queryByTestId('single-point-card')).not.toBeInTheDocument();
    });

    it('should NOT render tooltip when disclaimerTooltip does NOT exist', () => {
        mockProps.disclaimerTooltip = '';

        render(<MobilePOIContent {...mockProps} />);

        expect(screen.getAllByTestId('tooltip')).toHaveLength(1);
    });
});
