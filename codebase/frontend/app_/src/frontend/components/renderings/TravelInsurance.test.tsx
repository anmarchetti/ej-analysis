import React from 'react';
import { render } from '@testing-library/react';

import TravelInsurance from './TravelInsurance';

const createProps = () => ({
    isBookingCanceled: false,
    isTitleOutside: false,
    id: 'id',
    fields: {
        Image: { value: { src: 'icon' } },
        Title: { value: 'title' },
        Description: { value: 'description' },
        Text: { value: 'text' },
        Link: { value: { url: 'url', text: 'link', linkType: 'external' } },
    },
});

const createStores = () => ({
    layoutStore: {},
    appStore: { isScreenLessMedium: false },
    routerStore: {},
    queryParamStore: {},
    userStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TravelInsurance />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no fields', () => {
        mockProps.fields = null;
        const { container } = render(<TravelInsurance {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if no Link', () => {
        mockProps.fields.Link = null;
        const { container } = render(<TravelInsurance {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if no url in Link', () => {
        mockProps.fields.Link.value.url = null;
        const { container } = render(<TravelInsurance {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render title', () => {
        mockProps.fields.Title = null;
        const { queryByRole } = render(<TravelInsurance {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render title outside', () => {
        mockProps.isTitleOutside = true;
        const { container, getByRole } = render(<TravelInsurance {...mockProps} />);

        const upperContainer = container.getElementsByClassName('booking-insurance')[0];
        const lowerContainer = container.getElementsByClassName('booking-insurance__header')[0];
        const titile = getByRole('heading');
        expect(upperContainer).toContainElement(titile);
        expect(lowerContainer).not.toContainElement(titile);
    });

    it('should render title inside', () => {
        const { container, getByRole } = render(<TravelInsurance {...mockProps} />);

        const lowerContainer = container.getElementsByClassName('booking-insurance__header')[0];
        const titile = getByRole('heading');
        expect(lowerContainer).toContainElement(titile);
    });

    it('should NOT render image, description, text without fields', () => {
        mockProps.fields.Image = null;
        mockProps.fields.Description = null;
        mockProps.fields.Text = null;
        const { queryByText, queryByRole } = render(<TravelInsurance {...mockProps} />);

        expect(queryByRole('img')).not.toBeInTheDocument();
        expect(queryByText('description')).not.toBeInTheDocument();
        expect(queryByText('text')).not.toBeInTheDocument();
    });

    it('should NOT render image, description, text without values', () => {
        mockProps.fields.Image.value = null;
        mockProps.fields.Description.value = null;
        mockProps.fields.Text.value = null;
        const { queryByText, queryByRole } = render(<TravelInsurance {...mockProps} />);

        expect(queryByRole('img')).not.toBeInTheDocument();
        expect(queryByText('description')).not.toBeInTheDocument();
        expect(queryByText('text')).not.toBeInTheDocument();
    });

    it('should NOT render link', () => {
        mockProps.isBookingCanceled = true;
        const { queryByText } = render(<TravelInsurance {...mockProps} />);

        expect(queryByText('link')).not.toBeInTheDocument();
    });

    it('should render all elements', () => {
        const { getByText, getByRole } = render(<TravelInsurance {...mockProps} />);

        expect(getByRole('img')).toBeInTheDocument();
        expect(getByRole('heading')).toHaveTextContent('title');
        expect(getByText('description')).toBeInTheDocument();
        expect(getByText('text')).toBeInTheDocument();
        expect(getByRole('link')).toHaveTextContent('link');
    });
});
