import React from 'react';
import { render } from '@testing-library/react';

import AnimatedWrapper from './AnimatedWrapper';
import * as utils from './AnimatedWrapper.utils';

describe('<AnimatedWrapper />', () => {
    const onAnimationEnd = jest.fn();
    const hookSpy = jest.spyOn(utils, 'default');

    it('should be rendered when render is true', () => {
        hookSpy.mockReturnValue({ render: true, onAnimationEnd });

        const { container } = render(
            <AnimatedWrapper isShown={true}>
                <span>content</span>
            </AnimatedWrapper>,
        );

        expect(container).toBeInTheDocument();
        expect(container.getElementsByClassName('wrapper entrance')[0]).toBeInTheDocument();
        expect(container.getElementsByClassName('content')[0]).toBeInTheDocument();
    });

    it('should be rendered when render is false and keepMounted is true', () => {
        hookSpy.mockReturnValue({ render: true, onAnimationEnd });

        const { container, rerender } = render(
            <AnimatedWrapper isShown={false} keepMounted>
                <span>content</span>
            </AnimatedWrapper>,
        );

        hookSpy.mockReturnValue({ render: false, onAnimationEnd });

        rerender(
            <AnimatedWrapper isShown={false} keepMounted>
                <span>content</span>
            </AnimatedWrapper>,
        );

        expect(container.firstChild).toBeInTheDocument();
    });

    it('should NOT be rendered when render is false', () => {
        hookSpy.mockReturnValue({ render: true, onAnimationEnd });

        const { container, rerender } = render(
            <AnimatedWrapper isShown={false}>
                <span>content</span>
            </AnimatedWrapper>,
        );

        expect(container.getElementsByClassName('wrapper exit')[0]).toBeInTheDocument();
        expect(container.getElementsByClassName('content')[0]).toBeInTheDocument();

        hookSpy.mockReturnValue({ render: false, onAnimationEnd });

        rerender(
            <AnimatedWrapper isShown={false}>
                <span>content</span>
            </AnimatedWrapper>,
        );

        expect(container.firstChild).not.toBeInTheDocument();
    });

    it('should skip animation when disableAnimation is true and isShown is true', () => {
        hookSpy.mockReturnValue({ render: true, onAnimationEnd });

        const { container } = render(
            <AnimatedWrapper isShown={true} disableAnimation={true}>
                <span>content</span>
            </AnimatedWrapper>,
        );

        expect(container.getElementsByClassName('wrapper')).toHaveLength(1);
        expect(container.getElementsByClassName('entrance')).toHaveLength(0);
        expect(container.getElementsByClassName('exit')).toHaveLength(0);
        expect(container.getElementsByClassName('hidden')).toHaveLength(0);
    });

    it('should not render when disableAnimation is true and isShown is false', () => {
        hookSpy.mockReturnValue({ render: false, onAnimationEnd });

        const { container } = render(
            <AnimatedWrapper isShown={false} disableAnimation={true}>
                <span>content</span>
            </AnimatedWrapper>,
        );

        expect(container.querySelector('span')).not.toBeInTheDocument();
        expect(container.getElementsByClassName('entrance')).toHaveLength(0);
        expect(container.getElementsByClassName('exit')).toHaveLength(0);
    });

    it('should apply animation when disableAnimation is false', () => {
        hookSpy.mockReturnValue({ render: true, onAnimationEnd });

        const { container } = render(
            <AnimatedWrapper isShown={true} disableAnimation={false}>
                <span>content</span>
            </AnimatedWrapper>,
        );

        expect(container.getElementsByClassName('wrapper entrance')[0]).toBeInTheDocument();
    });
});
