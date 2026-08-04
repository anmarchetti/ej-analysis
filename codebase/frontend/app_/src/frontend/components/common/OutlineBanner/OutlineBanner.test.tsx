import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockAncillariesParams } from 'frontend/__mocks__/ancillaries';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { LuxuryTheme } from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';

import OutlineBanner, { IOutlineBannerProps, OutlineBannerContext } from './OutlineBanner';
import { OutlineBannerTheme } from './OutlineBannerTheme';

const createProps = (): IOutlineBannerProps => ({
    color: mockAncillariesParams.Color,
    textContent: mockSitecoreField('text content'),
    children: 'children',
    className: 'className',
});

let mockProps = createProps();
let mockContext = {
    theme: OutlineBannerTheme.NoTheme,
    ...createMockStores(),
};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockContext,
}));

const mockPromotingBanner = jest.fn();
jest.mock('./components/PromotingBanner/PromotingBanner', () => ({
    __esModule: true,
    default: props => {
        mockPromotingBanner(props);

        return <div data-tid='promoting-banner'>{props.children}</div>;
    },
}));

const mockLuxuryWrapper = jest.fn();
jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    ...jest.requireActual('frontend/components/common/LuxuryWrapper/LuxuryWrapper'),
    __esModule: true,
    default: props => {
        mockLuxuryWrapper(props);

        return <div data-tid='luxury-wrapper'>{props.children}</div>;
    },
}));

describe('OutlineBanner', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockContext = {
            theme: OutlineBannerTheme.NoTheme,
            ...createMockStores(),
        };
    });

    it('should render default component', () => {
        const { container } = render(<OutlineBanner {...mockProps} />);

        expect(container.firstChild).toHaveClass('className outlineBanner');
        expect(screen.getByText('children')).toBeInTheDocument();
    });

    it('should render PromotingBanner when theme is PromoTheme', () => {
        mockContext.theme = OutlineBannerTheme.PromoTheme;
        render(<OutlineBanner {...mockProps} />);

        expect(mockPromotingBanner).toHaveBeenCalledWith({
            color: mockProps.color,
            textContent: mockProps.textContent,
            children: mockProps.children,
        });
        expect(mockLuxuryWrapper).not.toHaveBeenCalled();
        expect(screen.queryByTestId('luxury-wrapper')).not.toBeInTheDocument();
    });

    it('should NOT render PromotingBanner banner when color === null', () => {
        mockContext.theme = OutlineBannerTheme.PromoTheme;
        delete mockProps.color;

        render(
            <OutlineBannerContext.Provider value={{ theme: OutlineBannerTheme.PromoTheme }}>
                <OutlineBanner {...mockProps} />
            </OutlineBannerContext.Provider>,
        );

        expect(screen.queryByTestId('promoting-banner')).not.toBeInTheDocument();
    });

    describe('LuxuryWrapper', () => {
        it('should render Luxury Wrapper when theme is LuxuryTheme', () => {
            mockContext.theme = OutlineBannerTheme.LuxuryTheme;

            render(<OutlineBanner {...mockProps} />);

            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(mockLuxuryWrapper).toHaveBeenCalledWith({
                label: SitecoreDictionary.LuggageLabelsIncluded,
                children: mockProps.children,
            });

            expect(mockPromotingBanner).not.toHaveBeenCalled();
        });

        it('should render Luxury Wrapper when theme is LuxuryLightTheme', () => {
            mockContext.theme = OutlineBannerTheme.LuxuryLightTheme;

            render(<OutlineBanner {...mockProps} />);

            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(mockLuxuryWrapper).toHaveBeenCalledWith({
                label: SitecoreDictionary.LuggageLabelsIncluded,
                theme: LuxuryTheme.Light,
                children: mockProps.children,
            });

            expect(mockPromotingBanner).not.toHaveBeenCalled();
        });

        it('should render Luxury Wrapper when theme is LuxuryDarkOrangeTheme', () => {
            mockContext.theme = OutlineBannerTheme.LuxuryDarkOrangeTheme;

            render(<OutlineBanner {...mockProps} />);

            expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
            expect(mockLuxuryWrapper).toHaveBeenCalledWith({
                label: SitecoreDictionary.LuggageLabelsIncluded,
                theme: LuxuryTheme.DarkOrange,
                children: mockProps.children,
            });

            expect(mockPromotingBanner).not.toHaveBeenCalled();
        });
    });

    describe('Post Booking Pages', () => {
        it('should not apply outline banner styles when isPostBookingPages is true', () => {
            mockContext.layoutStore.isPostBookingPages = true;
            render(<OutlineBanner {...mockProps} />);

            const outlineBanner = screen.getByText('children');
            expect(outlineBanner).not.toHaveClass('outlineBanner');
        });

        it('should apply outline banner styles when isPostBookingPages is false', () => {
            mockContext.layoutStore.isPostBookingPages = false;

            render(<OutlineBanner {...mockProps} />);

            const outlineBanner = screen.getByText('children');
            expect(outlineBanner).toHaveClass('outlineBanner');
        });
    });
});
