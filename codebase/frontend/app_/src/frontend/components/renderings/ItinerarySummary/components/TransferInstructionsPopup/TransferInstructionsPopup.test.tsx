import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import * as mapUtils from 'frontend/utils/map.utils';
import { TransferType } from 'models/enum/transfer/TransferType';
import { ITransferInstructionsPopupFields } from 'frontend/components/renderings/ItinerarySummary/interfaces';
import * as utils from 'frontend/components/renderings/ItinerarySummary/utils/utils';

import TransferInstructionsPopup, { ITransferInstructionsPopupProps } from './TransferInstructionsPopup';

const mockFloatingPopup = jest.fn();
jest.mock('frontend/components/common/FloatingPopup/FloatingPopup', () => ({
    __esModule: true,
    default: props => {
        mockFloatingPopup(props);

        return (
            <div data-tid='floating-popup'>
                {props.footerContent}
                {props.children}
            </div>
        );
    },
}));

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButton(props);

        return (
            <button data-tid={props.dataTid} onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

const mockLink = jest.fn();
jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: props => {
        mockLink(props);

        return (
            <a data-tid='link' href={props.href} target={props.target}>
                {props.children}
            </a>
        );
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links' onClick={props.onLinkClick} />;
    },
}));

const mockSitecoreText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockSitecoreText(props);

        return <span data-tid='sitecore-text'>{props.field?.value}</span>;
    },
}));

let mockIsMobile = false;
let mockIsIOS = false;
jest.mock('frontend/utils/browser.utils', () => ({
    __esModule: true,
    isMobile: () => mockIsMobile,
    isIOS: () => mockIsIOS,
}));

jest.mock('frontend/utils/map.utils', () => ({
    __esModule: true,
    buildGetDirectionsGoogleMapsUrl: jest.fn(() => 'https://google.com/maps'),
    buildGetDirectionsAppleMapsUrl: jest.fn(() => 'https://maps.apple.com'),
    buildGetWhat3WordsUrl: jest.fn(() => 'https://what3words.com'),
}));
const mockBuildGetDirectionsGoogleMapsUrl = jest.spyOn(mapUtils, 'buildGetDirectionsGoogleMapsUrl');
const mockBuildGetDirectionsAppleMapsUrl = jest.spyOn(mapUtils, 'buildGetDirectionsAppleMapsUrl');
const mockBuildGetWhat3WordsUrl = jest.spyOn(mapUtils, 'buildGetWhat3WordsUrl');

jest.mock('frontend/components/renderings/ItinerarySummary/utils/utils', () => ({
    __esModule: true,
    formatPhoneNumbersAsLinks: jest.fn(text => text),
    formatLinksInText: jest.fn(text => text),
}));
const mockFormatPhoneNumbersAsLinks = jest.spyOn(utils, 'formatPhoneNumbersAsLinks');
const mockFormatLinksInText = jest.spyOn(utils, 'formatLinksInText');

const mockFields: ITransferInstructionsPopupFields = {
    AdditionalInstructions: { value: 'Additional instructions text' },
    InstructionsSubtitle: { value: 'Instructions subtitle' },
    LocationsTitle: { value: 'Locations title' },
    MapLocationButtonLabel: { value: 'Get directions' },
    MapLocationDescription: { value: 'Map location description' },
    ThreeWordsLocationButtonLabel: { value: 'What3Words' },
    ThreeWordsLocationDescription: { value: 'Three words description' },
    AppleMapLocationButtonLabel: { value: 'Open in Apple Maps' },
    GoogleMapLocationButtonLabel: { value: 'Open in Google Maps' },
};

const createProps = (): ITransferInstructionsPopupProps => ({
    fields: mockFields,
    onClose: jest.fn(),
    transferType: TransferType.Shared,
    instructions: 'Test instructions',
    mapLocation: { latitude: '51.5074', longitude: '-0.1278' },
    popupTitle: { value: 'Transfer Instructions' },
    what3WordsLocation: '///test.three.words',
    CloseButtonLabel: { value: 'Close' },
});

let mockProps = createProps();

describe('<TransferInstructionsPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockIsMobile = false;
        mockIsIOS = false;
    });

    it('should render component standard', () => {
        render(<TransferInstructionsPopup {...mockProps} />);

        expect(screen.getByTestId('floating-popup')).toBeInTheDocument();
        expect(mockFloatingPopup).toHaveBeenCalledWith({
            onClose: mockProps.onClose,
            bodyClass: 'bodyClass',
            footerClass: 'footer',
            footerContent: expect.anything(),
            children: expect.anything(),
            id: 'transfer-instructions-popup',
        });

        expect(screen.getByTestId('transfer-instructions-popup-close-btn')).toBeInTheDocument();
        expect(mockButton).toHaveBeenCalledWith({
            isOutlined: true,
            dataTid: 'transfer-instructions-popup-close-btn',
            className: 'closeBtn',
            onClick: mockProps.onClose,
            children: mockProps.CloseButtonLabel.value,
        });

        expect(mockSitecoreText).toHaveBeenCalledWith({
            field: mockProps.popupTitle,
            className: 'headerTitle',
            tag: 'h3',
            'data-tid': 'popup-title',
        });

        expect(mockSitecoreText).toHaveBeenCalledWith({
            field: mockFields.InstructionsSubtitle,
            tag: 'span',
            className: 'title',
            'data-tid': 'instructions-subtitle',
        });

        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: { value: mockProps.instructions },
            tag: 'div',
            dataId: 'instructions',
        });

        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: mockFields.AdditionalInstructions,
            tag: 'div',
            onLinkClick: expect.any(Function),
            dataId: 'additional-instructions',
        });

        expect(screen.getByTestId('map-lined-icon')).toBeInTheDocument();
        expect(mockSitecoreText).toHaveBeenCalledWith({
            field: mockFields.LocationsTitle,
            tag: 'div',
            className: 'title',
            'data-tid': 'locations-title',
        });

        expect(mockBuildGetWhat3WordsUrl).toHaveBeenCalledWith(mockProps.what3WordsLocation);
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: mockFields.ThreeWordsLocationDescription,
            dataId: 'three-words-description',
        });
        expect(mockSitecoreText).toHaveBeenCalledWith({
            field: mockFields.ThreeWordsLocationButtonLabel,
            tag: 'span',
        });
    });

    it('should call onClose when close button is clicked', () => {
        render(<TransferInstructionsPopup {...mockProps} />);

        fireEvent.click(screen.getByTestId('transfer-instructions-popup-close-btn'));

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should render transfer icon for Shared transfer type', () => {
        mockProps.transferType = TransferType.Shared;

        render(<TransferInstructionsPopup {...mockProps} />);

        expect(screen.getByTestId('transfer-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('taxi-icon')).not.toBeInTheDocument();
    });

    it('should render taxi icon for Private transfer type', () => {
        mockProps.transferType = TransferType.Private;

        render(<TransferInstructionsPopup {...mockProps} />);

        expect(screen.getByTestId('taxi-lined-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('transfer-icon')).not.toBeInTheDocument();
    });

    it('should call formatPhoneNumbersAsLinks with instructions', () => {
        render(<TransferInstructionsPopup {...mockProps} />);

        expect(mockFormatPhoneNumbersAsLinks).toHaveBeenCalledWith(mockProps.instructions);
        expect(mockFormatLinksInText).toHaveBeenCalledWith(mockProps.instructions);
    });

    describe('Map links', () => {
        it('should render Google Maps link with correct URL and right label on desktop', () => {
            render(<TransferInstructionsPopup {...mockProps} />);

            expect(mockBuildGetDirectionsGoogleMapsUrl).toHaveBeenCalledWith(mockProps.mapLocation);
            expect(mockLink).toHaveBeenCalledWith({
                href: 'https://google.com/maps',
                target: '_blank',
                className: 'button',
                children: expect.anything(),
                'data-tid': 'google-maps-link',
                rel: 'noopener noreferrer',
            });

            expect(mockSitecoreText).toHaveBeenCalledWith({
                field: mockFields.MapLocationButtonLabel,
                tag: 'span',
            });
        });

        it('should show GoogleMapLocationButtonLabel on mobile', () => {
            mockIsMobile = true;

            render(<TransferInstructionsPopup {...mockProps} />);

            expect(mockSitecoreText).toHaveBeenCalledWith({
                field: mockFields.GoogleMapLocationButtonLabel,
                tag: 'span',
            });
        });

        it('should NOT render Apple Maps link when not iOS', () => {
            mockIsIOS = false;

            render(<TransferInstructionsPopup {...mockProps} />);

            expect(mockBuildGetDirectionsAppleMapsUrl).not.toHaveBeenCalled();
        });

        it('should render Apple Maps link when iOS', () => {
            mockIsIOS = true;

            render(<TransferInstructionsPopup {...mockProps} />);

            expect(mockBuildGetDirectionsAppleMapsUrl).toHaveBeenCalledWith(mockProps.mapLocation);
            expect(mockSitecoreText).toHaveBeenCalledWith({
                field: mockFields.AppleMapLocationButtonLabel,
                tag: 'span',
            });
        });
    });

    describe('onChatBotLinkClick', () => {
        it('should call preventDefault on click', () => {
            render(<TransferInstructionsPopup {...mockProps} />);

            const mockEvent = { preventDefault: jest.fn() };
            const richTextCalls = mockRichTextWithLinks.mock.calls;
            const additionalInstructionsCall = richTextCalls.find(
                call => call[0].field === mockFields.AdditionalInstructions,
            );

            additionalInstructionsCall[0].onLinkClick(mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should toggle chatbot and call onClose when chatbot is hidden', () => {
            const mockToggleChatbot = jest.fn();
            window['toggleChatbot'] = mockToggleChatbot;

            const mockChatbotContainer = document.createElement('div');
            mockChatbotContainer.id = 'chatbotContainer';
            mockChatbotContainer.style.display = 'none';

            const mockShadowRoot = {
                getElementById: jest.fn(() => mockChatbotContainer),
            };

            const mockChatbotElement = document.createElement('div');
            mockChatbotElement.id = 'gct-chatbot';
            Object.defineProperty(mockChatbotElement, 'shadowRoot', {
                value: mockShadowRoot,
            });

            document.body.appendChild(mockChatbotElement);

            render(<TransferInstructionsPopup {...mockProps} />);

            const richTextCalls = mockRichTextWithLinks.mock.calls;
            const additionalInstructionsCall = richTextCalls.find(
                call => call[0].field === mockFields.AdditionalInstructions,
            );

            additionalInstructionsCall[0].onLinkClick({ preventDefault: jest.fn() });

            expect(mockToggleChatbot).toHaveBeenCalled();
            expect(mockProps.onClose).toHaveBeenCalled();

            mockChatbotElement.remove();
        });

        it('should NOT toggle chatbot when chatbot is already visible', () => {
            const mockToggleChatbot = jest.fn();
            window['toggleChatbot'] = mockToggleChatbot;

            const mockChatbotContainer = document.createElement('div');
            mockChatbotContainer.id = 'chatbotContainer';
            mockChatbotContainer.style.display = 'block';

            const mockShadowRoot = {
                getElementById: jest.fn(() => mockChatbotContainer),
            };

            const mockChatbotElement = document.createElement('div');
            mockChatbotElement.id = 'gct-chatbot';
            Object.defineProperty(mockChatbotElement, 'shadowRoot', {
                value: mockShadowRoot,
            });

            document.body.appendChild(mockChatbotElement);

            render(<TransferInstructionsPopup {...mockProps} />);

            const richTextCalls = mockRichTextWithLinks.mock.calls;
            const additionalInstructionsCall = richTextCalls.find(
                call => call[0].field === mockFields.AdditionalInstructions,
            );

            additionalInstructionsCall[0].onLinkClick({ preventDefault: jest.fn() });

            expect(mockToggleChatbot).not.toHaveBeenCalled();
            expect(mockProps.onClose).toHaveBeenCalled();

            mockChatbotElement.remove();
        });

        it('should NOT call onClose when chatbot element is not found', () => {
            render(<TransferInstructionsPopup {...mockProps} />);

            const richTextCalls = mockRichTextWithLinks.mock.calls;
            const additionalInstructionsCall = richTextCalls.find(
                call => call[0].field === mockFields.AdditionalInstructions,
            );

            additionalInstructionsCall[0].onLinkClick({ preventDefault: jest.fn() });

            expect(mockProps.onClose).not.toHaveBeenCalled();
        });
    });
});
