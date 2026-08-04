import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import InfoWithActionBlock, { TInfoWithActionBlockProps } from './InfoWithActionBlock';

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

describe('<InfoWithActionBlock />', () => {
    const resetMocks = () =>
        ({
            fields: {
                Title: mockSitecoreField('Title'),
                Icon: mockSitecoreField(mockSitecoreImageField('src')),
                Text: mockSitecoreField('Text'),
            },
            rendering: {},
            params: {},
        } as TInfoWithActionBlockProps);

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should NOT render when fields are NOT provided', () => {
        mocks.fields = undefined;

        const { container } = render(<InfoWithActionBlock {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render', () => {
        render(<InfoWithActionBlock {...mocks} />);

        expect(screen.getByTestId('info-with-action-block-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('text-component')).toHaveTextContent('Title');
        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('Text');
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();

        expect(mockTextComponent).toHaveBeenCalledWith({ tag: 'h2' });
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            tag: 'div',
            className: 'info-with-action__text',
        });
    });

    it('should render without text, JSSImage and RichTextWithLinks', () => {
        mocks.fields = {};

        render(<InfoWithActionBlock {...mocks} />);

        expect(screen.getByTestId('info-with-action-block-wrapper')).toBeInTheDocument();
        expect(screen.queryByTestId('text-component')).not.toBeInTheDocument();
        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
        expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
    });
});
