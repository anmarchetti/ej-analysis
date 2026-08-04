import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { TravelAware, TTravelAwareProps } from './TravelAware';

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, ...props }) => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links'>{field.value}</div>;
    },
}));

jest.mock('frontend/components/common/JSSImage', () => () => <div data-tid='jss-image' />);

describe('<TravelAware />', () => {
    const resetMocks = () =>
        ({
            fields: {
                Image: mockSitecoreField(mockSitecoreImageField('src')),
                Text: mockSitecoreField('Text'),
            },
        } as TTravelAwareProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render without JSSImage and RichTextWithLinks when fields are NOT provided', () => {
        mocks.fields = undefined;

        render(<TravelAware {...mocks} />);

        expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });

    it('should standard render', () => {
        render(<TravelAware {...mocks} />);

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('Text');
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            tag: 'p',
            className: 'travel-aware__text',
        });
    });
});
