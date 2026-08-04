import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as utils from 'frontend/utils/webStorage.utils';

import PriceToggle from './PriceToggle';

const createProps = () => ({
    fields: {
        Title: { value: 'title' },
        LabelOn: { value: 'on' },
        LabelOff: { value: 'off' },
        Icon: { value: { src: 'image' } },
    },
    params: {
        IsCollapsed: '1',
        IsPricesHidden: '1',
    },
});

const createStores = () => ({
    layoutStore: {
        isPricesHidden: false,
        setPriceToggleActive: jest.fn(),
        onChangePriceToggle: jest.fn(),
        isPriceToggleCollapsed: false,
        setPriceToggleCollapsed: jest.fn(),
        onChangePriceToggleCollapsed: jest.fn(),
        isPriceToggleHidden: false,
    },
    appStore: {},
});

let mockProps;
let mockStores = createStores();
const mockGetWebStorageItem = jest.spyOn(utils, 'getWebStorageItem');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PriceToggle />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockGetWebStorageItem.mockReturnValue(undefined);
    });

    it('should NOT render when fields are NOT provided', () => {
        mockProps.fields = null;

        const { container } = render(<PriceToggle {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isPriceToggleHidden is true', () => {
        mockStores.layoutStore.isPriceToggleHidden = true;

        const { container } = render(<PriceToggle {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should prefill price toggle active and collapsed from params when storage is empty', () => {
        render(<PriceToggle {...mockProps} />);

        expect(mockStores.layoutStore.setPriceToggleActive).toHaveBeenCalledWith(true);
        expect(mockStores.layoutStore.setPriceToggleCollapsed).toHaveBeenCalledWith(true);
    });

    it('should prefill price toggle active and collapsed from storage when it has correct items', () => {
        mockGetWebStorageItem.mockReturnValue({
            isPricesHidden: false,
            isCollapsed: false,
        });

        render(<PriceToggle {...mockProps} />);

        expect(mockStores.layoutStore.setPriceToggleActive).toHaveBeenCalledWith(false);
        expect(mockStores.layoutStore.setPriceToggleCollapsed).toHaveBeenCalledWith(false);
    });

    it('should render with label on message', () => {
        render(<PriceToggle {...mockProps} />);

        expect(screen.getByTestId('price-toggle')).toHaveClass('priceToggle');
        expect(screen.getByRole('heading')).toHaveTextContent('title');
        expect(screen.getByRole('img')).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
        expect(screen.getByText('on')).toBeInTheDocument();
    });

    it('should render with label off message and without title', () => {
        mockStores.layoutStore.isPricesHidden = true;
        mockStores.layoutStore.isPriceToggleCollapsed = true;
        mockProps.fields.Title = null;

        render(<PriceToggle {...mockProps} />);

        expect(screen.getByTestId('price-toggle')).toHaveClass('priceToggle collapsed');
        expect(screen.getByText('off')).toBeInTheDocument();
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should call functions on click', async () => {
        render(<PriceToggle {...mockProps} />);

        const arrow = screen.getByTestId('price-toggle-control');
        const checkbox = screen.getByRole('checkbox');

        await userEvent.click(arrow);
        expect(mockStores.layoutStore.onChangePriceToggleCollapsed).toHaveBeenCalled();

        await userEvent.click(checkbox);
        expect(mockStores.layoutStore.onChangePriceToggle).toHaveBeenCalled();
    });
});
