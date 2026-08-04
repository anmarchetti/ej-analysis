import React from 'react';
import { render } from '@testing-library/react';

import PersistentInfoBanner from './PersistentInfoBanner';

const createProps = () => ({
    fields: { Title: { value: 'title' }, Description: { value: 'description' }, Icon: { value: { src: 'icon' } } },
    props: { wasMaintenancePopupShown: false },
});

const createStores = () => ({
    appStore: { wasMaintenancePopupShown: false },
    layoutStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PersistentInfoBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if Title NOT provided', () => {
        mockProps.fields.Title = null;
        const { container } = render(<PersistentInfoBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render sticky box', () => {
        const { getByTestId } = render(<PersistentInfoBanner {...mockProps} />);

        expect(getByTestId('sticky-box')).toBeInTheDocument();
    });

    it('should render d-none class when Maintenance Popup was NOT Shown', () => {
        const { container } = render(<PersistentInfoBanner {...mockProps} />);

        expect(container.getElementsByClassName('d-none').length).toBe(1);
    });

    it('should NOT render d-none class when popup was shown', () => {
        mockStores.appStore.wasMaintenancePopupShown = true;
        const { container } = render(<PersistentInfoBanner {...mockProps} />);

        expect(container.getElementsByClassName('d-none').length).toBe(0);
    });

    it('should render icon', () => {
        const { getByRole } = render(<PersistentInfoBanner {...mockProps} />);

        expect(getByRole('img')).toBeInTheDocument();
    });

    it('should render Title', () => {
        const { getByText } = render(<PersistentInfoBanner {...mockProps} />);

        expect(getByText('title')).toBeInTheDocument();
    });

    it('should render Description', () => {
        const { getByText } = render(<PersistentInfoBanner {...mockProps} />);

        expect(getByText('description')).toBeInTheDocument();
    });
});
