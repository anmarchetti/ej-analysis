import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AlertBanner from 'frontend/components/common/AlertBanner/AlertBanner';

describe('<ExpandTextDropdown />', () => {
    const alert = {
        title: 'Title',
        description: 'Description',
    };

    it('Should render passed props', () => {
        const view = render(<AlertBanner {...alert} />);

        expect(view.getByText(alert.title)).toBeTruthy();
        expect(view.getByText(alert.description)).toBeTruthy();
    });

    it('Should be expanded by default without button to expand', async () => {
        const view = render(<AlertBanner {...alert} />);

        expect(view.container.querySelector('.opened')).toBeTruthy();
        expect(view.container.querySelector('button')).toBeFalsy();
    });

    it('Should be collapsed by default and expand by click', async () => {
        const view = render(<AlertBanner {...alert} collapsible />);

        expect(view.container.querySelector('.opened')).toBeFalsy();
        expect(view.container.querySelector('button')).toBeTruthy();

        const element = view.container.querySelector('.content');

        if (element) {
            await userEvent.click(element);
        }

        expect(view.container.querySelector('.opened')).toBeTruthy();
    });
});
