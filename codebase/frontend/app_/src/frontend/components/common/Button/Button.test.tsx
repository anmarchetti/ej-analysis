import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import Button from './Button';

describe('<Button />', () => {
    const resetMocks = () => ({
        onClick: jest.fn(),
        disabled: false,
        removeDefaultClass: false,
        isLarge: false,
        isFullWidth: false,
        isTransparent: false,
        isWide: false,
        isMedium: false,
        isOutlined: false,
        isText: false,
        isMd: false,
        isLink: false,
        isLabel: false,
        isDisabled: false,
        isLoading: false,
        isPlaceholderShimmer: false,
        isCapitalize: false,
        className: '',
        onKeyUp: jest.fn(),
    });

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('Button should called func from props', () => {
        it('Should called func from props', () => {
            render(<Button {...mocks} />);

            fireEvent.click(screen.getByRole('button'));

            expect(mocks.onClick).toHaveBeenCalled();
        });

        it('Should not called func from props', () => {
            mocks.disabled = true;
            render(<Button {...mocks} />);

            fireEvent.click(screen.getByRole('button'));

            expect(mocks.onClick).not.toHaveBeenCalled();
        });

        it('should call onKeyUp', () => {
            render(<Button {...mocks} />);

            fireEvent.keyUp(screen.getByRole('button'), { key: 'Tab', code: 'Tab' });

            expect(mocks.onKeyUp).toHaveBeenCalled();
        });
    });

    describe('Button should render className', () => {
        it('Should render className isCapitalize', () => {
            mocks.isCapitalize = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn capitalize');
        });

        it('Should render className btn--large', () => {
            mocks.isLarge = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--large');
        });

        it('Should render className btn--full-width', () => {
            mocks.isFullWidth = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--full-width');
        });

        it('Should render className btn--transparent', () => {
            mocks.isTransparent = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--transparent');
        });

        it('Should render className btn--reversed', () => {
            mocks.isReversed = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--reversed');
        });

        it('Should render className btn--wide', () => {
            mocks.isWide = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--wide');
        });

        it('Should render className btn--medium', () => {
            mocks.isMedium = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--medium');
        });

        it('Should render className btn--outlined', () => {
            mocks.isOutlined = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--outlined');
        });

        it('Should render className btn--md', () => {
            mocks = resetMocks();
            mocks.isMd = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--md');
        });

        it('Should render className btn--txt', () => {
            mocks.isText = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--txt');
        });

        it('Should render className btn--label', () => {
            mocks.isLabel = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--label');
        });

        it('Should render className btn--link', () => {
            mocks.isLink = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn-link');
        });

        it('Should render className btn--disabled', () => {
            mocks.hasDisabledStyles = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--disabled');
        });

        it('Should render className btn--loading', () => {
            mocks.isLoading = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--loading');
        });

        it('Should render className placeholder-shimmer', () => {
            mocks.isPlaceholderShimmer = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn placeholder-shimmer');
        });

        it('Should render className btn--disabled', () => {
            mocks.removeDefaultClass = true;
            mocks.className = 'className';
            render(<Button {...mocks} />);

            const button = screen.getByRole('button');

            expect(button).toHaveClass('className');
            expect(button).not.toHaveClass('btn');
        });

        it('Should render className btn--black', () => {
            mocks.isBlackColor = true;
            render(<Button {...mocks} />);

            expect(screen.getByRole('button')).toHaveClass('btn btn--black');
        });
    });
});
