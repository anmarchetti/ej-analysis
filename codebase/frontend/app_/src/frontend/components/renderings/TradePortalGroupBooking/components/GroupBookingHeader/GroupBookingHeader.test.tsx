import React from 'react';
import { render } from '@testing-library/react';

import { mockFields } from 'frontend/components/renderings/TradePortalGroupBooking/__mocks__/tradePortalGroupBookingFields';

import GroupBookingHeader from './GroupBookingHeader';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    __esModule: true,
    Image: () => <div>Image</div>,
    Placeholder: () => <div>Placeholder</div>,
}));

const createProps = () => ({
    fields: mockFields,
    rendering: {},
});

const createStores = () => ({
    appStore: { isScreenLessMedium: false },
    layoutStore: { isEditMode: false },
});

let mockStores;
let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<GroupBookingHeader />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
        props = createProps();
    });

    it('Should render standard', () => {
        const { getByText, queryByText, container } = render(<GroupBookingHeader {...props} />);

        expect(queryByText('Image')).not.toBeInTheDocument();
        expect(getByText('Placeholder')).toBeInTheDocument();
        expect(getByText(props.fields.Title.value)).toBeInTheDocument();
        expect(container.querySelector('.page-hero-banner__triangle.triangle-start')).toBeInTheDocument();
    });

    it('Should NOT render Name value when Title value is not defined', () => {
        delete props.fields.Title;

        const { getByText } = render(<GroupBookingHeader {...props} />);

        expect(getByText(props.fields.Name.value)).toBeInTheDocument();
    });

    it('Should render image when isEditMode is true', async () => {
        mockStores.layoutStore.isEditMode = true;

        const { getByText } = render(<GroupBookingHeader {...props} />);

        expect(getByText('Image')).toBeInTheDocument();
    });
});
