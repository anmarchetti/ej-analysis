import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import { HolidayTheme } from './HolidayTheme';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    JSSImage: () => <div data-tid='jss-image' />,
}));

jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    Callout: ({ content }) => <div data-tid='tooltip'>{content}</div>,
}));

const resetMocks = () => ({
    holidayTheme: {
        code: '',
        name: '',
        packageIcons: [],
    },
    holidayType: {
        code: '',
        name: '',
        description: '',
        icon: '',
    },
    withIcon: false,
});

let mocks;

describe('<HolidayTheme />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    it('should render', () => {
        render(<HolidayTheme {...mocks} />);

        expect(screen.queryByTestId('holiday-type')).toBeInTheDocument();
    });

    it('should not render icon if we dont pass withIcon prop', () => {
        render(<HolidayTheme {...mocks} />);
        expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
    });

    it('should  render icon if we  pass withIcon prop', () => {
        mocks.holidayType.icon = 'iconUrl';
        mocks.withIcon = true;

        render(<HolidayTheme {...mocks} />);
        expect(screen.queryByTestId('jss-image')).toBeInTheDocument();
    });
});
