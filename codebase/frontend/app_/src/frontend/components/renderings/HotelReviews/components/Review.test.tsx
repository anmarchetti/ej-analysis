import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Review } from './Review';

describe('<Review />', () => {
    const resetMocks = () => ({
        title: 'test',
        ratingNum: 3.0,
        publishedDate: 'test',
        author: 'test',
        text: 'test',
        getPhrase: jest.fn(),
    });

    let mocks = resetMocks();

    beforeEach(() => {
        jest.restoreAllMocks();
        mocks = resetMocks();
    });

    it('should render more link', () => {
        mocks.text =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris pretium placerat tincidunt. Vivamus euismod orci sed lectus varius, ac pretium tortor placerat. Donec a ipsum ac justo lobortis lacinia quis a enim. Cras venenatis dapibus rutrum. Nunc cursus mollis lacus, vitae ultricies purus volutpat at. Aliquam porta quis mi blandit pellentesque. Nulla quis dapibus odio. Sed vitae pellentesque nibh. Nulla interdum eu neque pretium dapibus. Praesent vestibulum ornare erat, nec rhoncus lacus pulvinar ac. Nullam ornare ipsum mauris, eleifend scelerisque odio lacinia ut. Phasellus quis porttitor lacus.';

        const shortText = 'Lorem ipsum dolor sit amet';
        jest.spyOn(Review.prototype as any, 'ellipsize').mockImplementation(function (this: any) {
            this.shortReview = shortText;
        });

        const { container } = render(<Review {...mocks} />);

        expect(
            container.querySelector('.tripadvisor-review__content .tripadvisor-review__content--open'),
        ).toBeInTheDocument();
        expect(
            container.querySelector('.tripadvisor-review__content .tripadvisor-review__content--close'),
        ).not.toBeInTheDocument();
    });

    it('should NOT render class in-progress when state is NOT initial', () => {
        const { container } = render(<Review {...mocks} />);
        expect(container.querySelector('.tripadvisor-review__content .in-progress')).toBeNull();
    });

    it('should expand large comment', async () => {
        mocks.text =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris pretium placerat tincidunt. Vivamus euismod orci sed lectus varius, ac pretium tortor placerat. Donec a ipsum ac justo lobortis lacinia quis a enim. Cras venenatis dapibus rutrum. Nunc cursus mollis lacus, vitae ultricies purus volutpat at. Aliquam porta quis mi blandit pellentesque. Nulla quis dapibus odio. Sed vitae pellentesque nibh. Nulla interdum eu neque pretium dapibus. Praesent vestibulum ornare erat, nec rhoncus lacus pulvinar ac. Nullam ornare ipsum mauris, eleifend scelerisque odio lacinia ut. Phasellus quis porttitor lacus.';

        const shortText = 'Lorem ipsum dolor sit amet';
        jest.spyOn(Review.prototype as any, 'ellipsize').mockImplementation(function (this: any) {
            this.shortReview = shortText;
        });

        const { container } = render(<Review {...mocks} />);

        await waitFor(() => {
            expect(container.querySelector('.in-progress')).toBeNull();
        });

        const span = container.querySelector('.tripadvisor-review__content p span')!;
        expect(span).toBeInTheDocument();

        expect(span.textContent).toBe(shortText);

        const openLink = container.querySelector(
            '.tripadvisor-review__content .tripadvisor-review__content--open',
        ) as HTMLAnchorElement;

        await userEvent.click(openLink);

        await waitFor(() => {
            expect(span.textContent).toBe(`"${mocks.text}"`);
        });
    });

    it('should render less link after expanding', async () => {
        mocks.text =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris pretium placerat tincidunt. Vivamus euismod orci sed lectus varius, ac pretium tortor placerat. Donec a ipsum ac justo lobortis lacinia quis a enim. Cras venenatis dapibus rutrum. Nunc cursus mollis lacus, vitae ultricies purus volutpat at. Aliquam porta quis mi blandit pellentesque. Nulla quis dapibus odio. Sed vitae pellentesque nibh. Nulla interdum eu neque pretium dapibus. Praesent vestibulum ornare erat, nec rhoncus lacus pulvinar ac. Nullam ornare ipsum mauris, eleifend scelerisque odio lacinia ut. Phasellus quis porttitor lacus.';

        const shortText = 'Lorem ipsum dolor sit amet';
        jest.spyOn(Review.prototype as any, 'ellipsize').mockImplementation(function (this: any) {
            (this as any).shortReview = shortText;
        });

        const { container } = render(<Review {...mocks} />);

        await waitFor(() => {
            expect(container.querySelector('.in-progress')).toBeNull();
        });

        const openLink = container.querySelector(
            '.tripadvisor-review__content .tripadvisor-review__content--open',
        ) as HTMLAnchorElement;

        await userEvent.click(openLink);

        await waitFor(() => {
            expect(
                container.querySelector('.tripadvisor-review__content .tripadvisor-review__content--close'),
            ).toBeInTheDocument();
        });

        expect(
            container.querySelector('.tripadvisor-review__content .tripadvisor-review__content--open'),
        ).not.toBeInTheDocument();
    });

    it('should collapse back to short comment when clicking less link', async () => {
        mocks.text =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris pretium placerat tincidunt. Vivamus euismod orci sed lectus varius, ac pretium tortor placerat. Donec a ipsum ac justo lobortis lacinia quis a enim. Cras venenatis dapibus rutrum. Nunc cursus mollis lacus, vitae ultricies purus volutpat at. Aliquam porta quis mi blandit pellentesque. Nulla quis dapibus odio. Sed vitae pellentesque nibh. Nulla interdum eu neque pretium dapibus. Praesent vestibulum ornare erat, nec rhoncus lacus pulvinar ac. Nullam ornare ipsum mauris, eleifend scelerisque odio lacinia ut. Phasellus quis porttitor lacus.';

        const shortText = 'Lorem ipsum dolor sit amet';
        jest.spyOn(Review.prototype as any, 'ellipsize').mockImplementation(function (this: any) {
            (this as any).shortReview = shortText;
        });

        const { container } = render(<Review {...mocks} />);

        // Wait for initial render to settle
        await waitFor(() => {
            expect(container.querySelector('.in-progress')).toBeNull();
        });

        // Click "Read More"
        const openLink = container.querySelector(
            '.tripadvisor-review__content .tripadvisor-review__content--open',
        ) as HTMLAnchorElement;
        await userEvent.click(openLink);

        const closeLink = await waitFor(() => {
            const link = container.querySelector('.tripadvisor-review__content .tripadvisor-review__content--close');
            expect(link).toBeInTheDocument();

            return link as HTMLAnchorElement;
        });

        await userEvent.click(closeLink);

        const span = container.querySelector('.tripadvisor-review__content p span')!;
        await waitFor(() => {
            expect(span.textContent).toBe(shortText);
        });
    });

    it('should not render separator if author name is empty', () => {
        mocks.author = '';

        const { container } = render(<Review {...mocks} />);

        expect(container.querySelector('.tripadvisor-review__subheading--separator')).toBeNull();
    });
});
