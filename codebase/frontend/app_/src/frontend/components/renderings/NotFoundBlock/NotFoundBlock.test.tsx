import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { NotFoundBlock, TNotFoundBlockProps } from './NotFoundBlock';

jest.mock('./components/NotFoundFlipText', () => ({
    __esModule: true,
    default: () => <div data-tid='not-found-flip-text' />,
}));

describe('<NotFoundBlock />', () => {
    const resetMocks = () =>
        ({
            fields: {
                PageNotFoundMessage: mockSitecoreField('PageNotFoundMessage'),
            },
            params: {},
            rendering: {},
        } as TNotFoundBlockProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should standart render', () => {
        render(<NotFoundBlock {...mocks} />);

        expect(screen.getByTestId('not-found')).toBeInTheDocument();
        expect(screen.getByTestId('not-found-flip-text')).toBeInTheDocument();
    });

    it('Should empty render if no fields', () => {
        mocks.fields = undefined;

        const { container } = render(<NotFoundBlock {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should empty render if no text', () => {
        mocks.fields = {
            PageNotFoundMessage: mockSitecoreField(''),
        };

        const { container } = render(<NotFoundBlock {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });
});
