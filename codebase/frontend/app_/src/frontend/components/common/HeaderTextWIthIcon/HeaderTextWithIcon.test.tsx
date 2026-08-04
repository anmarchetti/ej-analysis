import React from 'react';
import { render, screen } from '@testing-library/react';

import SvgTikTok from 'frontend/components/icons-new/TikTok';

import HeaderTextWithIcon, { IHeaderTextWithIconProps } from './HeaderTextWithIcon';

const createProps = (): IHeaderTextWithIconProps => ({
    title: 'Test Title',
    Icon: SvgTikTok,
});

describe('<HeaderTextWithIcon />', () => {
    let mockProps: IHeaderTextWithIconProps;

    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render correctly', () => {
        render(<HeaderTextWithIcon {...mockProps} />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Title');
        expect(screen.getByTestId('tik-tok-icon')).toHaveClass('titleIcon');
    });

    it('should apply custom titleClassName to the title', () => {
        mockProps.titleClassName = 'customClass';
        render(<HeaderTextWithIcon {...mockProps} />);
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading.className).toContain('title');
        expect(heading.className).toContain('customClass');
    });

    it('should not apply extra class when titleClassName is not provided', () => {
        render(<HeaderTextWithIcon {...mockProps} />);
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading.className).toContain('title');
        expect(heading.className).not.toContain('undefined');
    });
});
