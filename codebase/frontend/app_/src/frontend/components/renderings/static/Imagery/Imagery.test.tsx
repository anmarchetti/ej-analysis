import React from 'react';
import { render, screen } from '@testing-library/react';

import Imagery from './Imagery';

jest.mock('frontend/utils/getImage');

jest.mock('frontend/components/common/JSSImage', () => ({ field }) => (
    <img src={field?.value?.src || 'mock-src'} alt={field?.value?.alt || 'mock alt'} data-testid='jss-image' />
));

describe('<Imagery />', () => {
    const resetMocks = () => ({
        rendering: {
            fields: {
                items: [
                    {
                        displayName: 'displayName1',
                        fields: {
                            Image: { value: { src: 'src1', alt: 'alt1' } },
                            Link: { value: { href: 'href1', text: 'text1' } },
                        },
                        id: 'id1',
                        name: 'name1',
                    },
                    {
                        displayName: 'displayName2',
                        fields: {
                            Image: { value: { src: 'src2', alt: 'alt2' } },
                            Link: { value: { href: 'href2', text: 'text2' } },
                        },
                        id: 'id2',
                        name: 'name2',
                    },
                ],
            },
        },
        fields: {},
        params: {},
    });

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render images when items are provided', () => {
        render(<Imagery {...mocks} />);

        expect(screen.getByTestId('imagery')).toBeInTheDocument();
        expect(screen.getByTestId('imagery')).toHaveClass('container');

        const imageWrappers = screen.getAllByRole('img');
        expect(imageWrappers).toHaveLength(mocks.rendering.fields.items.length);

        imageWrappers.forEach(imgElement => {
            expect(imgElement.parentElement).toHaveClass('item');
        });
    });

    it('should render nothing when rendering.fields.items is empty', () => {
        mocks.rendering.fields.items = [];
        render(<Imagery {...mocks} />);

        expect(screen.queryByTestId('imagery')).not.toBeInTheDocument();
        expect(screen.queryAllByRole('img')).toHaveLength(0);
    });

    it('should render nothing when rendering.fields is undefined', () => {
        const newMocks = {
            ...mocks,
            rendering: {
                ...mocks.rendering,
                fields: undefined,
            },
        };
        render(<Imagery {...newMocks} />);

        expect(screen.queryByTestId('imagery')).not.toBeInTheDocument();
        expect(screen.queryAllByRole('img')).toHaveLength(0);
    });

    it('should render nothing when rendering is undefined', () => {
        const newMocks = {
            ...mocks,
            rendering: undefined,
        };
        render(<Imagery {...newMocks} />);

        expect(screen.queryByTestId('imagery')).not.toBeInTheDocument();
        expect(screen.queryAllByRole('img')).toHaveLength(0);
    });
});
