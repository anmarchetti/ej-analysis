import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import AmendErrataMessages from './AmendErrataMessages';

const createStores = () => ({
    appStore: {
        isScreenLessMedium: false,
    },
    layoutStore: {
        getPhrase: v => v,
    },
});

const createProps = () => ({
    errataInfo: ['errataInfo-1', 'errataInfo-2'],
    expandId: 'expandId',
});

const props = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => createStores(),
}));

describe('<AmendErrataMessages />', () => {
    it('Should render messages', () => {
        const view = render(<AmendErrataMessages {...props} />);

        expect(view.findByText('errataInfo-1')).toBeTruthy();
        expect(view.findByText('errataInfo-2')).toBeTruthy();
        expect(view.findByText('BookingPayment.Labels.ReadBefore')).toBeTruthy();
        expect(view.getByTestId('amend-promo')).toBeTruthy();
        expect(view.getByTestId('amend-errata-message-read-more-label')).toBeTruthy();
    });

    it('Should fire click event', () => {
        const view = render(<AmendErrataMessages {...props} />);
        const btn = view.getByTestId('amend-promo');

        expect(view.container.querySelector('[aria-expanded="true"]')).toBeTruthy();

        fireEvent.click(btn);
        expect(view.container.querySelector('[aria-expanded="false"]')).toBeTruthy();
    });
});
