import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockLivePrice } from 'frontend/__mocks__';
import { ISSRPageHeroBannerProps } from 'models/data/IHeroBanner';
import { ILivePrice } from 'models/data/ILivePrice';

import DestinationHead from './DestinationHead';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('next/head', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='head'>{children}</div>,
}));

const createStores = () =>
    createMockStores({
        layoutStore: {
            getSetting: (key: string) => {
                const settings = {
                    countryTitle: 'countryTitle {livePrice}',
                    countryDescription: 'countryDescription {livePrice}',
                };

                return settings[key];
            },
        },
        metadataStore: {
            metaPageTitle: 'Holidays {livePrice}',
            metaPropertiesFromSettings: {
                title: 'countryTitle',
                description: 'countryDescription',
            },
            metaPageDescription: 'Holidays description {livePrice}',
            replaceDescription: jest.fn(p => p),
            replaceName: jest.fn(p => p),
            replaceLivePrice: jest.fn((text, price: ILivePrice) => `${text} ${price.pricePP} ${price.currency}`),
        },
    });

const createProps = (): ISSRPageHeroBannerProps => ({
    cheapestLivePriceForDestinationPage: mockLivePrice,
});

let mockProps;
let mockStores;

describe('DestinationHead', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should set title and description when no metaPropertiesFromSettings', () => {
        mockStores.metadataStore.metaPropertiesFromSettings = undefined;

        const { container } = render(<DestinationHead {...mockProps} />);

        expect(screen.getByTestId('head')).toHaveTextContent('Holidays {livePrice} 500 GBP');
        expect(mockStores.metadataStore.replaceLivePrice).toHaveBeenCalledWith('Holidays {livePrice}', mockLivePrice);
        const metaTitle = container.querySelector("meta[property='og:title']");
        expect(metaTitle?.getAttribute('content')).toBe('Holidays {livePrice} 500 GBP');

        expect(mockStores.metadataStore.replaceLivePrice).toHaveBeenCalledWith(
            'Holidays description {livePrice}',
            mockLivePrice,
        );
        const metaDescription = container.querySelector("meta[name='description']");
        expect(metaDescription?.getAttribute('content')).toBe('Holidays description {livePrice} 500 GBP');
        const metaDescription2 = container.querySelector("meta[property='og:description']");
        expect(metaDescription2?.getAttribute('content')).toBe('Holidays description {livePrice} 500 GBP');
    });

    it('should set title and description from metaPropertiesFromSettings', () => {
        mockStores.metadataStore.metaPageTitle = undefined;
        mockStores.metadataStore.metaPageDescription = undefined;
        const { container } = render(<DestinationHead {...mockProps} />);

        expect(screen.getByTestId('head')).toHaveTextContent('countryTitle {livePrice} 500 GBP');
        expect(mockStores.metadataStore.replaceLivePrice).toHaveBeenCalledWith(
            'countryTitle {livePrice}',
            mockLivePrice,
        );
        const metaTitle = container.querySelector("meta[property='og:title']");
        expect(metaTitle?.getAttribute('content')).toBe('countryTitle {livePrice} 500 GBP');

        expect(mockStores.metadataStore.replaceLivePrice).toHaveBeenCalledWith(
            'countryDescription {livePrice}',
            mockLivePrice,
        );
        const metaDescription = container.querySelector("meta[name='description']");
        expect(metaDescription?.getAttribute('content')).toBe('countryDescription {livePrice} 500 GBP');
        const metaDescription2 = container.querySelector("meta[property='og:description']");
        expect(metaDescription2?.getAttribute('content')).toBe('countryDescription {livePrice} 500 GBP');
    });

    it('should render empty title when no title available', () => {
        mockStores.metadataStore.metaPageTitle = undefined;
        mockStores.metadataStore.metaPropertiesFromSettings = undefined;

        const { container } = render(<DestinationHead {...mockProps} />);

        expect(screen.getByTestId('head')).toHaveTextContent('');
        const metaTitle = container.querySelector("meta[property='og:title']");
        expect(metaTitle?.getAttribute('content')).toBe('');
    });

    it('should not empty description when no description available', () => {
        mockStores.metadataStore.metaPageDescription = undefined;
        mockStores.metadataStore.metaPropertiesFromSettings = undefined;

        const { container } = render(<DestinationHead {...mockProps} />);

        const metaDescription = container.querySelector("meta[name='description']");
        expect(metaDescription?.getAttribute('content')).toBe('');
        const metaDescription2 = container.querySelector("meta[property='og:description']");
        expect(metaDescription2?.getAttribute('content')).toBe('');
    });
});
