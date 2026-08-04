import React from 'react';
import { render } from '@testing-library/react';

import { OfferSectionTypes } from 'frontend/store/holidays/guestDetails/GuestDetailsStore';

import SpecialOffers from './SpecialOffers';

const createProps = () => ({
    title: { value: 'title' },
    desc1: { value: 'desc1' },
    desc2: { value: 'desc2' },
    isOptedIn: false,
    field: OfferSectionTypes.IsOffersOptedIn,
    error: { title: 'error', description: 'description' },
    dataTid: 'test',
    changeOffersAndUpdates: jest.fn(),
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    routerStore: {},
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/RadioButton', () => () => <div data-tid='radio-button' />);

jest.mock('frontend/components/common/ErrorMessage', () => () => <div data-tid='error-message' />);

describe('<SpecialOffers />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render special offer', () => {
        const { getByTestId } = render(<SpecialOffers {...mockProps} />);

        expect(getByTestId('test')).toBeInTheDocument();
    });

    it('should render title', () => {
        const { getByText } = render(<SpecialOffers {...mockProps} />);

        expect(getByText('title')).toBeInTheDocument();
    });

    it('should render desc1', () => {
        const { getByText } = render(<SpecialOffers {...mockProps} />);

        expect(getByText('desc1')).toBeInTheDocument();
    });

    it('should render 2 RadioButtons', () => {
        const { getAllByTestId } = render(<SpecialOffers {...mockProps} />);

        expect(getAllByTestId('radio-button').length).toBe(2);
    });

    it('should render desc2', () => {
        const { getByText } = render(<SpecialOffers {...mockProps} />);

        expect(getByText('desc2')).toBeInTheDocument();
    });

    it('should NOT render desc2 when desc2 is NOT provided', () => {
        mockProps.desc2 = null;
        const { queryByText } = render(<SpecialOffers {...mockProps} />);

        expect(queryByText('desc2')).not.toBeInTheDocument();
    });

    it('should render error message', () => {
        const { getByTestId } = render(<SpecialOffers {...mockProps} />);

        expect(getByTestId('error-message')).toBeInTheDocument();
    });

    it('should NOT render error message when no error', () => {
        mockProps.error = null;
        const { queryByTestId } = render(<SpecialOffers {...mockProps} />);

        expect(queryByTestId('error-message')).not.toBeInTheDocument();
    });
});
