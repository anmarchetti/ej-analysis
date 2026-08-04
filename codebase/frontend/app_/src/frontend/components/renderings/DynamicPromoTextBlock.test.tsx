import React from 'react';
import { render } from '@testing-library/react';

import DynamicPromoTextBlock from './DynamicPromoTextBlock';

const createProps = () => ({
    fields: {
        Name: { value: 'name {holidayTheme} {destinationName}' },
        PageDescription: { value: 'description {holidayType} {holidayTheme} {destinationType} {destinationName}' },
        HotelTheme: { id: 'theme', fields: { DestinationGuideTitle: { value: 'DestinationGuideTitle1' } } },
        HotelThemeType: [{ id: 'type', fields: { DestinationGuideTitle: { value: 'DestinationGuideTitle2' } } }],
    },
    props: { destination: { name: 'destination name', type: 'destination type' } },
});

const createStores = () => ({
    promoPageStore: { pageDestination: { name: 'destination name', type: 'destination type' } },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<DynamicPromoTextBlock />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render when fields are NOT provided', () => {
        mockProps.fields = null;
        const { container } = render(<DynamicPromoTextBlock {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render description', () => {
        const { getByText } = render(<DynamicPromoTextBlock {...mockProps} />);

        expect(
            getByText('description destinationguidetitle2 destinationguidetitle1 destination type destination name'),
        ).toBeInTheDocument();
    });

    it('should render description without destination type and name when destination NOT provided', () => {
        mockProps.props.destination = null;
        mockStores.promoPageStore.pageDestination = null as any;
        const { getByText } = render(<DynamicPromoTextBlock {...mockProps} />);

        expect(getByText('description destinationguidetitle2 destinationguidetitle1')).toBeInTheDocument();
    });

    describe('Title', () => {
        it('should render heading with typeTitle', () => {
            const { getByRole } = render(<DynamicPromoTextBlock {...mockProps} />);

            expect(getByRole('heading')).toHaveTextContent('name DestinationGuideTitle2 destination name');
        });

        it('should render heading with themeTitle when typeTitle is NOT provided', () => {
            mockProps.fields.HotelThemeType = [];
            const { getByRole } = render(<DynamicPromoTextBlock {...mockProps} />);

            expect(getByRole('heading')).toHaveTextContent('name DestinationGuideTitle1 destination name');
        });
    });
});
