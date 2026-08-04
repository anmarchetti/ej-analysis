import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { specialAssistancePopupFields } from 'frontend/components/renderings/SpecialAssistance/__mocks__/SpecialAssistanceFields';

import SpecialAssistancePopup, { ISpecialAssistancePopupProps } from './SpecialAssistancePopup';

const createProps = (): ISpecialAssistancePopupProps => ({
    onClose: jest.fn(),
    fields: specialAssistancePopupFields,
});

let mockProps: ISpecialAssistancePopupProps;

const mockFloatingPopupProps = jest.fn();
jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: props => {
        mockFloatingPopupProps(props);

        return (
            <div data-tid='floating-popup'>
                {props.footerContent}
                {props.children}
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
            <button data-tid='button' onClick={props.onClick}>
                {props.children}
            </button>
        );
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

        return <div data-tid='jss-text' />;
    },
}));

const mockJSSImageNext = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageNext(props);

        return <div data-tid='jss-image-next' />;
    },
}));

describe('<SpecialAssistancePopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render if fields are undefined', () => {
        render(<SpecialAssistancePopup fields={undefined} onClose={jest.fn()} />);

        expect(screen.queryByTestId('floating-popup')).not.toBeInTheDocument();
    });

    it('should render with all fields', () => {
        render(<SpecialAssistancePopup {...mockProps} />);

        expect(screen.getByTestId('floating-popup')).toBeInTheDocument();
        expect(mockFloatingPopupProps).toHaveBeenCalledWith({
            footerClass: 'footer',
            bodyClass: 'bodyClass',
            onClose: mockProps.onClose,
            footerContent: expect.anything(),
            children: expect.anything(),
            id: 'special-assistance-popup',
        });

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSImageNext).toHaveBeenCalledWith({
            field: mockProps.fields!.Icon,
            className: 'icon',
            'data-tid': 'popup-icon',
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields!.Description,
            className: 'description',
            dataId: 'popup-description',
            enableClickEventForEmptyLinks: true,
            onLinkClick: expect.any(Function),
        });

        expect(screen.getByTestId('jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields!.Title,
            className: 'title',
            tag: 'h3',
            'data-tid': 'popup-title',
        });

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockProps.onClose,
            isOutlined: true,
            className: 'btnSecondary',
            'aria-label': mockProps.fields!.SecondaryButtonScreenReaderText.value,
            children: mockProps.fields!.SecondaryButtonLabel.value,
            dataTid: 'popup-close-btn',
        });
    });

    it('should call onClose func on button click', async () => {
        render(<SpecialAssistancePopup {...mockProps} />);

        const button = screen.getByRole('button', { name: mockProps.fields!.SecondaryButtonLabel.value });
        expect(button).toBeInTheDocument();

        await userEvent.click(button);

        expect(mockProps.onClose).toHaveBeenCalled();
    });
});
