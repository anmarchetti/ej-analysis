import React from 'react';
import { render } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceTokens } from 'frontend/__mocks__/utils/tokenizer';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ITouristTaxPriceLabel, TouristTaxPriceLabel } from './TouristTaxPriceLabel';

let mockStores;
let mockProps: ITouristTaxPriceLabel;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/touristTax.utils', () => ({
    ...jest.requireActual('frontend/utils/touristTax.utils'),
    getTouristTaxPrice: jest.fn().mockImplementation(value => value),
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceTokens: mockReplaceTokens,
    },
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

describe('<TouristTaxPriceLabel />', () => {
    beforeEach(() => {
        mockStores = createMockStores({ layoutStore: { isTouristTaxEnabled: true } });
        mockProps = {
            price: 110,
            pricePP: 55,
            touristTax: 10,
            touristTaxPP: 5,
            isPricePP: false,
        };
    });

    it('should render correct label when touristTax is provided and isOffersPriceViewTotal is true', () => {
        render(<TouristTaxPriceLabel {...mockProps} />);

        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(SitecoreDictionary.TouristTaxLabelsAddLocalTax, {
            [Tokens.TouristTax]: '£10',
            [Tokens.Price]: '£110',
        });
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            tag: 'span',
            className: 'label',
            field: { value: `${SitecoreDictionary.TouristTaxLabelsAddLocalTax} £10,£110` },
        });
    });

    it('should render correct label when isPricePP is true', () => {
        mockProps.isPricePP = true;
        render(<TouristTaxPriceLabel {...mockProps} />);

        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(SitecoreDictionary.TouristTaxLabelsAddLocalTaxPerPerson, {
            [Tokens.TouristTax]: '£5',
            [Tokens.Price]: '£55',
        });
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: { value: `${SitecoreDictionary.TouristTaxLabelsAddLocalTaxPerPerson} £5,£55` },
            }),
        );
    });

    it('should render not applicable label when touristTax is 0', () => {
        mockProps.touristTax = 0;
        render(<TouristTaxPriceLabel {...mockProps} />);

        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: { value: SitecoreDictionary.TouristTaxLabelsTaxNotApplicable },
            }),
        );
    });

    it('should return null when isTouristTaxEnabled is disabled', () => {
        mockStores.layoutStore.isTouristTaxEnabled = false;

        const { container } = render(<TouristTaxPriceLabel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should return null when touristTax is -1 and isPricePP is false', () => {
        mockProps.touristTax = -1;
        mockProps.isPricePP = false;

        const { container } = render(<TouristTaxPriceLabel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should return null when touristTaxPP is -1 and isPricePP is true', () => {
        mockProps.touristTaxPP = -1;
        mockProps.isPricePP = true;

        const { container } = render(<TouristTaxPriceLabel {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
