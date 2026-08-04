import React from 'react';
import { render, screen } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { Tokenizer } from 'frontend/utils/tokenizer';

import GreatNewsBanner from './GreatNewsBanner';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <p data-tid='text'>{field.value}</p>);

jest.mock('frontend/components/common/JSSImage', () => ({ field }) => (
    <img src={field.value.src} alt={field.value.alt} />
));

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

const createProps = () => ({
    fields: {
        TitleGreatNewsBanner: { value: 'Banner Title' },
        TextGreatNewsBanner: { value: 'Banner Text...' },
        IconGreatNewsBanner: { value: { src: 'image-url', alt: 'image-alt' } },
    },
});
const createStores = () => ({
    userStore: { userData: null },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<GreatNewsBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render Banner', () => {
        render(<GreatNewsBanner {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent('Banner Title');
        expect(screen.getByText('Banner Text...')).toBeInTheDocument();
        expect(screen.getByAltText('image-alt')).toBeInTheDocument();
    });

    it('should render text with email', () => {
        mockStores.userStore.userData = { email: 'email@test.com' } as any;

        render(<GreatNewsBanner {...mockProps} />);

        expect(Tokenizer.replaceToken).toHaveBeenCalledWith('Banner Text...', Tokens.Email, 'email@test.com');
        expect(screen.getByText('Banner Text... email@test.com')).toBeInTheDocument();
    });

    it('should NOT render text', () => {
        mockProps.fields.TextGreatNewsBanner = null;

        render(<GreatNewsBanner {...mockProps} />);

        expect(screen.queryByTestId('text')).toBeNull();
    });

    it('should NOT render title', () => {
        mockProps.fields.TitleGreatNewsBanner = null;

        render(<GreatNewsBanner {...mockProps} />);

        expect(screen.queryByRole('heading')).toBeNull();
    });

    it('should NOT render icon', () => {
        mockProps.fields.IconGreatNewsBanner = null;

        render(<GreatNewsBanner {...mockProps} />);

        expect(screen.queryByAltText('image-alt')).toBeNull();
    });
});
