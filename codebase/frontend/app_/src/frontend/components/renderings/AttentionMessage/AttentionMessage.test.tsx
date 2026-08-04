import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tokens } from 'code/tokens';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import AttentionMessage, { AttentionMessageType } from './AttentionMessage';

const createProps = () => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Description: mockSitecoreField('Description'),
        Type: mockSitecoreField('Type'),
        Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
        Link: mockSitecoreField(mockSitecoreImageField('Link')),
    },
    collapsible: false,
    isExpandedByDefault: true,
    renderCustomMetaData: jest.fn(() => ({ isVisible: true })),
    params: {},
});

const createMockStores = () => ({
    layoutStore: {
        isEditMode: false,
    },
    appStore: {
        isScreenLessMedium: false,
    },
    routerStore: {
        redirectTo: jest.fn(),
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockInfoBlockProps = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: props => {
        mockInfoBlockProps(props);

        return <div data-tid='info-block' />;
    },
}));

describe('<AttentionMessage />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render nothing if no fields', () => {
        mockProps.fields = null;
        const { container } = render(<AttentionMessage {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render nothing when isVisible=false', () => {
        mockProps.renderCustomMetaData = () => ({
            isVisible: false,
        });
        const { container } = render(<AttentionMessage {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render blue warning style when Type=BlueWarning', () => {
        mockProps.params.Type = AttentionMessageType.BlueWarning;
        render(<AttentionMessage {...mockProps} />);

        expect(mockInfoBlockProps).toHaveBeenCalledWith({
            title: mockProps.fields.Title,
            text: mockProps.fields.Description,
            icon: mockProps.fields.Icon,
            className: 'message blueWarning',
            textClass: 'description',
            link: mockProps.fields.Link,
            iconClass: 'icon',
        });
    });

    describe('renderCustomMetaData', () => {
        it('should use default params when renderCustomMetaData is NOT defined', () => {
            mockProps.renderCustomMetaData = undefined;
            mockProps.isExpandedByDefault = false;
            mockProps.collapsible = true;
            render(<AttentionMessage {...mockProps} />);

            expect(screen.getByTestId('attention-message-expander')).toBeInTheDocument();
            expect(screen.getByRole('button', { expanded: false }));
        });

        it('Should be rendered with custom data', () => {
            mockProps.renderCustomMetaData = () => ({
                fields: {
                    Title: mockSitecoreField('Custom Field'),
                    Description: mockSitecoreField('Custom Description'),
                },
                isExpandedByDefault: true,
                isVisible: true,
            });
            mockProps.collapsible = true;

            render(<AttentionMessage {...mockProps} />);
            expect(screen.queryByTestId('attention-message-expander')).toBeInTheDocument();
            expect(mockInfoBlockProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: { value: 'Custom Field' },
                    text: { value: 'Custom Description' },
                }),
            );
        });
    });

    describe('Expander button', () => {
        it('should change expand state when expander is clicked', async () => {
            mockProps.collapsible = true;
            render(<AttentionMessage {...mockProps} />);

            expect(screen.getByRole('button', { expanded: true }));

            await userEvent.click(screen.getByTestId('attention-message-expander'));
            expect(screen.getByRole('button', { expanded: false }));
        });

        it('should NOT render collapsible class name and collapsible button', () => {
            const { container } = render(<AttentionMessage {...mockProps} />);

            expect(container.querySelector('.collapsible')).not.toBeInTheDocument();
            expect(screen.queryByTestId('attention-message-expander')).not.toBeInTheDocument();
        });

        it('should render collapsible class name and collapsible button', () => {
            mockProps.collapsible = true;
            const { container } = render(<AttentionMessage {...mockProps} />);

            expect(container.querySelector('.collapsible')).toBeInTheDocument();
            expect(screen.getByTestId('attention-message-expander')).toBeInTheDocument();
        });
    });

    describe('InfoBlock', () => {
        it('should render infoBlock with passed props', () => {
            render(<AttentionMessage {...mockProps} />);

            expect(screen.getByTestId('info-block')).toBeInTheDocument();
            expect(mockProps.renderCustomMetaData).toHaveBeenCalledWith(mockProps.fields.Type.value);
            expect(mockInfoBlockProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.Title,
                    text: mockProps.fields.Description,
                    icon: mockProps.fields.Icon,
                    className: 'message',
                    textClass: 'description',
                    link: mockProps.fields.Link,
                }),
            );
        });
    });

    describe('Tokenizer', () => {
        it('should render tokenizer message', () => {
            mockProps.tokenizer = { token: Tokens.Amount, value: 'Token' };
            mockProps.fields.Description = { value: 'description {amount}' };
            render(<AttentionMessage {...mockProps} />);

            expect(mockInfoBlockProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: { value: 'description Token' },
                }),
            );
        });

        it('should render tokenizer empty string', () => {
            mockProps.tokenizer = { token: Tokens.Amount, value: 'Token' };
            mockProps.fields.Description = { value: '' };
            render(<AttentionMessage {...mockProps} />);

            expect(mockInfoBlockProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: { value: '' },
                }),
            );
        });
    });
});
