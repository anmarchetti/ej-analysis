import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ModalDialog } from './ModalDialog';

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, footerContent }) => (
        <div data-tid='popup'>
            {children}
            {footerContent}
        </div>
    ),
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children }) => (
        <button onKeyDown={jest.fn()} onClick={onClick}>
            {children}
        </button>
    ),
}));

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

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    JSSImage: () => <div data-tid='jss-image' />,
}));

const resetMocks = () => ({
    isShowPopup: true,
    onClose: jest.fn(),
    fields: {
        Title: mockSitecoreField('Title'),
        Icon: mockSitecoreField(mockSitecoreImageField('src')),
        Description: mockSitecoreField('Description'),
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mocks;
let mockStores;

describe('<ModalDialog />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    it('should NOT render when isShowPopup is false', () => {
        mocks.isShowPopup = false;

        const { container } = render(<ModalDialog {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render', () => {
        render(<ModalDialog {...mocks} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsClose);
        expect(screen.getByTestId('text-component')).toHaveTextContent('Title');
        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent('Description');
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();

        expect(mockTextComponent).toHaveBeenCalledWith({ className: 'content__title', tag: 'p' });
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            className: 'content__description',
            tag: 'p',
        });
    });

    it('should render without JSSImage, Text and RichTextWith links when fields are empty', () => {
        mocks.fields = {};

        render(<ModalDialog {...mocks} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.queryByTestId('text-component')).not.toBeInTheDocument();
        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
        expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
    });

    it('should render without content when fields are NOT provided', () => {
        mocks.fields = undefined;

        render(<ModalDialog {...mocks} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.queryByTestId('text-component')).not.toBeInTheDocument();
        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
        expect(screen.queryByTestId('jss-image')).not.toBeInTheDocument();
    });
});
