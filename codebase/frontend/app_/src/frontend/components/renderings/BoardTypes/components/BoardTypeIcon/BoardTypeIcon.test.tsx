import React from 'react';
import { render } from '@testing-library/react';

import BoardTypeIcon from './BoardTypeIcon';

describe('<BoardTypeIcon />', () => {
    it('Should rended icon with background image', () => {
        const { container } = render(<BoardTypeIcon iconUrl='iconUrl' />);

        const icon = container.querySelector('.icon--bg-image');
        expect(icon).toHaveStyle('background-image: url(iconUrl);');
    });

    it('Should rended fallback svg icon', () => {
        const { container } = render(<BoardTypeIcon />);

        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(container.querySelector('.icon--bg-image')).not.toBeInTheDocument();
    });
});
