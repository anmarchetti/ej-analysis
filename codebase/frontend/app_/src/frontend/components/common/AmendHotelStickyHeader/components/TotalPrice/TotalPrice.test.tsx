import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockAmendHotelOffer } from 'frontend/__mocks__';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import TotalPrice from './TotalPrice';

let mockStores;

const mockCallout = jest.fn();
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: props => {
        mockCallout(props);

        return <div data-tid='callout-component'>{props.content}</div>;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TotalPrice />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendHotelStore: {
                newlySelectedHotelOffer: mockAmendHotelOffer,
            },
        });
    });

    it('should render PriceTotal component with callout when amendHotelFeePP exists', () => {
        render(<TotalPrice dataTid='total-price' tooltipLabel='{price} tooltip label' />);

        expect(screen.getByTestId('total-price-label')).toHaveTextContent('PriceSummary.Labels.Total');
        expect(screen.getByTestId('total-price-value')).toHaveTextContent('£57.89');

        expect(screen.getByTestId('callout-component')).toHaveTextContent(
            `${SitecoreDictionary.GlobalsPriceLabelsPerPerson} tooltip label`,
        );
        expect(mockCallout).toHaveBeenCalledWith({
            content: expect.anything(),
            orientation: CalloutOrientation.Bottom,
            position: CalloutPosition.Right,
            isShownOnHover: true,
            children: expect.anything(),
        });
    });

    it('should NOT render callout when amendHotelFeePP=0', () => {
        mockStores.amendHotelStore.feePP = 0;

        render(<TotalPrice dataTid='total-price' tooltipLabel='{price} tooltip label' />);

        expect(screen.queryByTestId('callout-component')).not.toBeInTheDocument();
        expect(mockCallout).not.toHaveBeenCalled();
    });
});
