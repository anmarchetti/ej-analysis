import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import MonthViewDisclaimers from './MonthViewDisclaimers';

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid={props['data-tid']} />;
    },
}));

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children, triggerClassName }) => (
        <div data-tid='tourist-tax-tooltip'>
            <span className={triggerClassName}>Tooltip Trigger</span>
            {children}
        </div>
    ),
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockLocalStore;
let mockStores;

const createLocalStore = () => ({
    fields: {
        CheapestMonthDescriptionLabel: mockSitecoreField('CheapestMonthDescriptionLabel'),
    },
});

describe('MonthViewDisclaimers', () => {
    beforeEach(() => {
        mockLocalStore = createLocalStore();
        mockStores = createMockStores({
            layoutStore: {
                isTouristTaxEnabled: false,
            },
        });
    });

    it('should render the cheapest month description with the provided testId', () => {
        render(<MonthViewDisclaimers cheapestMonthTestId='cheapest-month-description' />);

        expect(screen.getByTestId('cheapest-month-description')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: { value: 'CheapestMonthDescriptionLabel' },
            tag: 'p',
            className: 'cheapestMonthDescription',
            'data-tid': 'cheapest-month-description',
        });
    });

    it('should NOT render the tourist tax tooltip when isTouristTaxEnabled is false', () => {
        render(<MonthViewDisclaimers cheapestMonthTestId='cheapest-month-description' />);

        expect(screen.queryByTestId('tourist-tax-tooltip')).not.toBeInTheDocument();
    });

    it('should render the tourist tax tooltip when isTouristTaxEnabled is true', () => {
        mockStores.layoutStore.isTouristTaxEnabled = true;

        render(<MonthViewDisclaimers cheapestMonthTestId='cheapest-month-description' />);

        expect(screen.getByTestId('tourist-tax-tooltip')).toBeInTheDocument();
        expect(mockStores.layoutStore.getPhrase).toHaveBeenCalledWith(
            SitecoreDictionary.TouristTaxLabelsPricesIncludeLocalTax,
        );
    });
});
