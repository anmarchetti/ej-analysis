import React from 'react';
import { fireEvent, screen } from '@testing-library/dom';
import { render } from '@testing-library/react';

import RoundButton from './RoundButton';

describe('<RoundButton />', () => {
    const NUMBER_VALUE = 2;

    const resetMocks = () =>
        ({
            onClick: jest.fn(),
            content: NUMBER_VALUE,
            withoutBg: true,
        } as any);

    let props = resetMocks();

    beforeEach(() => {
        props = resetMocks();
    });

    describe('Button', () => {
        it('should apply btn-round and no-bg classes when withoutBg is true', () => {
            props.withoutBg = true;

            render(<RoundButton {...props} />);

            const buttonElement = screen.getByRole('button');
            expect(buttonElement).toHaveClass('btn-round');
            expect(buttonElement).toHaveClass('no-bg');
        });

        it('should apply btn-round class and not no-bg class when withoutBg is false', () => {
            props.withoutBg = false;

            render(<RoundButton {...props} />);

            const buttonElement = screen.getByRole('button');
            expect(buttonElement).toHaveClass('btn-round');
            expect(buttonElement).not.toHaveClass('no-bg');
        });

        it('should display the correct content (number)', () => {
            props.content = NUMBER_VALUE;

            render(<RoundButton {...props} />);

            const buttonElement = screen.getByRole('button', { name: NUMBER_VALUE.toString() });
            expect(buttonElement).toBeInTheDocument();
        });

        it('should display the correct content (string)', () => {
            const stringContent = 'Click Me';
            props.content = stringContent;

            render(<RoundButton {...props} />);

            const buttonElement = screen.getByRole('button', { name: stringContent });
            expect(buttonElement).toBeInTheDocument();
        });

        describe('Button interaction', () => {
            it('should be enabled by default', () => {
                render(<RoundButton {...props} />);

                const buttonElement = screen.getByRole('button');
                expect(buttonElement).toBeEnabled();
                expect(buttonElement).not.toHaveClass('disabled');
            });

            it('should be disabled and have "disabled" class when disabled prop is true', () => {
                props.disabled = true;

                render(<RoundButton {...props} />);

                const buttonElement = screen.getByRole('button');
                expect(buttonElement).toBeDisabled();
                expect(buttonElement).toHaveClass('disabled');
            });

            it('should call the onClick handler when clicked', async () => {
                render(<RoundButton {...props} />);

                const buttonElement = screen.getByRole('button');
                fireEvent.click(buttonElement);

                expect(props.onClick).toHaveBeenCalledTimes(1);
            });

            it('should not call onClick handler when clicked if disabled', async () => {
                props.disabled = true;

                render(<RoundButton {...props} />);

                const buttonElement = screen.getByRole('button');
                expect(buttonElement).toBeDisabled();

                fireEvent.click(buttonElement);

                expect(props.onClick).not.toHaveBeenCalled();
            });
        });
    });
});
