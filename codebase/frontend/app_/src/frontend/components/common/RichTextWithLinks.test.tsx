import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { RichTextWithLinks } from './RichTextWithLinks';

const resetMocks = (customMocks = {}) =>
    ({
        field: mockSitecoreField('<a href="/en/holidays/spain/barcelona">Barcelona</a>'),
        className: 'custom',
        tag: 'span',
        dataId: 'RichText',
        onLinkClick: jest.fn(),
        ...customMocks,
    } as any);

const createStores = () => ({
    layoutStore: {
        isEditMode: false,
        basePath: '/en/holidays',
    },
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
    routerStore: {
        redirectTo: jest.fn(),
    },
});

let mockStores;
let props = resetMocks();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    RichText: ({ className, ...props }) => <div className={className} data-tid={`${props['data-tid']}-mock`} />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RichTextWithLinks />', () => {
    beforeEach(() => {
        mockStores = createStores();
        props = resetMocks();
    });

    it('should standard render RichText', () => {
        props = resetMocks({ field: { value: "id='fieldId'" } });
        render(<RichTextWithLinks {...props} />);

        const container = screen.getByTestId(props.dataId);
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass(props.className);
    });

    it('should render custom container', () => {
        render(<RichTextWithLinks {...props} />);

        const container = screen.getByTestId(props.dataId);
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass(props.className);
    });

    it('should convert internal absolute link to relative', () => {
        props = resetMocks({
            field: { value: '<a href="https://www.easyjet.com/en/holidays/spain/barcelona">Barcelona</a>' },
        });
        render(<RichTextWithLinks {...props} />);

        expect(screen.getByRole('link')).toHaveAttribute('href', '/en/holidays/spain/barcelona');
    });

    it('should add/remove EventListener on mount/unmount when isEditMode is false', () => {
        const addEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'removeEventListener');
        const { unmount } = render(<RichTextWithLinks {...props} />);

        expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });

    it('should not add/remove EventListener on mount/unmount when isEditMode is true', () => {
        mockStores.layoutStore.isEditMode = true;
        const addEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'removeEventListener');
        const { unmount } = render(<RichTextWithLinks {...props} />);

        expect(addEventListenerSpy).not.toBeCalledWith('click', expect.any(Function));

        unmount();

        expect(removeEventListenerSpy).not.toBeCalledWith('click', expect.any(Function));

        addEventListenerSpy.mockRestore();
    });

    it('should convert link to link without href with button role when useEmptyLink is true', () => {
        props = resetMocks({
            field: { value: '<a href="#">Barcelona</a>' },
            useEmptyLink: true,
        });
        render(<RichTextWithLinks {...props} />);

        expect(screen.getByRole('button')).not.toHaveAttribute('href');
    });

    describe('onLinkClick', () => {
        it('should call onLinkClick and call redirectTo()', async () => {
            render(<RichTextWithLinks {...props} />);

            await userEvent.click(screen.getByRole('link'));

            expect(props.onLinkClick).toHaveBeenCalled();
            expect(mockStores.routerStore.redirectTo).toHaveBeenCalled();
        });

        it('Should NOT call redirectTo() if onLinkClick prevents event', async () => {
            props = resetMocks({ onLinkClick: jest.fn(e => e.preventDefault()) });
            render(<RichTextWithLinks {...props} />);

            await userEvent.click(screen.getByRole('link'));

            expect(props.onLinkClick).toHaveBeenCalled();
            expect(mockStores.routerStore.redirectTo).not.toHaveBeenCalled();
        });
    });

    describe('disableLinkFocus', () => {
        it('should set tabIndex equal to -1 when disableLinkFocus is true', () => {
            props.disableLinkFocus = true;
            render(<RichTextWithLinks {...props} />);

            expect(screen.getByRole('link')).toHaveAttribute('tabindex', '-1');
        });

        it('should set tabIndex equal to 0 when disableLinkFocus is false', () => {
            props.disableLinkFocus = false;
            render(<RichTextWithLinks {...props} />);

            expect(screen.getByRole('link')).toHaveAttribute('tabindex', '0');
        });
    });
});
