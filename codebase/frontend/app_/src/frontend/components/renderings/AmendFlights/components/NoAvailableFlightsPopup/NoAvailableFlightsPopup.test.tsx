import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores } from 'frontend/__mocks__';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import NoAvailableFlightsPopup, {
    INoAvailableFlightsPopupProps,
} from 'frontend/components/renderings/AmendFlights/components/NoAvailableFlightsPopup/NoAvailableFlightsPopup';

let mockProps: INoAvailableFlightsPopupProps;
let mockStores;

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceTokens: jest.fn(p => p),
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPopupProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, ...props }) => {
        mockPopupProps(props);

        return <div data-tid='popup'>{children}</div>;
    },
}));

const mockRichTextProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextProps(props);

        return (
            <button data-tid='rich-text' onClick={props.onLinkClick}>
                {props.field.value}
            </button>
        );
    },
}));

describe('<NoAvailableFlightsPopup />', () => {
    beforeEach(() => {
        mockProps = {
            date: '2020-12-10',
            arrAirportName: 'Siberia',
            depAirportName: 'Mali',
        };
        mockStores = createMockStores({
            amendFlightsStore: { toggleNoAvailableFlightsPopup: jest.fn() },
        });
        global.scrollTo = jest.fn();
    });

    it('should render all elements', () => {
        render(<NoAvailableFlightsPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockPopupProps).toHaveBeenCalledWith(
            expect.objectContaining({
                showCloseButton: true,
                isContentCentered: true,
                title: SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupLabelsTitle,
            }),
        );
        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(
            SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupLabelsTitle,
            {
                [Tokens.Destination]: 'Siberia',
            },
        );
        expect(Tokenizer.replaceTokens).toHaveBeenCalledWith(
            SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupLabelsDescriptionHTML,
            { [Tokens.Date]: '12/10/2020', [Tokens.Airport]: 'Mali' },
        );
        expect(screen.getAllByTestId('rich-text')).toHaveLength(2);
        expect(mockRichTextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                field: {
                    value: SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupLabelsDescriptionHTML,
                },
            }),
        );
        expect(mockRichTextProps).toHaveBeenCalledWith(
            expect.objectContaining({
                className: 'popupButtons',
                onLinkClick: expect.any(Function),
                field: {
                    value: SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupButtonsContactUsHTML,
                },
            }),
        );
        expect(screen.getAllByTestId('rich-text')[0]).toHaveTextContent(
            SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupLabelsDescriptionHTML,
        );
        expect(screen.getAllByTestId('rich-text')[1]).toHaveTextContent(
            SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupButtonsContactUsHTML,
        );
    });

    it('should call toggleNoAvailableFlightsPopup when link clicked', () => {
        render(<NoAvailableFlightsPopup {...mockProps} />);

        const link = screen.getAllByTestId('rich-text')[1];
        fireEvent.click(link);

        expect(mockStores.amendFlightsStore.toggleNoAvailableFlightsPopup).toHaveBeenCalled();
    });

    it('should NOT render description', () => {
        mockStores.layoutStore.getPhrase = jest.fn(p => {
            if (p === SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupLabelsDescriptionHTML) {
                return '';
            }

            return p;
        });

        render(<NoAvailableFlightsPopup {...mockProps} />);

        expect(
            screen.queryByText(SitecoreDictionary.AmendFlightsNoAvailableFlightsPopupLabelsDescriptionHTML),
        ).not.toBeInTheDocument();
    });
});
