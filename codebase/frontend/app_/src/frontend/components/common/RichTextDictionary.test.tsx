import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import RichTextDictionary, { IRichTextDictionary } from './RichTextDictionary';

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, ...props }) => {
        mockRichTextWithLinks(props);

        return (
            <div data-tid='rich-text-with-links'>
                <div>{field.value}</div>
            </div>
        );
    },
}));

const resetMocks = () =>
    ({
        dictionaryKey: SitecoreDictionary.GlobalsButtonsBack,
        content: 'test',
    } as IRichTextDictionary);

let mockStores;
let mocks;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RichTextDictionary />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mocks = resetMocks();
    });

    it('should render RichTextWithLinks with content from dictionaryKey', () => {
        render(<RichTextDictionary {...mocks} />);

        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsBack);
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({ tag: 'span' });
    });

    it('should render RichTextWithLinks with content from content when dictionaryKey is NOT provided', () => {
        mocks.dictionaryKey = undefined;
        mocks.tag = 'div';

        render(<RichTextDictionary {...mocks} />);

        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('test');
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({ tag: 'div' });
    });

    it('should render empty RichTextWithLinks when dictionaryKey and content are NOT provided', () => {
        mocks.dictionaryKey = undefined;
        mocks.content = undefined;

        render(<RichTextDictionary {...mocks} />);

        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('');
    });
});
