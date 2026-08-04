import * as React from 'react';
import { render } from '@testing-library/react';
import classNames from 'classnames';

import IconTextBlocksAlt from './IconTextBlocksAlt';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

jest.mock('classnames', () => jest.fn(p => p));
jest.mock('frontend/components/common/JSSImage', () => () => false);
jest.mock('frontend/components/common/RouterLink', () => () => false);
const mockedClassNames = classNames as jest.MockedFn<typeof classNames>;

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
    multiRow: false,
});

let mockProps = createProps() as any;

describe('<IconTextBlocksAlt />', () => {
    beforeEach(() => {
        mockProps = createProps() as any;
        mockedClassNames.mockClear();
    });

    it('should render blocks with fields', () => {
        const { getByText } = render(<IconTextBlocksAlt {...mockProps} />);
        expect(getByText(mockProps.items[0].fields.Title.value)).toBeInTheDocument();
        expect(getByText(mockProps.items[1].fields.Title.value)).toBeInTheDocument();
        expect(getByText(mockProps.items[2].fields.Title.value)).toBeInTheDocument();
    });

    it('should render in columns of 2', () => {
        mockProps.multiRow = true;
        render(<IconTextBlocksAlt {...mockProps} />);
        expect(mockedClassNames).toBeCalledWith('col-12 col-md-6 mb-3', false);
    });

    it('should render in columns of 3', () => {
        render(<IconTextBlocksAlt {...mockProps} />);
        expect(mockedClassNames).toBeCalledWith('col-12 col-md-6 mb-3', 'col-lg-4');
    });
});
