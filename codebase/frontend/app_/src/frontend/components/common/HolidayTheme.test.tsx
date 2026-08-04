import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import { HolidayTheme } from './HolidayTheme';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./Callout/Callout', () => ({
    __esModule: true,
    default: () => <div data-tid='callout-component' />,
}));

jest.mock('./JSSImage', () => ({
    __esModule: true,
    JSSImage: () => <div data-tid='jssimage' />,
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
let mockStores;

describe('<HolidayTheme />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    it('Should NOT render when no holidayType prop', () => {
        mocks.holidayType = undefined as any;
        const { container } = render(<HolidayTheme {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should standard render', () => {
        mocks.holidayType.description = 'desc';
        const { container } = render(<HolidayTheme {...mocks} />);

        expect(container.querySelector('.list-item--icon')).toBeInTheDocument();
        expect(screen.getByTestId('callout-component')).toBeInTheDocument();
    });

    it('Should NOT render Callout when no holidayType.description prop', () => {
        render(<HolidayTheme {...mocks} />);

        expect(screen.queryByTestId('callout-component')).not.toBeInTheDocument();
    });

    it('Should NOT render icon when no withIcon prop', () => {
        render(<HolidayTheme {...mocks} />);

        expect(screen.queryByTestId('jssimage')).not.toBeInTheDocument();
    });

    it('Should render icon when withIcon declined', () => {
        mocks.holidayType.icon = 'iconUrl';
        mocks.withIcon = true;
        render(<HolidayTheme {...mocks} />);

        expect(screen.getByTestId('jssimage')).toBeInTheDocument();
    });
});
