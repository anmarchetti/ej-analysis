import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BasketFourthCell } from './BasketFourthCell';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BasketFirstCell />', () => {
    const onOpenPopup = jest.fn();
    const resetMocks = () => ({
        className: 'forth',
        onOpenPopup,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({
            layoutStore: { isATOLProtectionEnabled: true },
        });
    });

    it('should render', () => {
        const { container, queryByText, queryByTestId } = render(<BasketFourthCell {...mocks} />);

        expect(container.querySelector('.forth-cell')).toBeInTheDocument();
        expect(queryByText(SitecoreDictionary.HotelDetailsLabelsAtolProtected)).toBeInTheDocument();
        expect(queryByTestId('show-more-details')).toBeInTheDocument();
    });

    it('should call setIsOpenDetailsPopup after click on show more details button', () => {
        const { getByTestId } = render(<BasketFourthCell {...mocks} />);

        const showMoreButton = getByTestId('show-more-details');
        fireEvent.click(showMoreButton);

        expect(onOpenPopup).toBeCalled();
    });

    it('should not show ATOL protection label when ATOL is disabled on sitecore', () => {
        mockStores.layoutStore.isATOLProtectionEnabled = false;
        const { queryByText } = render(<BasketFourthCell {...mocks} />);

        expect(queryByText(SitecoreDictionary.HotelDetailsLabelsAtolProtected)).not.toBeInTheDocument();
    });
});
