import React from 'react';
import { render } from '@testing-library/react';

import { HtmlBlock } from './HtmlBlock';

describe('<HtmlBlock />', () => {
    const resetMocks = () =>
        ({
            fields: {
                Html: {
                    value: '<div className="some_class">Test</b>',
                },
            },
            params: {
                Locations: 'en|ru',
                Query: '',
                Destinations: '',
            },
            locations: ['en', 'ru'],
            destinations: [''],
            fullUrl: 'url',
            className: 'test-class',
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should NOT render when fields are NOT provided', () => {
        mocks.fields = undefined;

        const { container } = render(<HtmlBlock {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when there are no same locations', () => {
        mocks.locations = [];

        const { container } = render(<HtmlBlock {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render', () => {
        const { container } = render(<HtmlBlock {...mocks} />);

        expect(container.firstChild).toHaveClass('test-class');
    });

    describe('shouldShow', () => {
        it('should return true when selectedDestinationCodes match', () => {
            mocks.params.Locations = '';
            mocks.params.Destinations = 'code-1';
            mocks.selectedDestinationCodes = ['code-1'];

            const { container } = render(<HtmlBlock {...mocks} />);

            expect(container.firstChild).toBeInTheDocument();
        });

        it('should NOT return true when destinations match', () => {
            mocks.params.Locations = '';
            mocks.params.Destinations = 'code-1';
            mocks.selectedDestinationCodes = undefined;

            const { container } = render(<HtmlBlock {...mocks} />);

            expect(container).toBeEmptyDOMElement();
        });
    });
});
