import React from 'react';
import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { render, screen } from '@testing-library/react';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';

import { ComponentWrapper } from './ComponentWrapper';

const createProps = () => ({
    params: {} as Record<string, TSitecoreCheckboxValue>,
    rendering: {
        componentName: 'ComponentWrapper',
        placeholders: {
            [PlaceholderNames.ComponentWrapperInner]: [] as unknown as ComponentRendering[],
        },
    },
});

let mockProps = createProps();

describe('<ComponentWrapper />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should apply grey background class when IsGreyBackground param is passed', () => {
        mockProps.params.IsGreyBackground = '1' as TSitecoreCheckboxValue;

        render(<ComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-container')).toHaveClass('wrapper-component-container--grey');
    });

    it('should apply full width class when IsFullWidth param is passed', () => {
        mockProps.params.IsFullWidth = '1' as TSitecoreCheckboxValue;

        render(<ComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-container')).toHaveClass('wrapper-component-container--full-width');
    });

    it('should apply border bottom class when IsBorderBottom param is passed', () => {
        mockProps.params.IsBorderBottom = '1' as TSitecoreCheckboxValue;

        render(<ComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-container')).toHaveClass('wrapper-component-container--border-bottom');
    });

    it('should apply triangle start class when IsTriangleStart param is passed', () => {
        mockProps.params.IsTriangleStart = '1' as TSitecoreCheckboxValue;

        render(<ComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-shape')).toHaveClass('wrapper-shape--start');
    });

    it('should apply triangle end class when IsTriangleEnd param is passed', () => {
        mockProps.params.IsTriangleEnd = '1' as TSitecoreCheckboxValue;

        render(<ComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-shape')).toHaveClass('wrapper-shape--end');
    });

    it('should apply triangle start reverse class when IsTriangleStartReverse param is passed', () => {
        mockProps.params.IsTriangleStartReverse = '1' as TSitecoreCheckboxValue;

        render(<ComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-shape')).toHaveClass('wrapper-shape--start-reverse');
    });

    it('should apply triangle end reverse class when IsTriangleEndReverse param is passed', () => {
        mockProps.params.IsTriangleEndReverse = '1' as TSitecoreCheckboxValue;

        render(<ComponentWrapper {...mockProps} />);
        expect(screen.getByTestId('wrapper-shape')).toHaveClass('wrapper-shape--end-reverse');
    });

    it('should render children when rendering prop is not provided', () => {
        render(
            <ComponentWrapper>
                <div data-tid='child'>Child Content</div>
            </ComponentWrapper>,
        );

        expect(screen.getByTestId('child')).toBeInTheDocument();
    });
});
