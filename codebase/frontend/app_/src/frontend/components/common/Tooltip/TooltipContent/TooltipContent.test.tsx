import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockTooltipContextData } from 'frontend/__mocks__/tooltip';
import * as mediaQueryUtils from 'frontend/hooks/useMediaQuery';
import * as utils from 'frontend/components/common/Tooltip/Tooltip.utils';

import TooltipContent from './TooltipContent';

jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: () => <div data-tid='jss-image-next' />,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    RichTextWithLinks: () => <div data-tid='rich-text-with-links' />,
}));

const mockMobileContentComponent = jest.fn();
jest.mock('./components/MobileContent', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockMobileContentComponent(props);

        return <div data-tid='mobile-content'>{children}</div>;
    },
}));

jest.mock('@floating-ui/react', () => ({
    __esModule: true,
    FloatingPortal: ({ children }) => <div data-tid='floating-portal'>{children}</div>,
    FloatingArrow: () => <div data-tid='floating-arrow' />,
    useMergeRefs: jest.fn(),
}));

const useTooltipContext = jest
    .spyOn(utils, 'useTooltipContext')
    .mockReturnValue({ ...mockTooltipContextData, open: true });

const useMoreThenDesktopViewport = jest.spyOn(mediaQueryUtils, 'useMoreThenDesktopViewport').mockReturnValue(true);

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TooltipContent />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchFiltersStore: { isMapModalDisplayed: false },
            layoutStore: {
                isTooltipIconDisabled: false,
            },
        });
        mockProps = {
            children: <div data-tid='children' />,
        };
    });

    describe('Desktop', () => {
        it('should NOT be rendered when isDisplayed is false', () => {
            useTooltipContext.mockReturnValueOnce(mockTooltipContextData);

            const { container } = render(<TooltipContent {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should render content', () => {
            render(<TooltipContent {...mockProps} />);

            expect(screen.getByTestId('floating-portal')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip-desktop-content-wrapper')).toHaveClass('desktopWrapper');
            expect(screen.getByTestId('children')).toBeInTheDocument();
            expect(screen.getByTestId('floating-arrow')).toBeInTheDocument();
        });

        it('should render floating-desktop-content-wrapper with inPopupWrapper class when isMapModalDisplayed is true', () => {
            mockStores.searchFiltersStore.isMapModalDisplayed = true;

            render(<TooltipContent {...mockProps} />);

            expect(screen.getByTestId('tooltip-desktop-content-wrapper')).toHaveClass('desktopWrapper inPopupWrapper');
        });
    });

    describe('Mobile', () => {
        it('should NOT be rendered when isDisplayed is false', () => {
            useMoreThenDesktopViewport.mockReturnValueOnce(false);
            useTooltipContext.mockReturnValueOnce(mockTooltipContextData);

            const { container } = render(<TooltipContent {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should render content', () => {
            useMoreThenDesktopViewport.mockReturnValueOnce(false);
            useTooltipContext.mockReturnValueOnce({ ...mockTooltipContextData, open: true });

            render(<TooltipContent {...mockProps} />);

            expect(screen.queryByTestId('tooltip-desktop-content-wrapper')).not.toBeInTheDocument();
            expect(screen.queryByTestId('floating-arrow')).not.toBeInTheDocument();

            expect(screen.getByTestId('floating-portal')).toBeInTheDocument();
            expect(screen.getByTestId('mobile-content')).toBeInTheDocument();
            expect(screen.getByTestId('children')).toBeInTheDocument();

            const { getFloatingProps, isAnimationLaunched, refs, setIsAnimationLaunched, setOpen } =
                mockTooltipContextData;
            expect(mockMobileContentComponent).toHaveBeenCalledWith({
                getFloatingProps,
                isAnimationLaunched,
                refs,
                setIsAnimationLaunched,
                setOpen,
            });
        });

        it('should pass isPrimaryCloseButton to MobileContent when prop is set', () => {
            useMoreThenDesktopViewport.mockReturnValueOnce(false);
            useTooltipContext.mockReturnValueOnce({ ...mockTooltipContextData, open: true });

            render(<TooltipContent {...mockProps} isPrimaryCloseButton />);

            expect(mockMobileContentComponent).toHaveBeenCalledWith(
                expect.objectContaining({ isPrimaryCloseButton: true }),
            );
        });

        it('should not pass isPrimaryCloseButton to MobileContent when prop is not set', () => {
            useMoreThenDesktopViewport.mockReturnValueOnce(false);
            useTooltipContext.mockReturnValueOnce({ ...mockTooltipContextData, open: true });

            render(<TooltipContent {...mockProps} />);

            expect(mockMobileContentComponent).toHaveBeenCalledWith(
                expect.not.objectContaining({ isPrimaryCloseButton: true }),
            );
        });
    });

    describe('DefaultContent', () => {
        it('should render default content when children are undefined', () => {
            render(<TooltipContent {...{ name: 'name', text: 'text', icon: 'icon' }} />);

            expect(screen.getByTestId('floating-portal')).toBeInTheDocument();

            expect(screen.getByTestId('tooltip-desktop-content-wrapper')).toBeInTheDocument();

            expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
            expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
            expect(screen.getByTestId('floating-arrow')).toBeInTheDocument();

            expect(screen.queryByTestId('children')).not.toBeInTheDocument();
        });

        it('should NOT render icon when isTooltipIconDisabled is true', () => {
            mockStores.layoutStore.isTooltipIconDisabled = true;

            render(<TooltipContent {...{ name: 'name', text: 'text', icon: 'icon' }} />);

            expect(screen.getByTestId('floating-portal')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip-desktop-content-wrapper')).toBeInTheDocument();

            expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
            expect(screen.getByTestId('floating-arrow')).toBeInTheDocument();

            expect(screen.queryByTestId('jss-image-next')).not.toBeInTheDocument();
            expect(screen.queryByTestId('children')).not.toBeInTheDocument();
        });
    });
});
