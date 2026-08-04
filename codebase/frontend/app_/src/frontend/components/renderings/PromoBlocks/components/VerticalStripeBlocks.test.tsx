import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';

import VerticalStripeBlocks from './VerticalStripeBlocks';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);
global.scrollTo = jest.fn();

const mockJSSImageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSImageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

const createProps = () => ({
    items: [
        {
            fields: {
                Title: mockSitecoreField('Title'),
                Description: mockSitecoreField('Description'),
                Image: mockSitecoreImageField('Image'),
                Link: { value: { href: '' } },
                ModalContent: {
                    fields: {
                        ModalTitle: { value: 'title' },
                        Description: { value: 'description' },
                        ButtonText: { value: 'description' },
                    },
                },
            },
            id: '1',
        },
        {
            id: '2',
            fields: {
                Title: mockSitecoreField('Title 2'),
            },
        },
        {
            fields: {
                Title: mockSitecoreField('Title 3'),
            },
            id: '3',
        },
    ],
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});
let mockStores = createStores();
let mockProps = createProps() as any;

describe('<VerticalStripeBlocks />', () => {
    beforeEach(() => {
        mockProps = createProps() as any;
        mockStores = createStores();
    });

    it('should render blocks with fields', () => {
        render(<VerticalStripeBlocks {...mockProps} />);
        expect(screen.getAllByText(mockProps.items[0].fields.Title.value)).toHaveLength(1);
        expect(screen.getAllByText(mockProps.items[1].fields.Title.value)).toHaveLength(1);
        expect(screen.getAllByText(mockProps.items[2].fields.Title.value)).toHaveLength(1);

        expect(screen.getAllByTestId('jss-image-next')).toHaveLength(mockProps.items.length);
        expect(mockJSSImageNextProps).toHaveBeenCalledWith({
            field: mockProps.items[0].fields.Image,
            mediaSize: {
                desktop: MediaSize.Large,
            },
            fill: true,
        });
    });
});
