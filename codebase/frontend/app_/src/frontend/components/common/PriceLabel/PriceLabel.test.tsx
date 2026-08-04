import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as utils from 'frontend/utils/livePrice.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IPriceLabelProps, PriceLabel } from './PriceLabel';

const createProps = (): IPriceLabelProps => ({
    price: '100',
    dataTid: 'price-label',
    onClick: jest.fn(),
});

const mockDictionaries = {
    [SitecoreDictionary.GlobalsPriceLabelsFrom]: 'from {price}',
    [SitecoreDictionary.GlobalsPriceLabelsPerPerson]: '{price} pp',
    [SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom]: 'from {price} pp',
};

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => mockDictionaries[p]) },
});

let mockProps;
let mockStores;
const mockGetLivePriceNumberOfNightsLabel = jest.spyOn(utils, 'getLivePriceNumberOfNightsLabel');

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PriceLabel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render price only', () => {
        render(<PriceLabel {...mockProps} />);

        expect(screen.getByText('100')).toBeInTheDocument();
        expect(mockGetLivePriceNumberOfNightsLabel).toHaveBeenCalledWith(expect.any(Function), undefined, '');
    });

    it('should render price with label before', () => {
        mockProps.priceDictionary = SitecoreDictionary.GlobalsPriceLabelsFrom;
        render(<PriceLabel {...mockProps} />);

        const priceLabelElement = screen.getByTestId('price-label');

        expect(priceLabelElement.children[0]).toHaveAttribute('data-tid', 'price-label-before');
        expect(screen.getByTestId('price-label-before')).toHaveTextContent('from');
        expect(priceLabelElement.children[1].textContent).toBe(mockProps.price);
    });

    it('should render price with label before with number of nights', () => {
        mockProps.numberOfNights = 7;
        mockProps.priceDictionary = SitecoreDictionary.GlobalsPriceLabelsFrom;
        render(<PriceLabel {...mockProps} />);

        expect(mockGetLivePriceNumberOfNightsLabel).toHaveBeenCalledWith(expect.any(Function), 7, 'from ');
    });

    it('should render price with label after', () => {
        mockProps.priceDictionary = SitecoreDictionary.GlobalsPriceLabelsPerPerson;
        render(<PriceLabel {...mockProps} />);

        const priceLabelElement = screen.getByTestId('price-label');

        expect(priceLabelElement.children[0].textContent).toBe(mockProps.price);
        expect(priceLabelElement.children[1].textContent).toBe(' pp');
    });

    it('should render price with label before and after', () => {
        mockProps.priceDictionary = SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom;

        render(<PriceLabel {...mockProps} />);

        const priceLabelElement = screen.getByTestId('price-label');

        expect(priceLabelElement.children[0].textContent).toBe('from ');
        expect(priceLabelElement.children[1].textContent).toBe(mockProps.price);
        expect(priceLabelElement.children[2].textContent).toBe(' pp');
    });

    it('should render price with label before and after with custom wrapper', () => {
        mockProps.priceDictionary = SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom;
        mockProps.wrapLabelBeforePrice = label => <span data-tid='before-price'>{label}</span>;
        mockProps.wrapLabelAfterPrice = label => <span data-tid='after-price'>{label}</span>;

        render(<PriceLabel {...mockProps} />);

        expect(screen.getByTestId('before-price')).toHaveTextContent('from');
        expect(screen.getByTestId('after-price')).toHaveTextContent('pp');
    });

    it('should render with custom tag', () => {
        mockProps.tag = 'p';
        const { container } = render(<PriceLabel {...mockProps} />);

        expect(container.firstChild).toBeInstanceOf(HTMLParagraphElement);
    });

    it('should render with data-tid', () => {
        mockProps.dataTid = 'price-label';
        render(<PriceLabel {...mockProps} />);

        expect(screen.getByTestId('price-label')).toBeInTheDocument();
        expect(screen.getByTestId('price-label')).toBeInstanceOf(HTMLSpanElement);
    });

    it('should render with custom class', () => {
        mockProps.className = 'price-class';
        const { container } = render(<PriceLabel {...mockProps} />);

        expect(container.firstChild).toHaveClass('price-class');
        expect(container.firstChild).toBeInstanceOf(HTMLSpanElement);
    });

    it('should render with tooltip', () => {
        mockProps.tooltip = <span>tooltip</span>;
        render(<PriceLabel {...mockProps} />);

        expect(screen.getByText('tooltip')).toBeInTheDocument();
    });

    it('should render with chevron icon', () => {
        mockProps.chevronIcon = <span data-tid='chevron' />;
        render(<PriceLabel {...mockProps} />);

        expect(screen.getByTestId('chevron')).toBeInTheDocument();
    });

    it('should wrap price block when wrapPrice is set', () => {
        mockProps.priceDictionary = SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom;
        mockProps.wrapPrice = el => <div data-tid='wrap-price'>{el}</div>;
        mockProps.wrapLabelBeforePrice = label => <span data-tid='before-price'>{label}</span>;
        mockProps.wrapLabelAfterPrice = label => <span data-tid='after-price'>{label}</span>;

        render(<PriceLabel {...mockProps} />);

        expect(screen.getByTestId('wrap-price')).toBeInTheDocument();
        expect(screen.getByTestId('before-price')).toBeInTheDocument();

        expect(within(screen.getByTestId('wrap-price')).queryByTestId('before-price')).not.toBeInTheDocument();
        expect(within(screen.getByTestId('wrap-price')).getByText('100')).toBeInTheDocument();
        expect(within(screen.getByTestId('wrap-price')).getByTestId('after-price')).toBeInTheDocument();
    });

    it('should call onClick when user clicks on component', async () => {
        mockProps.dataTid = 'test-data';
        render(<PriceLabel {...mockProps} />);

        const label = screen.getByTestId('test-data');
        await userEvent.click(label);
        expect(mockProps.onClick).toHaveBeenCalled();
    });
});
