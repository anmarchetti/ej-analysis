import React from 'react';
import { render, screen } from '@testing-library/react';

import LayoutNotAvailable, { ILayoutNotAvailableProps } from './LayoutNotAvailable';

const resetMocks = (): ILayoutNotAvailableProps => ({
    isEditMode: false,
    isLayoutError: true,
    resetLayoutError: jest.fn(),
    redirectToHomePage: jest.fn(),
    getPhrase: jest.fn((p: string) => p),
});

const createStores = () => ({
    layoutStore: {
        isEditMode: false,
        isLayoutError: true,
        resetLayoutError: jest.fn(),
        getPhrase: jest.fn((key: string) => key),
    },
    routerStore: {
        redirectToHomePage: jest.fn(),
    },
});

let mocks: ReturnType<typeof resetMocks>;
let mockStores: ReturnType<typeof createStores>;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => (
        <button {...props} data-tid='button'>
            {children}
        </button>
    ),
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

describe('<LayoutNotAvailable />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('Should NOT render component when isEditMode set', () => {
        mockStores.layoutStore.isEditMode = true;

        const { container } = render(<LayoutNotAvailable {...mocks} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render component when isLayoutError is false', () => {
        mockStores.layoutStore.isLayoutError = false;

        const { container } = render(<LayoutNotAvailable {...mocks} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should render component', () => {
        render(<LayoutNotAvailable {...mocks} />);

        const layoutComponent = screen.getByTestId('layout-not-available-popup');
        expect(layoutComponent).toBeInTheDocument();

        const additionalText = screen.getByTestId('additional-text');
        expect(additionalText).toBeInTheDocument();

        const button = screen.getByTestId('button');
        expect(button).toBeInTheDocument();
    });
});
