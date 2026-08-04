import React from 'react';
import { render } from '@testing-library/react';

import LateCheckoutPostBookBanner from './LateCheckoutPostBookBanner';

const createProps = () => ({
    fields: {
        PopUpDescription: { value: 'popup desc' },
        PopUpTitle: { value: 'popup title' },
        PopUpIcon: { value: { src: 'popup icon' } },
        Description: { value: 'desc' },
        Icon: { value: { src: 'icon' } },
        Title: { value: 'title' },
        CTA: { value: 'cta' },
    },
    params: {},
    rendering: {},
});

const createStores = () => ({
    layoutStore: { isConfirmationPage: false, isLateCheckoutEnabledBySitecore: true, getPhrase: jest.fn() },
    appStore: {},
    routerStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./components/LateCheckoutPopup', () => () => <div data-tid='popup' />);

describe('<LateCheckoutPostBookBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no fields', () => {
        mockProps.fields = null;
        const { container } = render(<LateCheckoutPostBookBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if late checkout disabled', () => {
        mockStores.layoutStore.isLateCheckoutEnabledBySitecore = false;
        const { container } = render(<LateCheckoutPostBookBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render icon, title, desription, CTA, popup', () => {
        const { getByText, getByTestId, getByRole } = render(<LateCheckoutPostBookBanner {...mockProps} />);

        expect(getByRole('img'));
        expect(getByRole('button', { name: 'cta' }));
        expect(getByRole('heading', { name: 'title' }));
        expect(getByText('desc')).toBeInTheDocument();
        expect(getByTestId('popup')).toBeInTheDocument();
    });

    it('should NOT render icon, title, desription, CTA', () => {
        mockProps.fields.Icon = null;
        mockProps.fields.Title = null;
        mockProps.fields.Description = null;
        mockProps.fields.CTA = null;
        const { queryByText, queryByRole } = render(<LateCheckoutPostBookBanner {...mockProps} />);

        expect(queryByRole('img')).not.toBeInTheDocument();
        expect(queryByRole('button', { name: 'cta' })).not.toBeInTheDocument();
        expect(queryByRole('heading', { name: 'title' })).not.toBeInTheDocument();
        expect(queryByText('desc')).not.toBeInTheDocument();
    });

    it('should NOT render CTA if isConfiramtionPage', () => {
        mockStores.layoutStore.isConfirmationPage = true;
        const { queryByRole } = render(<LateCheckoutPostBookBanner {...mockProps} />);

        expect(queryByRole('button', { name: 'cta' })).not.toBeInTheDocument();
    });
});
