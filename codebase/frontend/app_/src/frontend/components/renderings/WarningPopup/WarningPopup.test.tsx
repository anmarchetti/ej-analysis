import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import WarningPopup, { IWarningPopupProps } from './WarningPopup';

const createMockProps = (): IWarningPopupProps => ({
    title: mockSitecoreField('Error'),
    description: mockSitecoreField('Error subtext'),
    icon: mockSitecoreField(
        mockSitecoreImageField('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'),
    ),
    ctaText: mockSitecoreField('Globals.Buttons.Close'),
    onClose: jest.fn(),
    extraContent: <div data-tid='extra-content' />,
    id: 'warning-popup',
    bodyClass: 'bodyClass',
    contentClass: 'contentClass',
    ctaClass: 'cta',
    luxuryLabel: undefined,
    footerClass: 'footerClass',
});

let props: IWarningPopupProps = createMockProps();
let mockStores;

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid={props.dataId} />;
    },
}));

const mockLuxuryWrapper = jest.fn();
jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    __esModule: true,
    default: props => {
        mockLuxuryWrapper(props);

        return <div data-tid='luxury-wrapper'>{props.children}</div>;
    },
}));

const mockFloatingPopup = jest.fn();
jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockFloatingPopup(props);

        return (
            <div data-tid={props.id}>
                {children}
                {props.footerContent}
            </div>
        );
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('WarningPopup', () => {
    beforeEach(() => {
        props = createMockProps();
        mockStores = createMockStores();
    });

    it('should render correctly', () => {
        render(<WarningPopup {...props} />);

        expect(screen.getByTestId('warning-popup-title')).toHaveTextContent(props.title.value);
        expect(mockRichTextWithLinks).toHaveBeenCalledWith(
            expect.objectContaining({ field: props.description, tag: 'p', className: 'subtext' }),
        );
        expect(screen.getByTestId('warning-popup-description')).toBeInTheDocument();
        expect(screen.getByRole('img')).toBeInTheDocument();
        expect(screen.getByTestId('warning-popup-icon')).toBeInTheDocument();
        expect(screen.getByTestId('warning-popup-primary-cta')).toBeInTheDocument();
        expect(screen.getByTestId('warning-popup-primary-cta')).toHaveTextContent('Globals.Buttons.Close');
        expect(screen.getByTestId('warning-popup-primary-cta')).toHaveClass(props.ctaClass!);
        expect(screen.getByTestId('extra-content')).toBeInTheDocument();
        expect(mockLuxuryWrapper).not.toHaveBeenCalled();
    });

    it('should call onClose by clicking button ', () => {
        render(<WarningPopup {...props} />);

        screen.getByText('Globals.Buttons.Close').click();

        expect(props.onClose).toHaveBeenCalled();
    });

    it('should render RichTextWithLinks with onLinkClick', () => {
        props.onDescriptionLinkClick = jest.fn();
        render(<WarningPopup {...props} />);

        expect(screen.getByTestId('warning-popup-description')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith(
            expect.objectContaining({
                onLinkClick: props.onDescriptionLinkClick,
            }),
        );
    });

    it('should render secondary CTA if secondaryCtaText is provided and trigger on click handler', async () => {
        props.secondaryCtaText = mockSitecoreField('Secondary CTA');
        props.onSecondaryCtaClick = jest.fn();
        render(<WarningPopup {...props} />);

        expect(screen.getByTestId('warning-popup-secondary-cta')).toHaveTextContent(props.secondaryCtaText.value);

        await userEvent.click(screen.getByText(props.secondaryCtaText.value));

        expect(props.onSecondaryCtaClick).toHaveBeenCalled();
    });

    it('should call FloatingPopup with correct props', () => {
        render(<WarningPopup {...props} />);

        expect(mockFloatingPopup).toHaveBeenCalledWith({
            onClose: props.onClose,
            contentClass: 'content contentClass',
            bodyClass: 'body bodyClass',
            footerClass: 'footer footerClass',
            id: props.id,
            footerContent: expect.any(Object),
        });
    });

    it('should call FloatingPopup with undefined for footerContent if no cta titles passed', () => {
        props.ctaText = undefined;
        props.secondaryCtaText = undefined;
        render(<WarningPopup {...props} />);

        expect(mockFloatingPopup).toHaveBeenCalledWith(
            expect.objectContaining({
                footerContent: undefined,
            }),
        );
    });

    it('should render LuxuryWrapper when luxuryLabel is provided', () => {
        props.luxuryLabel = mockSitecoreField('Luxury Label');
        render(<WarningPopup {...props} />);

        expect(mockLuxuryWrapper).toHaveBeenCalledWith(
            expect.objectContaining({
                label: props.luxuryLabel.value,
                wrapperClassName: 'luxuryWrapper',
                contentClassName: 'luxuryContent',
            }),
        );
        expect(screen.getByTestId('luxury-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('warning-popup-title')).toHaveTextContent(props.title.value);
    });
});
