import { render, screen } from '@testing-library/react';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import HeroSectionWrapper from './HeroSectionWrapper';

const mockPlaceholderComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder' />;
    },
}));

const createProps = () => ({
    rendering: null,
    params: {
        IsSearchPodFloating: '1',
    },
});

let props;

describe('<HeroSectionWrapper />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render component when IsSearchPodFloating is true', () => {
        render(<HeroSectionWrapper {...props} />);

        expect(screen.getByTestId('hero-section-wrapper')).toHaveClass(
            'heroSectionWrapper heroSectionWrapperPositioned',
        );
        expect(screen.getByTestId('floating-searchpod-wrapper')).toHaveClass(
            'floating-searchpod floatingSearchPodWrapper',
        );
        expect(mockPlaceholderComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.HeroSearchpodWrapper,
                rendering: null,
                isFloating: true,
                isParentWrapper: true,
            }),
        );
        expect(mockPlaceholderComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.HeroCarouselWrapper,
                isBannerLower: true,
                rendering: null,
            }),
        );
    });

    it('should render component when IsSearchPodFloating is false', () => {
        props.params.IsSearchPodFloating = undefined;
        render(<HeroSectionWrapper {...props} />);

        expect(screen.getByTestId('hero-section-wrapper')).toHaveClass('heroSectionWrapper');
        expect(screen.getByTestId('hero-section-wrapper')).not.toHaveClass('heroSectionWrapperPositioned');
        expect(screen.getByTestId('floating-searchpod-wrapper')).not.toHaveClass('floating-searchpod');
        expect(screen.getByTestId('floating-searchpod-wrapper')).not.toHaveClass('floatingSearchPodWrapper');
    });
});
