import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

import AttentionPopup, { AttentionPopupMobilePosition, IAttentionPopupProps, PopupType } from './AttentionPopup';

let mockProps: IAttentionPopupProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPopupProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, ...props }) => {
        mockPopupProps(props);

        return <div data-tid={props.id}>{children}</div>;
    },
}));

const mockJSSIMageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSIMageProps(props);

        return <div data-tid={props.dataTid} />;
    },
}));

const mockRichTextProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextProps(props);

        return <div data-tid={props.dataId} />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, ...props }) => {
        mockButtonProps(props);

        return (
            <div data-tid={props.dataTid} onClick={onClick}>
                {children}
            </div>
        );
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid={props['data-tid']} />;
    },
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ onClick, dataId, children, ...props }) => {
        mockRouterLinkProps(props);

        return (
            <button data-tid={dataId} onClick={onClick}>
                {children}
            </button>
        );
    },
}));

describe('<AttentionPopup />', () => {
    beforeEach(() => {
        mockProps = {
            onClose: jest.fn(),
            onConfirm: jest.fn(),
            fields: {
                Title: mockSitecoreField('Title'),
                Description: mockSitecoreField('Description'),
                CTA: mockSitecoreField('CTA'),
                SecondaryCTA: mockSitecoreField('CTA'),
                Icon: mockSitecoreField(mockSitecoreImageField('Icon')),
            },
            descriptionHandler: jest.fn(() => 'description'),
            showCloseButton: true,
            isLoading: true,
            disableOutsideClick: true,
            isInnerPopup: true,
            popupType: PopupType.NoRoomAndBoardAvailable,
            mobilePosition: AttentionPopupMobilePosition.TopCenter,
            params: { popupType: PopupType.NoRoomAndBoardAvailable },
        };
        mockStores = createMockStores({
            layoutStore: {
                basePath: '/',
            },
        });
    });

    it('Should render children components', () => {
        render(<AttentionPopup {...mockProps} />);

        expect(screen.getByTestId('attention-popup')).toBeInTheDocument();
        expect(screen.getByTestId('attention-popup-icon')).toBeInTheDocument();
        expect(screen.getByTestId('attention-popup-title')).toBeInTheDocument();
        expect(screen.getByTestId('attention-popup-description')).toBeInTheDocument();
        expect(screen.getByTestId('attention-popup-cta')).toBeInTheDocument();
        expect(screen.getByTestId('attention-popup-secondary-cta')).toBeInTheDocument();
        expect(screen.queryByRole('attention-popup-link')).not.toBeInTheDocument();

        expect(mockPopupProps).toHaveBeenCalledWith({
            id: 'attention-popup',
            onClose: mockProps.onClose,
            contentClass: 'content popup_content top-center',
            bodyClass: 'body popup_body',
            showCloseButton: true,
            disableOutsideClick: true,
            isInnerPopup: true,
            dialogClass: 'dialog',
        });
        expect(mockJSSIMageProps).toHaveBeenCalledWith(
            expect.objectContaining({ field: mockProps.fields?.Icon, className: 'errorPopupIcon' }),
        );
        expect(mockTextProps).toHaveBeenCalledWith(
            expect.objectContaining({ field: { value: 'Title' }, tag: 'h2', className: 'title popup_title' }),
        );
        expect(mockButtonProps).toHaveBeenCalledWith({
            type: 'button',
            className: 'cta popup_cta',
            dataTid: 'attention-popup-cta',
            isLoading: true,
        });
        expect(mockButtonProps).toHaveBeenCalledWith({
            type: 'button',
            className: 'cta secondaryCta',
            dataTid: 'attention-popup-secondary-cta',
            isOutlined: true,
        });
        expect(mockTextProps).toHaveBeenCalledWith(expect.objectContaining({ field: { value: 'CTA' } }));
        expect(mockRichTextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: { value: 'description' },
                className: 'description popup_description',
                tag: 'p',
            }),
        );
    });

    it('should NOT render secondary CTA if no fields.SecondaryCTA property', () => {
        mockProps.fields!.SecondaryCTA = undefined;

        render(<AttentionPopup {...mockProps} />);

        expect(screen.queryByTestId('attention-popup-secondary-cta')).not.toBeInTheDocument();
    });

    it('should handle onClose by click on secondary button', async () => {
        render(<AttentionPopup {...mockProps} />);

        const secondaryBtn = screen.getByTestId('attention-popup-secondary-cta');

        await userEvent.click(secondaryBtn);

        expect(mockProps.onConfirm).not.toHaveBeenCalled();
        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should handle onConfirm click', async () => {
        render(<AttentionPopup {...mockProps} />);

        const confirmBtn = screen.getByTestId('attention-popup-cta');

        await userEvent.click(confirmBtn);

        expect(mockProps.onConfirm).toHaveBeenCalled();
        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('Should render Rich text with default description handler', () => {
        mockProps.descriptionHandler = undefined;
        render(<AttentionPopup {...mockProps} />);

        expect(mockRichTextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: { value: 'Description' },
            }),
        );
    });

    it('Should be rendered with default mobilePosition prop', () => {
        mockProps.mobilePosition = undefined;
        render(<AttentionPopup {...mockProps} />);

        expect(mockPopupProps).toHaveBeenCalledWith(
            expect.objectContaining({
                contentClass: 'content popup_content bottom',
            }),
        );
    });

    it('Should NOT render description when it wa not been provided', () => {
        mockProps.fields!.Description = undefined;
        render(<AttentionPopup {...mockProps} />);

        expect(screen.queryByTestId('rich-text')).not.toBeInTheDocument();
    });

    it('Should set custom id', () => {
        mockProps.id = 'custom-id';

        render(<AttentionPopup {...mockProps} />);

        expect(screen.getByTestId('custom-id')).toBeInTheDocument();
        expect(screen.getByTestId('custom-id-icon')).toBeInTheDocument();
        expect(screen.getByTestId('custom-id-title')).toBeInTheDocument();
        expect(screen.getByTestId('custom-id-description')).toBeInTheDocument();
        expect(screen.getByTestId('custom-id-cta')).toBeInTheDocument();

        mockProps.fields!.CTALink = {
            value: {
                href: 'href',
            } as ISitecoreLink,
        };

        render(<AttentionPopup {...mockProps} />);

        expect(screen.getByTestId('custom-id-link')).toBeInTheDocument();
    });

    it('Should render null if no fields prop was passed', () => {
        mockProps.fields = undefined;
        const { container } = render(<AttentionPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it("Should render CTALink if it's passed", () => {
        mockProps.fields!.CTALink = mockSitecoreField(
            mockSitecoreLinkField('CTALink', 'CTALink', SitecoreLinkType.Internal),
        );

        render(<AttentionPopup {...mockProps} />);

        expect(mockRouterLinkProps).toHaveBeenCalledWith({
            link: mockProps.fields!.CTALink,
            className: 'btn',
        });
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields!.CTA,
        });
    });

    it('Should render null if popupType is not equal to params.popupType', () => {
        mockProps.params = { popupType: 'test' };
        mockProps.popupType = PopupType.InventoryError;
        const { container } = render(<AttentionPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
