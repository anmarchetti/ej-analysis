import React from 'react';
import { render } from '@testing-library/react';

import PopUnderOfferOptions from './PopUnderOfferOptions';

const createProps = () => ({
    items: [
        { fields: { Icon: { value: { src: 'icon1' } }, Title: { value: 'title1' } }, id: '1' },
        { fields: { Icon: { value: { src: 'icon2' } }, Title: { value: 'title2' } }, id: '2' },
        { fields: { Icon: { value: { src: 'icon3' } }, Title: { value: 'title3' } }, id: '3' },
        { fields: { Icon: { value: { src: 'icon4' } }, Title: { value: 'title4' } }, id: '4' },
        { fields: { Icon: { value: { src: 'icon5' } }, Title: { value: 'title5' } }, id: '5' },
        { fields: { Icon: { value: { src: 'icon6' } }, Title: { value: 'title6' } }, id: '6' },
    ],
    className: 'test-class-name',
});

const createStores = () => ({
    layoutStore: { isEditMode: false },
    appStore: { isScreenLessMedium: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PopUnderOfferOptions />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render container with prop classname', () => {
        const { container } = render(<PopUnderOfferOptions {...mockProps} />);

        expect(container.getElementsByClassName('test-class-name').length).toBe(1);
    });

    it('should render 2 rows and separator when more than 3 items provided', () => {
        const { getAllByTestId, getByTestId } = render(<PopUnderOfferOptions {...mockProps} />);

        expect(getAllByTestId('popunder-options-row').length).toBe(2);
        expect(getByTestId('popunder-options-separator')).toBeInTheDocument();
    });

    it('should render 6 offers', () => {
        const { getAllByTestId } = render(<PopUnderOfferOptions {...mockProps} />);

        expect(getAllByTestId('popunder-option').length).toBe(6);
    });

    it('should NOT render separator when only 3 offers provided', () => {
        mockProps.items = [
            { fields: { Icon: { value: { src: 'icon1' } }, Title: { value: 'title1' } }, id: '1' },
            { fields: { Icon: { value: { src: 'icon2' } }, Title: { value: 'title2' } }, id: '2' },
            { fields: { Icon: { value: { src: 'icon3' } }, Title: { value: 'title3' } }, id: '3' },
        ];
        const { queryByTestId } = render(<PopUnderOfferOptions {...mockProps} />);

        expect(queryByTestId('popunder-options-separator')).not.toBeInTheDocument();
    });

    describe('Single offer', () => {
        beforeEach(() => {
            mockProps.items = [{ fields: { Icon: { value: { src: 'icon1' } }, Title: { value: 'title1' } }, id: '1' }];
        });

        it('should render icon when icon is provided', () => {
            const { getByRole } = render(<PopUnderOfferOptions {...mockProps} />);

            expect(getByRole('img')).toBeInTheDocument();
        });

        it('should NOT render icon when icon is NOT provided', () => {
            mockProps.items[0].fields.Icon.value = null;
            const { queryByRole } = render(<PopUnderOfferOptions {...mockProps} />);

            expect(queryByRole('img')).not.toBeInTheDocument();
        });

        it('should render title when title is provided', () => {
            const { getByText } = render(<PopUnderOfferOptions {...mockProps} />);

            expect(getByText('title1')).toBeInTheDocument();
        });

        it('should NOT render title when title is NOT provided', () => {
            mockProps.items[0].fields.Title.value = null;
            const { queryByText } = render(<PopUnderOfferOptions {...mockProps} />);

            expect(queryByText('title1')).not.toBeInTheDocument();
        });
    });
});
