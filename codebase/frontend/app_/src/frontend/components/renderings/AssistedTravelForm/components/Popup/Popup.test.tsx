import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { popupFieldsMock } from 'frontend/components/renderings/AssistedTravelForm/mocks/fields.mocks';

import Popup, { IPopupProps } from './Popup';

const createProps = (): IPopupProps => ({
    fields: popupFieldsMock,
    onPrimaryBtnClick: jest.fn(),
    onSecondaryBtnClick: jest.fn(),
});

let mockProps = createProps();

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
            <button data-tid={props['data-tid']} onClick={props.onClick}>
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

describe('<Popup />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render if fields are undefined', () => {
        render(<Popup fields={undefined} onSecondaryBtnClick={jest.fn()} />);
        expect(screen.queryByTestId('floating-popup')).not.toBeInTheDocument();
    });

    it('should render with all fields', () => {
        render(<Popup {...mockProps} />);

        expect(screen.getByTestId('floating-popup')).toBeInTheDocument();
        expect(mockFloatingPopupProps).toHaveBeenCalledWith({
            footerClass: 'footer',
            bodyClass: 'bodyClass',
            onClose: mockProps.onSecondaryBtnClick,
            footerContent: expect.anything(),
            children: expect.anything(),
            disableOutsideClick: false,
        });

        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(mockJSSImageNext).toHaveBeenCalledWith({
            field: mockProps.fields!.Icon,
            className: 'icon',
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields!.Description,
            className: 'description',
        });

        expect(screen.getByTestId('jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields!.Title,
            className: 'title',
            tag: 'h3',
        });

        expect(screen.getAllByRole('button')).toHaveLength(2);
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockProps.onSecondaryBtnClick,
            isOutlined: true,
            className: 'btnSecondary',
            'aria-label': mockProps.fields!.SecondaryButtonScreenReaderText.value,
            children: mockProps.fields!.SecondaryButtonLabel.value,
            'data-tid': 'button-secondary',
        });

        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockProps.onPrimaryBtnClick,
            className: 'btnPrimary',
            'aria-label': mockProps.fields!.PrimaryButtonScreenReaderText.value,
            children: mockProps.fields!.PrimaryButtonLabel.value,
            'data-tid': 'button-primary',
        });
    });

    it('should call onPrimaryBtnClick when primary button is clicked', async () => {
        render(<Popup {...mockProps} />);

        const btn = screen.getByTestId('button-primary');
        await userEvent.click(btn);

        expect(mockProps.onPrimaryBtnClick).toHaveBeenCalled();
    });

    it('should call onSecondaryBtnClick when secondary button is clicked', async () => {
        render(<Popup {...mockProps} />);

        const btn = screen.getByTestId('button-secondary');
        await userEvent.click(btn);
        expect(mockProps.onSecondaryBtnClick).toHaveBeenCalled();
    });

    it('should NOT render primary button if PrimaryButtonLabel is empty', () => {
        const props = {
            ...mockProps,
            fields: {
                ...popupFieldsMock,
                PrimaryButtonLabel: { value: '' },
            },
        };

        render(<Popup {...props} />);
        expect(screen.queryByTestId('button-primary')).not.toBeInTheDocument();
    });

    it('should NOT render secondary button if SecondaryButtonLabel is empty', () => {
        const props = {
            ...mockProps,
            fields: {
                ...popupFieldsMock,
                SecondaryButtonLabel: { value: '' },
            },
        };
        render(<Popup {...props} />);
        expect(screen.queryByTestId('button-secondary')).not.toBeInTheDocument();
    });

    it('should replace email and passengerName tokens in description', () => {
        const props = {
            ...mockProps,
            fields: {
                ...popupFieldsMock,
                Description: { value: 'Hello {passengerName}, your email is {email}.' },
            },
            customerFullName: 'Jane Doe',
            emailAddress: 'jane@example.com',
        };

        render(<Popup {...props} />);

        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: { value: 'Hello Jane Doe, your email is jane@example.com.' },
            className: 'description',
        });
    });

    it('should replace tokens with empty strings when customerFullName and emailAddress are not provided', () => {
        const props = {
            ...mockProps,
            fields: {
                ...popupFieldsMock,
                Description: { value: 'Hello {passengerName}, your email is {email}.' },
            },
        };

        render(<Popup {...props} />);

        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: { value: 'Hello , your email is .' },
            className: 'description',
        });
    });
});
