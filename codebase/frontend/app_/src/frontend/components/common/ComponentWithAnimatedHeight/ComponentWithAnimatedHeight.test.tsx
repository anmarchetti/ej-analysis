import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import ComponentWithAnimatedHeight from './ComponentWithAnimatedHeight';

expect.extend(toHaveNoViolations);

let mockClientHeight = 30;
Object.defineProperties(HTMLElement.prototype, {
    clientHeight: { get: () => mockClientHeight },
});

describe('ComponentWithAnimatedHeight', () => {
    it('should pass accessibility', async () => {
        const { container } = render(<ComponentWithAnimatedHeight />);

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('should calculate height', () => {
        const { rerender } = render(<ComponentWithAnimatedHeight>{<div>123</div>}</ComponentWithAnimatedHeight>);

        expect(screen.getByTestId('animated-height-wrapper').getAttribute('style')).toBe(
            'height: 30px; overflow: hidden; transition: height 0.3s linear 0s;',
        );

        mockClientHeight = 40;
        rerender(<ComponentWithAnimatedHeight>{<div>456</div>}</ComponentWithAnimatedHeight>);

        expect(screen.getByTestId('animated-height-wrapper').getAttribute('style')).toBe(
            'height: 40px; overflow: hidden; transition: height 0.3s linear 0s;',
        );
    });
});
