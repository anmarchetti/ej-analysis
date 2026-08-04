import React from 'react';
import { render, screen } from '@testing-library/react';

import * as isBackend from 'frontend/utils/isBackend';
import * as workerUtils from 'frontend/utils/worker.utils';

import SubscribeToPushButton from './SubscribeToPushButton';

const mockIsBackend = isBackend as { default: () => boolean };

jest.mock('frontend/utils/isBackend', () => ({
    __esModule: true,
    default: () => false,
}));

jest.mock('frontend/utils/worker.utils', () => ({
    isNotificationsSupported: jest.fn().mockReturnValue(true),
}));

const createStores = () => ({
    notificationsStore: {
        initSubscribeFlow: jest.fn(() => Promise.resolve()),
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SubscribeToPushButton />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('Should render component', () => {
        render(<SubscribeToPushButton />);

        expect(screen.getByTestId('subscribe-to-push')).toBeInTheDocument();
    });

    it('Should NOT render component when notifications not supported', () => {
        (
            workerUtils.isNotificationsSupported as jest.MockedFn<typeof workerUtils.isNotificationsSupported>
        ).mockReturnValueOnce(false);

        render(<SubscribeToPushButton />);

        expect(screen.queryByTestId('subscribe-to-push')).not.toBeInTheDocument();
    });

    it('Should NOT render component when backend side', () => {
        mockIsBackend.default = () => true;
        render(<SubscribeToPushButton />);

        expect(screen.queryByTestId('subscribe-to-push')).not.toBeInTheDocument();
    });
});
