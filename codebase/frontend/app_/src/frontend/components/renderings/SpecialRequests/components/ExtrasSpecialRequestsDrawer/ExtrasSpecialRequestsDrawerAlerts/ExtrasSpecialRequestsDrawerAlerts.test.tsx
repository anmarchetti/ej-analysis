import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ExtrasSpecialRequestsDrawerAlerts from './ExtrasSpecialRequestsDrawerAlerts';

describe('<ExpandTextDropdown />', () => {
    const alerts = [
        {
            message: 'Title',
            description: 'Description',
        },
    ];

    it('Should render passed props', () => {
        const view = render(<ExtrasSpecialRequestsDrawerAlerts alerts={alerts} />);

        expect(view.getByText(alerts[0].message)).toBeTruthy();
        expect(view.getByText(alerts[0].description)).toBeTruthy();
    });

    it('Should expand by click', async () => {
        const view = render(<ExtrasSpecialRequestsDrawerAlerts alerts={alerts} />);

        expect(view.container.querySelector('.opened')).toBeFalsy();

        const element = view.container.querySelector('.content');

        if (element) {
            await userEvent.click(element);
        }

        expect(view.container.querySelector('.opened')).toBeTruthy();
    });
});
