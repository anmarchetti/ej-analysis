import React from 'react';
import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { render, screen } from '@testing-library/react';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';

import { HorizontalComponentWrapper } from './HorizontalComponentWrapper';

const createProps = () => ({
    params: {} as Record<string, TSitecoreCheckboxValue>,
    rendering: {
        componentName: 'HorizontalComponentWrapper',
        placeholders: {
            [PlaceholderNames.ComponentWrapperLeft]: [] as unknown as ComponentRendering[],
            [PlaceholderNames.ComponentWrapperRight]: [] as unknown as ComponentRendering[],
        },
    },
});

let mockProps = createProps();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Placeholder: ({ name, rendering }: { name: string; rendering: any }) => {
        const components = rendering?.placeholders?.[name] || [];

        if (components.length === 0) return null;

        return (
            <div data-testid={name === 'component-wrapper-left' ? 'wrapper-left' : 'wrapper-right'}>
                Mocked {name === 'component-wrapper-left' ? 'Left' : 'Right'} Component
            </div>
        );
    },
}));

describe('<HorizontalComponentWrapper />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should apply grey background class when IsGreyBackground param is passed', () => {
        mockProps.params.IsGreyBackground = '1' as TSitecoreCheckboxValue;

        render(<HorizontalComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-container')).toHaveClass('wrapper-component-container--grey');
    });

    it('should apply full width class when IsFullWidth param is passed', () => {
        mockProps.params.IsFullWidth = '1' as TSitecoreCheckboxValue;

        render(<HorizontalComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-container')).toHaveClass('wrapper-component-container--full-width');
    });

    it('should apply border bottom class when IsBorderBottom param is passed', () => {
        mockProps.params.IsBorderBottom = '1' as TSitecoreCheckboxValue;

        render(<HorizontalComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-container')).toHaveClass('wrapper-component-container--border-bottom');
    });

    it('should apply triangle start class when IsTriangleStart param is passed', () => {
        mockProps.params.IsTriangleStart = '1' as TSitecoreCheckboxValue;

        render(<HorizontalComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-shape')).toHaveClass('wrapper-shape--start');
    });

    it('should apply triangle end class when IsTriangleEnd param is passed', () => {
        mockProps.params.IsTriangleEnd = '1' as TSitecoreCheckboxValue;

        render(<HorizontalComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-shape')).toHaveClass('wrapper-shape--end');
    });

    it('should apply triangle start reverse class when IsTriangleStartReverse param is passed', () => {
        mockProps.params.IsTriangleStartReverse = '1' as TSitecoreCheckboxValue;

        render(<HorizontalComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-shape')).toHaveClass('wrapper-shape--start-reverse');
    });

    it('should apply triangle end reverse class when IsTriangleEndReverse param is passed', () => {
        mockProps.params.IsTriangleEndReverse = '1' as TSitecoreCheckboxValue;

        render(<HorizontalComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-shape')).toHaveClass('wrapper-shape--end-reverse');
    });

    it('should render one children element per placeholder when rendering prop is not provided', () => {
        render(
            <HorizontalComponentWrapper>
                <div data-tid='child'>Child Content</div>
            </HorizontalComponentWrapper>,
        );
        expect(screen.getAllByTestId('child')).toHaveLength(2);
    });

    it('should render only children in left placeholder when prop.rendering provided with placeholder name component-wrapper-left', () => {
        mockProps.rendering.placeholders[PlaceholderNames.ComponentWrapperLeft] = [
            { componentName: 'Left Child Component' },
        ] as unknown as ComponentRendering[];
        mockProps.rendering.placeholders['component-wrapper-right'] = [];

        render(<HorizontalComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-left')).toBeInTheDocument();
        expect(screen.getByTestId('wrapper-right').textContent).toBe('');
    });

    it('should render only children in right placeholder when prop.rendering provided with placeholder name component-wrapper-right', () => {
        mockProps.rendering.placeholders[PlaceholderNames.ComponentWrapperRight] = [
            { componentName: 'Right Child Component' },
        ];
        mockProps.rendering.placeholders[PlaceholderNames.ComponentWrapperRight] = [];

        render(<HorizontalComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-left')).toBeInTheDocument();
        expect(screen.getByTestId('wrapper-right').textContent).toBe('');
    });
});
