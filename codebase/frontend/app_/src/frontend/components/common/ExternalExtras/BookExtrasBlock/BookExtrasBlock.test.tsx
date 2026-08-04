import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import BookExtrasBlock, { IBookExtrasBlockProps } from './BookExtrasBlock';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => (
    <div data-tid='extras-block-description'>{field.value}</div>
));

const mockJSSImageNext = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    default: props => {
        mockJSSImageNext(props);

        return <div data-tid='jss-image-next' />;
    },
}));

describe('<BookExtrasBlock />', () => {
    const mockOnClick = jest.fn();
    const createProps = (): IBookExtrasBlockProps => ({
        description: mockSitecoreField('Description'),
        title: 'Gatwick Airport Parking',
        bannerImage: mockSitecoreField(mockSitecoreImageField('Image')),
        buttonText: mockSitecoreField('ButtonText'),
        promoBanner: <div data-tid='promo-banner' />,
        onClick: mockOnClick,
    });

    let props = createProps();

    beforeEach(() => {
        props = createProps();
    });

    it('should render book extras block with fields', () => {
        render(<BookExtrasBlock {...props} />);

        expect(screen.getByTestId('extras-block-desktop-title')).toBeInTheDocument();
        expect(screen.getByTestId('extras-block-desktop-title')).toHaveClass('d-none d-sm-block');
        expect(screen.getByTestId('extras-block-mobile-title')).toBeInTheDocument();
        expect(screen.getByTestId('extras-block-mobile-title')).toHaveClass('d-sm-none');
        expect(screen.getByTestId('extras-block-description')).toHaveTextContent(props.description.value);
        expect(screen.getByTestId('jss-image-next')).toBeInTheDocument();
        expect(screen.getByTestId('promo-banner')).toBeInTheDocument();
        expect(mockJSSImageNext).toHaveBeenCalledWith({
            field: props.bannerImage,
            fill: true,
        });
    });

    it('should call OnClick when button is clicked', async () => {
        render(<BookExtrasBlock {...props} />);

        await userEvent.click(screen.getByTestId('buy-now-button'));

        expect(mockOnClick).toHaveBeenCalled();
    });
});
