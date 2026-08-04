import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import InformationBlock, { TInformationBlockProps } from './InformationBlock';

const mockTextComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field, ...props }) => {
        mockTextComponent(props);

        return <div data-tid='text-component'>{field.value}</div>;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, ...props }) => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links'>{field.value}</div>;
    },
}));

jest.mock('frontend/components/common/JSSImage', () => () => <div data-tid='jss-image' />);

describe('<InformationBlock />', () => {
    const resetMocks = () =>
        ({
            fields: {
                Image: mockSitecoreField(mockSitecoreImageField('src')),
                Description: mockSitecoreField('Text'),
                Title: mockSitecoreField('Title'),
            },
            params: {},
            rendering: {},
        } as TInformationBlockProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should NOT render when fields are NOT provided', () => {
        mocks.fields = undefined;

        const { container } = render(<InformationBlock {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render with image, title and description', () => {
        render(<InformationBlock {...mocks} />);

        expect(screen.getByTestId('text-component')).toHaveTextContent('Title');
        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('Text');
        expect(screen.getAllByTestId('jss-image')).toHaveLength(2);

        expect(mockTextComponent).toHaveBeenCalledWith({
            className: 'information-block__title',
            tag: 'h3',
        });
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            className: 'information-block__text',
        });
    });

    it('should render without image, title and description, but with icon', () => {
        mocks.fields = {};

        render(<InformationBlock {...mocks} />);

        expect(screen.queryByTestId('text-component')).not.toBeInTheDocument();
        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
    });
});
