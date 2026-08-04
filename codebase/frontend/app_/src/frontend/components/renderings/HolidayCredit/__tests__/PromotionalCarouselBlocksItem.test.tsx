import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PromotionalCarouselBlocksItem from 'frontend/components/renderings/HolidayCredit/components/PromotionalCarouselBlocksItem';

const createProps = () => ({
    item: {
        id: '2e3dacc4-7af5-4d3e-9fbe-e29dc7d50ac1',
        name: 'Slide 1',
        displayName: 'Slide 1',
        livePrice: {
            pricePP: 15,
        },
        fields: {
            Description: { value: '' },
            Image: {
                value: {
                    alt: '',
                    height: '833',
                    src: '/holidays/cms/media/-/jssmedia/tunisia.ashx?h=833&w=1251&hash=7ACE45DA6570911C79B7270546380FBC',
                    width: '1251',
                },
            },
            Link: {
                value: {
                    anchor: '',
                    class: '',
                    href: '/destinations/united-kingdom/england',
                    id: '{B29E9681-A2E3-420E-AEE0-3AE0AF667F16}',
                    linktype: 'internal',
                    querystring: '',
                    target: '',
                    text: '',
                    title: '',
                },
            },
            LivePriceDestination: [
                {
                    id: 'b29e9681-a2e3-420e-aee0-3ae0af667f16',
                    url: '/destinations/united-kingdom/england',
                },
            ],
            Title: { value: 'Madeira' },
        },
    },
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    queryParamStore: {},
    userStore: {},
    appStore: {},
    marketStore: { formatMoney: jest.fn(a => `£${a}`) },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PromotionalCarouselBlocksItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render link if has link', () => {
        const { getByRole } = render(<PromotionalCarouselBlocksItem {...mockProps} />);

        expect(getByRole('link')).toBeInTheDocument();
    });

    it('Should render price if has price', () => {
        const { getByText, container } = render(<PromotionalCarouselBlocksItem {...mockProps} />);

        expect(getByText(SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom)).toBeInTheDocument();
        expect(getByText('£15')).toBeInTheDocument();
        expect(container.getElementsByClassName('icon-arrow').length).toBe(1);
    });

    it('Should render arrow without price if NO price', () => {
        mockProps.item.livePrice.pricePP = undefined;
        const { queryByText, container } = render(<PromotionalCarouselBlocksItem {...mockProps} />);

        expect(queryByText(SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom)).not.toBeInTheDocument();
        expect(container.getElementsByClassName('icon-arrow').length).toBe(1);
    });

    it('Should render title', () => {
        const { getByText } = render(<PromotionalCarouselBlocksItem {...mockProps} />);

        expect(getByText('Madeira')).toBeInTheDocument();
    });
});
