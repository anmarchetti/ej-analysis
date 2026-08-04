import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Notifications } from './Notifications';

jest.mock('frontend/components/icons-new/Cross', () => () => <div data-tid='cross-icon' />);

const createStores = () => ({
    appStore: {
        notification: { icon: 'src', body: <div className='body' data-tid='test-body' />, title: 'title' },
        setNotification: jest.fn(),
    },
});

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<Notifications />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should standard render', () => {
        render(<Notifications />);

        expect(screen.getByTestId('app-notification-image')).toHaveAttribute('style', 'background-image: url(src);');
        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByTestId('cross-icon')).toBeInTheDocument();
        expect(screen.getByTestId('test-body')).toBeInTheDocument();
        expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should NOT render component when notification is NOT provided', () => {
        mockStores.appStore.notification = undefined;

        const { container } = render(<Notifications />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render icon when notification.icon no defined', () => {
        mockStores.appStore.notification.icon = undefined;

        render(<Notifications />);

        expect(screen.queryByTestId('app-notification-image')).not.toBeInTheDocument();
    });

    it('should NOT render body when notification.body no defined', () => {
        mockStores.appStore.notification.body = undefined;

        render(<Notifications />);

        expect(screen.queryByTestId('test-body')).not.toBeInTheDocument();
    });

    it('should call setNotification on button click', async () => {
        render(<Notifications />);

        await userEvent.click(screen.getByRole('button'));

        expect(mockStores.appStore.setNotification).toHaveBeenCalledWith(undefined);
    });
});
