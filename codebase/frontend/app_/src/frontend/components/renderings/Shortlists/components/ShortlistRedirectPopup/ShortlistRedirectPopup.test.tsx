import * as React from 'react';
import { fireEvent } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IOffer } from 'models/data/IOffer';
import { MarketCode } from 'models/data/MarketSettings';
import { ShortlistType } from 'models/enum/ShortlistType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ShortlistRedirectPopup from './ShortlistRedirectPopup';

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

const mockPopupProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: props => {
        mockPopupProps(props);

        return (
            <div data-tid='redirect-popup'>
                {props.children}
                {props.footerContent}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children }) => (
        <div data-tid='button' onClick={onClick}>
            {children}
        </div>
    ),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMockStores = () =>
    createMockStores({
        routerStore: {
            switchToNewLanguage: jest.fn(),
        },
        shortlistStore: {
            getShortlistHotelLink: jest.fn(),
        },
    });

const resetMockProps = () => ({
    bodyContent: mockSitecoreField('body content'),
    offer: {
        hotel: { name: 'test' },
        shortlist: {
            id: 'shortlistId',
            language: 'de-CH',
            marketCode: MarketCode.CH,
            type: ShortlistType.Offer,
        },
    } as IOffer,
    onClose: jest.fn(),
    onRedirect: jest.fn(),
    redirectLabel: mockSitecoreField('redirect label'),
    title: mockSitecoreField('title'),
});

let mockStores;
let mockProps;

describe('<ShortlistRedirectPopup />', () => {
    beforeEach(() => {
        mockStores = resetMockStores();
        mockProps = resetMockProps();
    });

    it('should render redirect popup', () => {
        const { container } = render(<ShortlistRedirectPopup {...mockProps} />);

        expect(container).not.toBeEmptyDOMElement();
        expect(mockPopupProps).toHaveBeenCalledWith(expect.objectContaining({ title: mockProps.title.value }));
    });

    it('should call onRedirect  & switchToNewLanguage methods with expected params when click on redirect label', () => {
        mockProps.offer.shortlist.type = ShortlistType.Hotel;
        (mockStores.shortlistStore.getShortlistHotelLink as jest.Mock).mockReturnValueOnce('hotel link');
        render(<ShortlistRedirectPopup {...mockProps} />);

        fireEvent.click(screen.getByText(mockProps.redirectLabel.value));

        expect(mockProps.onRedirect).toHaveBeenCalled();
        expect(mockStores.routerStore.switchToNewLanguage).toHaveBeenCalledWith('ch-de', 'hotel link');
    });

    it('should call onClose method', () => {
        render(<ShortlistRedirectPopup {...mockProps} />);

        fireEvent.click(screen.getByText(SitecoreDictionary.GlobalsButtonsCancel));

        expect(mockProps.onClose).toHaveBeenCalled();
    });
});
