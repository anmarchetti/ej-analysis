import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { ILoginInfo } from 'models/data/ILoginInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ViewBookingsBanner } from './ViewBookingsBanner';

jest.mock('frontend/utils/tokenizer', () => ({ Tokenizer: { replaceToken: mockReplaceToken } }));

const mockRichTextDictionaryComponent = jest.fn();
jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: props => {
        mockRichTextDictionaryComponent(props);

        return <div data-tid='rich-text-dictionary'>{props.content}</div>;
    },
}));

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    userStore: { userData: null as Nullable<ILoginInfo>, setUserDetails: jest.fn() },
});

const createProps = () => ({
    imageUrl: 'bannerUrl',
    isTriangleGrey: false,
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ViewBookingsBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render', () => {
        render(<ViewBookingsBanner {...mockProps} />);

        expect(mockRichTextDictionaryComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                tag: 'h2',
                content: expect.stringContaining(SitecoreDictionary.ViewBookingsTitlesWelcomeBack),
            }),
        );
    });

    it('should render user data', () => {
        mockStores.userStore.userData = { email: 'user@email.com', firstName: 'User Name' } as ILoginInfo;
        render(<ViewBookingsBanner {...mockProps} />);

        expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('user@email.com');
    });

    it('should render triangle grey', () => {
        mockProps.isTriangleGrey = true;
        render(<ViewBookingsBanner {...mockProps} />);

        expect(mockRichTextDictionaryComponent).toHaveBeenCalled();
    });

    it('should not render background image', () => {
        delete (mockProps as any).imageUrl;
        render(<ViewBookingsBanner {...mockProps} />);

        expect(mockRichTextDictionaryComponent).toHaveBeenCalled();
    });
});
