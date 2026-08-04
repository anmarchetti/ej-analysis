import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ClaimFullOverviewPopup, { TClaimFullOverviewPopupProps } from './ClaimFullOverviewPopup';

const mockFloatingPopupProps = jest.fn();
jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: props => {
        mockFloatingPopupProps(props);
        const { footerContent, children } = props;

        return (
            <div data-tid='floating-popup'>
                <div data-tid='footer-content'>{footerContent}</div>
                {children}
            </div>
        );
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button onClick={props.onClick} data-tid='button'>
                {props.children}
            </button>
        );
    },
}));

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): TClaimFullOverviewPopupProps => ({
    isPopupShown: true,
    onClose: jest.fn(),
    title: { value: 'Popup Title' },
    content: { value: 'Popup Content' },
    icon: { value: { src: 'icon.png' } },
});

let mockProps = createProps();

describe('ClaimFullOverviewPopup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should NOT render component when isPopupShown is false', () => {
        const { container } = render(<ClaimFullOverviewPopup {...mockProps} isPopupShown={false} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render FloatingPopup and children when isPopupShown is true', () => {
        render(<ClaimFullOverviewPopup {...mockProps} />);

        expect(screen.getByTestId('floating-popup')).toBeInTheDocument();
        expect(mockFloatingPopupProps).toHaveBeenCalledWith({
            onClose: mockProps.onClose,
            footerContent: expect.anything(),
            children: expect.anything(),
            contentClass: 'popupContent',
            hasFooterShadow: true,
        });

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImageProps).toHaveBeenCalledWith({
            field: mockProps.icon,
            className: 'icon',
            dataTid: 'popup-icon',
        });

        expect(screen.getByTestId('sitecore-jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.title,
            tag: 'h3',
            'data-tid': 'popup-title',
            className: 'title',
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.content,
            className: 'content',
            dataId: 'popup-content',
        });

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockProps.onClose,
            isOutlined: true,
            className: 'closeButton',
            dataTid: 'close-button',
            children: SitecoreDictionary.GlobalsButtonsClose,
        });
    });

    it('should call onClose when close button is clicked', async () => {
        render(<ClaimFullOverviewPopup {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));
        expect(mockProps.onClose).toHaveBeenCalled();
    });
});
