import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import LogoCarouselContentCard, { ILogoCarouselContentCardProps, MAX_CONTENT_HEIGHT } from './LogoCarouselContentCard';

const createProps = (): ILogoCarouselContentCardProps => ({
    title: mockSitecoreField('title'),
    description: mockSitecoreField('description'),
});

const mockRichTextWithLinks = jest.fn();
const mockShowMoreButton = jest.fn();
let props;

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

jest.mock('frontend/components/common/ShowMoreButton', () => ({
    __esModule: true,
    default: props => {
        mockShowMoreButton(props);

        return <button onClick={() => props.onClick()} />;
    },
}));

describe('<LogoCarouselContentCard />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should standard render', () => {
        render(<LogoCarouselContentCard {...props} />);

        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(props.title.value);
        expect(mockRichTextWithLinks).toHaveBeenCalledWith(
            expect.objectContaining({
                field: props.description,
            }),
        );

        expect(screen.getByTestId('logo-carousel-content-card')).not.toHaveAttribute('style');
        expect(mockShowMoreButton).not.toHaveBeenCalled();
    });

    it('should not description when it is undefined in sitecore', () => {
        props.description = undefined;

        render(<LogoCarouselContentCard {...props} />);

        expect(mockRichTextWithLinks).not.toHaveBeenCalled();
    });

    describe('variant with a read more button', () => {
        beforeEach(() => {
            props.isExpandable = true;
            props.readMoreButtonText = mockSitecoreField('read more');
            props.readLessButtonText = mockSitecoreField('read less');

            Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
                configurable: true,
                value: MAX_CONTENT_HEIGHT + 1,
            });
        });

        it('should contain a button when the content is expandable', () => {
            render(<LogoCarouselContentCard {...props} />);

            expect(screen.getByRole('button')).toBeInTheDocument();
            expect(mockShowMoreButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isChevronUp: false,
                    title: props.readMoreButtonText.value,
                    dataTid: 'logo-carousel-card-read-more-btn',
                }),
            );

            expect(screen.getByTestId('logo-carousel-content-card')).toHaveAttribute('style');
        });

        it('should expand content on button click', async () => {
            render(<LogoCarouselContentCard {...props} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockShowMoreButton).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    isChevronUp: false,
                    title: props.readMoreButtonText.value,
                }),
            );

            expect(mockShowMoreButton).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    isChevronUp: true,
                    title: props.readLessButtonText.value,
                }),
            );
        });

        it('should NOT display a button when there is no button text', () => {
            props.readLessButtonText = undefined;

            render(<LogoCarouselContentCard {...props} />);

            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });

        it('should NOT display a button when height of container is shorter than const height value', () => {
            Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
                configurable: true,
                value: MAX_CONTENT_HEIGHT - 1,
            });

            render(<LogoCarouselContentCard {...props} />);

            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });
    });
});
