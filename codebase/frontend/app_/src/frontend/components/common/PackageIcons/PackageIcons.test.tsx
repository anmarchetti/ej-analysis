import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PackageIcons, { IPackageIconsProps } from './PackageIcons';
import * as utils from './PackageIcons.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSNext = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockJSSNext(props);

        return <div data-tid='jss-next' />;
    },
}));

const mockListedItems = jest.fn();
jest.mock('frontend/components/renderings/ListedItems/ListedItems', () => ({
    __esModule: true,
    default: props => {
        mockListedItems(props);

        return <div data-tid='listed-items' />;
    },
}));

const usePackageIcons = jest.spyOn(utils, 'default').mockReturnValue({ getPhrase: jest.fn(p => p) });

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: ({ children }) => <div data-tid='mocked-tooltip-trigger'>{children}</div>,
    TooltipContent: ({ children }) => <div data-tid='tooltip-content'>{children}</div>,
}));

jest.mock('frontend/components/icons/ChevronDown', () => ({
    __esModule: true,
    default: () => <i data-tid='chevron-down' />,
}));

jest.mock('frontend/components/icons-new/ChevronDownGradient', () => ({
    __esModule: true,
    default: () => <i data-tid='chevron-down-gradient' />,
}));

jest.mock('frontend/components/common/LuxuryBadge/LuxuryBadge', () => ({
    __esModule: true,
    default: () => <i data-tid='luxury-badge' />,
}));

const customItems = [
    {
        icon: {
            alt: 'alternative text',
            src: 'icon-src',
        },
        label: 'Icon Label 1',
    },
];

let mockProps: IPackageIconsProps;
let mockStores;

describe('<PackageIcons />', () => {
    beforeEach(() => {
        mockProps = {
            isLuxury: false,
            extraLuggage: null,
            packageIcons: [],
            transfer: null,
        };
        mockStores = createMockStores();
    });

    it('should NOT render when customItems is empty and isLuxury is false', () => {
        const { container } = render(<PackageIcons {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Tooltip Trigger', () => {
        it('should render when isLuxury is false', () => {
            usePackageIcons.mockReturnValueOnce({
                getPhrase: jest.fn(p => p),
                customItems,
            });
            render(<PackageIcons {...mockProps} />);

            expect(screen.getByTestId('mocked-tooltip-trigger')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip-trigger')).not.toHaveClass('luxuryTrigger');

            expect(screen.getByText(SitecoreDictionary.LuxuryLabelsIncludes)).toBeInTheDocument();
            expect(screen.getAllByTestId('listed-items')).toHaveLength(2);
            expect(mockListedItems).toHaveBeenNthCalledWith(1, {
                className: 'items',
                itemClassName: 'item',
                customItems,
            });
            expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
            expect(screen.queryByTestId('chevron-down-gradient')).not.toBeInTheDocument();
        });

        it('should render when isLuxury is true', () => {
            mockProps.isLuxury = true;

            render(<PackageIcons {...mockProps} />);

            expect(screen.getByTestId('mocked-tooltip-trigger')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip-trigger')).toHaveClass('triggerLuxury');

            expect(screen.getByText(SitecoreDictionary.LuxuryLabelsIncludes)).toBeInTheDocument();
            expect(screen.getByTestId('luxury-badge')).toBeInTheDocument();
            expect(screen.getByTestId('jss-next')).toBeInTheDocument();
            expect(mockJSSNext).toHaveBeenCalledWith({
                name: 'listed-items',
                rendering: undefined,
            });
            expect(screen.getByTestId('chevron-down-gradient')).toBeInTheDocument();
            expect(screen.queryByTestId('chevron-down')).not.toBeInTheDocument();
        });
    });

    describe('Tooltip Content', () => {
        it('should render when isLuxury is false', () => {
            usePackageIcons.mockReturnValueOnce({
                getPhrase: jest.fn(p => p),
                customItems,
            });
            render(<PackageIcons {...mockProps} />);

            expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
            expect(screen.getAllByTestId('listed-items')).toHaveLength(2);
            expect(mockListedItems).toHaveBeenNthCalledWith(2, {
                customItems,
            });
            expect(screen.getByText(SitecoreDictionary.LuxuryLabelsWhatsIncludedMore)).toBeInTheDocument();
        });

        it('should render when isLuxury is true', () => {
            mockProps.isLuxury = true;

            render(<PackageIcons {...mockProps} />);

            expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
            expect(screen.getByTestId('luxury-badge')).toBeInTheDocument();
            expect(screen.getByTestId('jss-next')).toBeInTheDocument();
            expect(mockJSSNext).toHaveBeenCalledWith({
                name: 'listed-items',
                rendering: undefined,
            });
            expect(screen.getByText(SitecoreDictionary.LuxuryLabelsWhatsIncludedMore)).toBeInTheDocument();
        });
    });
});
