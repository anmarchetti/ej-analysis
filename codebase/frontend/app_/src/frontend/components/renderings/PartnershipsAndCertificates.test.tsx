import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';

import PartnershipsAndCertificates from './PartnershipsAndCertificates';

const createProps = () => ({
    fields: {
        Items: [
            {
                fields: {
                    Description: { value: 'description1' },
                    Icon: { value: { src: 'src1' } },
                    TextableIcon: mockSitecoreField(mockSitecoreImageField('TextableIcon')),
                },
            },
            { fields: { Description: { value: 'description2' }, Icon: { value: { src: 'src2' } } } },
        ],
        Title: { value: 'title' },
    },
});

const createStores = () => ({
    layoutStore: {},
    appStore: {},
    routerStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSIMageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSIMageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

describe('<PartnershipsAndCertificates />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render JSS image when "TextableIcon" field exists', () => {
        render(<PartnershipsAndCertificates {...mockProps} />);

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSIMageNextProps).toHaveBeenCalledWith({
            field: mockProps.fields.Items[0].fields.TextableIcon,
            mediaSize: MediaSize.Small,
        });
    });

    it('Should NOT render JSS image when "TextableIcon" field not exists', () => {
        mockProps.fields.Items[0].fields.TextableIcon = undefined;
        render(<PartnershipsAndCertificates {...mockProps} />);

        expect(screen.queryByTestId('jss-image-next')).not.toBeInTheDocument();
    });

    it('should NOT render title', () => {
        mockProps.fields.Title.value = null;
        const { queryByText } = render(<PartnershipsAndCertificates {...mockProps} />);

        expect(queryByText('title')).not.toBeInTheDocument();
    });

    it('should render title', () => {
        const { getByText } = render(<PartnershipsAndCertificates {...mockProps} />);

        expect(getByText('title')).toBeInTheDocument();
    });

    it('should NOT render block items', () => {
        mockProps.fields.Items = null;
        const { queryByText, queryByRole } = render(<PartnershipsAndCertificates {...mockProps} />);

        expect(queryByText('description1')).not.toBeInTheDocument();
        expect(queryByText('description2')).not.toBeInTheDocument();
        expect(queryByRole('img')).not.toBeInTheDocument();
    });

    it('should render 2 block items', () => {
        const { getByText, getAllByRole } = render(<PartnershipsAndCertificates {...mockProps} />);

        expect(getByText('description1')).toBeInTheDocument();
        expect(getByText('description2')).toBeInTheDocument();
        expect(getAllByRole('img').length).toBe(2);
    });

    it('should NOT render any icons', () => {
        mockProps.fields.Items[0].fields.Icon = null;
        mockProps.fields.Items[1].fields.Icon = null;
        const { queryByRole } = render(<PartnershipsAndCertificates {...mockProps} />);

        expect(queryByRole('img')).not.toBeInTheDocument();
    });

    it('should NOT render description1', () => {
        mockProps.fields.Items[0].fields.Description = null;
        const { queryByText } = render(<PartnershipsAndCertificates {...mockProps} />);

        expect(queryByText('description1')).not.toBeInTheDocument();
    });
});
