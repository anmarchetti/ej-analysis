import React from 'react';
import { render, screen } from '@testing-library/react';

import PillContent from './PillContent';

describe('<PillContent />', () => {
    let mockProps;

    beforeEach(() => {
        mockProps = {
            contentClass: 'contentClass',
            iconClass: 'iconClass',
            titleClass: 'titleClass',
            title: 'title',
            icon: <i>icon</i>,
            dotted: false,
        };
    });

    it('should render correctly', () => {
        render(<PillContent {...mockProps} />);

        expect(screen.getByTestId('pill-icon')).toBeInTheDocument();
        expect(screen.getByTestId('pill-title')).toBeInTheDocument();
    });

    it('should render correctly when icon is undefined', () => {
        mockProps.icon = undefined;
        mockProps.dotted = true;

        render(<PillContent {...mockProps} />);

        expect(screen.queryByTestId('pill-icon')).not.toBeInTheDocument();
        expect(screen.getByTestId('pill-title')).toBeInTheDocument();
    });
});
