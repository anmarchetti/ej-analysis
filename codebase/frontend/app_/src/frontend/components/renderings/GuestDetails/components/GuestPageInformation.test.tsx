import React from 'react';
import { render } from '@testing-library/react';

import GuestPageInformation from './GuestPageInformation';

import styles from './GuestPageInformation.module.scss';

const createProps = () => ({
    fields: { GuestInformationTitle: { value: 'title' }, GuestInformationDescription: { value: 'description' } },
    isTradePortal: false,
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<GuestPageInformation />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render if fields are NOT provided', () => {
        mockProps.fields = null;
        const { container } = render(<GuestPageInformation {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render page-info__container--trade-portal if is NOT trade portal', () => {
        const { container } = render(<GuestPageInformation {...mockProps} />);

        expect(container.getElementsByClassName('page-info__container--trade-portal').length).toBe(0);
    });

    it('should render page-info__container--trade-portal if is trade portal', () => {
        mockProps.isTradePortal = true;
        const { container } = render(<GuestPageInformation {...mockProps} />);

        expect(container.getElementsByClassName(`${styles.wrapper} ${styles.trade}`).length).toBe(1);
    });

    it('should render title', () => {
        const { getByRole } = render(<GuestPageInformation {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('title');
    });

    it('should NOT render title when title is NOT provided', () => {
        mockProps.fields.GuestInformationTitle = null;
        const { queryByRole } = render(<GuestPageInformation {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render description', () => {
        const { getByText } = render(<GuestPageInformation {...mockProps} />);

        expect(getByText('description')).toBeInTheDocument();
    });

    it('should NOT render description when description is NOT provided', () => {
        mockProps.fields.GuestInformationDescription = null;
        const { queryByText } = render(<GuestPageInformation {...mockProps} />);

        expect(queryByText('description')).not.toBeInTheDocument();
    });
});
