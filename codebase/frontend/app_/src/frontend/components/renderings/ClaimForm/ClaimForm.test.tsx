import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { claimFormFieldsMock } from './__mocks__/claimFormFields.mock';
import ClaimForm, { TClaimFormProps } from './ClaimForm';

const mockJSSImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageProps(props);

        return <div data-tid='jss-image' />;
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

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkProps(props);

        return <div data-tid='router-link' />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button data-tid={props['data-tid'] || 'button'} onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

const mockItemsColumnProps = jest.fn();
jest.mock('./components/ItemsColumn/ItemsColumn', () => ({
    __esModule: true,
    default: props => {
        mockItemsColumnProps(props);

        return <div data-tid={'items-column'} />;
    },
}));

const mockClaimFullOverviewPopupProps = jest.fn();
jest.mock('./components/ClaimFullOverviewPopup/ClaimFullOverviewPopup', () => ({
    __esModule: true,
    default: props => {
        mockClaimFullOverviewPopupProps(props);

        return <div data-tid='claim-full-overview-popup' />;
    },
}));

const createProps = (): TClaimFormProps => ({
    fields: claimFormFieldsMock,
    params: {},
    rendering: undefined,
});

let mockProps = createProps();

describe('ClaimForm', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render component if fields are not provided', () => {
        mockProps.fields = undefined;
        const { container } = render(<ClaimForm {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render ClaimForm with all main sections', () => {
        render(<ClaimForm {...mockProps} />);

        expect(screen.getByTestId('claim-form')).toBeInTheDocument();

        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImageProps).toHaveBeenCalledWith({
            field: claimFormFieldsMock.FormIcon,
            className: 'icon',
            dataTid: 'claim-form-icon',
        });

        expect(mockTextProps).toHaveBeenNthCalledWith(1, {
            field: claimFormFieldsMock.FormTitle,
            tag: 'h3',
            className: 'title',
            'data-tid': 'claim-form-title',
        });

        expect(screen.getAllByTestId('items-column')).toHaveLength(2);
        expect(mockItemsColumnProps).toHaveBeenNthCalledWith(1, {
            items: claimFormFieldsMock.EligibleItems,
            title: claimFormFieldsMock.EligibleItemsSectionTitle,
            description: claimFormFieldsMock.EligibleItemsDescription,
            isEligibleColumn: true,
        });
        expect(mockItemsColumnProps).toHaveBeenNthCalledWith(2, {
            items: claimFormFieldsMock.NotEligibleItems,
            title: claimFormFieldsMock.NotEligibleItemsSectionTitle,
            description: claimFormFieldsMock.NotEligibleItemsDescription,
        });

        expect(screen.getByTestId('open-full-overview-button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            'data-tid': 'open-full-overview-button',
            className: 'btnExample',
            isOutlined: true,
            onClick: expect.any(Function),
            children: claimFormFieldsMock.SeeFullOverviewButtonLabel.value,
        });

        expect(screen.getByTestId('instructions-section')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenNthCalledWith(2, {
            field: claimFormFieldsMock.InstructionsSectionTitle,
            tag: 'h4',
            className: 'title',
            'data-tid': 'title',
        });

        expect(screen.getAllByTestId('rich-text-with-links')).toHaveLength(3);
        expect(mockRichTextWithLinksProps).toHaveBeenNthCalledWith(1, {
            field: claimFormFieldsMock.InstructionsSectionDescription,
            tag: 'div',
            className: 'description',
            dataId: 'instructions-section-description',
        });

        expect(mockRichTextWithLinksProps).toHaveBeenNthCalledWith(2, {
            field: claimFormFieldsMock.InstructionsSectionAdditionalDescription,
            tag: 'div',
            className: 'additionalDescription',
            dataId: 'instructions-section-additional-description',
        });

        expect(mockRichTextWithLinksProps).toHaveBeenNthCalledWith(3, {
            field: claimFormFieldsMock.InstructionsSectionAdditionalDescription,
            tag: 'div',
            className: 'additionalDescriptionMobile',
            dataId: 'instructions-section-additional-description-mobile',
        });

        expect(screen.getByTestId('router-link')).toBeInTheDocument();
        expect(mockRouterLinkProps).toHaveBeenCalledWith({
            dataId: 'open-form-link',
            link: claimFormFieldsMock.OpenFormButtonLink,
            className: 'btn btnOpenForm',
            children: claimFormFieldsMock.OpenFormButtonLabel.value,
        });

        expect(mockClaimFullOverviewPopupProps).toHaveBeenCalledWith({
            isPopupShown: false,
            onClose: expect.any(Function),
            title: claimFormFieldsMock.FullOverviewPopupTitle,
            content: claimFormFieldsMock.FullOverviewPopupDescription,
            icon: claimFormFieldsMock.FullOverviewPopupIcon,
        });
    });

    it('should show ClaimFullOverviewPopup when full overview button is clicked', async () => {
        render(<ClaimForm {...createProps()} />);

        await userEvent.click(screen.getByTestId('open-full-overview-button'));

        expect(screen.getByTestId('claim-full-overview-popup')).toBeInTheDocument();
        expect(mockClaimFullOverviewPopupProps).toHaveBeenCalledWith({
            isPopupShown: true,
            onClose: expect.any(Function),
            title: claimFormFieldsMock.FullOverviewPopupTitle,
            content: claimFormFieldsMock.FullOverviewPopupDescription,
            icon: claimFormFieldsMock.FullOverviewPopupIcon,
        });
    });

    it('should NOT render full overview button and popup if EnableFullOverviewPopup is false', () => {
        mockProps.fields!.EnableFullOverviewPopup.value = false;

        render(<ClaimForm {...mockProps} />);
        expect(screen.queryByTestId('open-full-overview-button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('claim-full-overview-popup')).not.toBeInTheDocument();
    });
});
