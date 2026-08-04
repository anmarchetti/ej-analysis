import * as React from 'react';
import { render } from '@testing-library/react';

import TextAltBlocks from './TextAltBlocks';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

const createProps = () => ({
    items: [
        {
            fields: {
                Title: { value: 'Title' },
                Description: { value: 'Description' },
                Image: { value: { src: '' } },
                Link: { value: { href: '' } },
            },
            id: '1',
        },
        {
            id: '2',
            fields: {
                Title: { value: 'Title 2' },
            },
        },
        {
            fields: {
                Title: { value: 'Title 3' },
            },
            id: '3',
        },
    ],
});

let mockProps = createProps() as any;

describe('<TextAltBlock />', () => {
    beforeEach(() => {
        mockProps = createProps() as any;
    });

    it('should render blocks with fields', () => {
        const { getByText } = render(<TextAltBlocks {...mockProps} />);
        expect(getByText(mockProps.items[0].fields.Title.value)).toBeInTheDocument();
        expect(getByText(mockProps.items[1].fields.Title.value)).toBeInTheDocument();
        expect(getByText(mockProps.items[2].fields.Title.value)).toBeInTheDocument();
    });
});
