import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Anchor } from 'code/anchors';

import { IAppLinkProps, RouterLink } from './RouterLink';

const resetMocks = (): IAppLinkProps => ({
    isEditMode: false,
    link: { value: { href: 'href', text: 'text', target: '_self' } } as any,
    className: 'className',
    style: {},
    onClick: jest.fn(),
    setLoginTabActive: jest.fn(),
    replace: false,
    showOfferConditions: jest.fn(),
    title: 'title',
    dataId: 'link-id',
});

let mocks;

jest.mock('frontend/components/common/Link', () => ({ children, href }) => (
    <div data-tid='link' data-href={href}>
        {children}
    </div>
));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Link: () => <div data-tid='jss-link' />,
}));

describe('<RouterLink />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render standard link', () => {
        render(<RouterLink {...mocks} />);

        const link = screen.getByTestId('link-id');

        expect(link).toBeInTheDocument();
        expect(link.getAttribute('tabIndex')).toEqual('0');
        expect(link.getAttribute('title')).toEqual(mocks.title);
        expect(link.getAttribute('target')).toBe(mocks.link.value.target);
    });

    it('should render standard link with button role when href is empty', () => {
        mocks.link.value.href = undefined;

        render(<RouterLink {...mocks} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render JSSLink when isEditMode', () => {
        mocks.isEditMode = true;

        render(<RouterLink {...mocks} />);

        expect(screen.getByTestId('jss-link')).toBeInTheDocument();
    });

    it('should render external link', () => {
        mocks.link.value.linktype = 'external';

        render(<RouterLink {...mocks} />);

        expect(screen.getByRole('link')).toHaveAttribute('href', 'href');
    });

    it('should called func from props', async () => {
        mocks.link.value.linktype = 'external';
        mocks.link.value.url = '/test';

        render(<RouterLink {...mocks} />);

        await userEvent.click(screen.getByRole('link'));

        expect(mocks.onClick).toHaveBeenCalled();
    });

    it('should render anchor link', async () => {
        mocks.link.value.linktype = 'anchor';
        mocks.link.value.href = 'anchor-href';
        mocks.children = <div data-tid='test-children' />;

        render(<RouterLink {...mocks} />);

        expect(screen.getByRole('link')).toHaveAttribute('href', 'anchor-href');
        expect(screen.getByTestId('test-children')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('link'));

        expect(mocks.onClick).toHaveBeenCalled();
    });

    it('should change additionalFunc to showOfferConditions prop when pureHref equal with Anchor.OfferConditions', async () => {
        mocks.link.value.linktype = 'anchor';
        mocks.link.value.href = Anchor.OfferConditions;
        mocks.children = <div data-tid='test-children' />;
        mocks.title = 'title';
        mocks.showOfferConditions = jest.fn(() => 'showOfferConditions');

        render(<RouterLink {...mocks} />);

        expect(screen.getByTestId('link')).toHaveAttribute('data-href', Anchor.OfferConditions);
        expect(screen.getByTestId('test-children')).toBeInTheDocument();

        await userEvent.click(screen.getByTestId('link-id'));

        expect(mocks.onClick).toHaveBeenCalled();
        expect(mocks.showOfferConditions).toHaveBeenCalled();
    });

    it('should render replace link', () => {
        mocks.replace = true;

        render(<RouterLink {...mocks} />);

        expect(screen.getByRole('link')).toHaveAttribute('href', 'href');
    });

    it('should standard render and check props function', async () => {
        render(<RouterLink {...mocks} />);

        await userEvent.click(screen.getByTestId('link-id'));

        expect(mocks.onClick).toHaveBeenCalled();
    });

    it('should pureHref equal href from link', () => {
        mocks.link.value.href = '/login/destinations/germany?test=test';

        render(<RouterLink {...mocks} />);

        expect(screen.getByTestId('link')).toHaveAttribute('data-href', '/login/germany?test=test');
    });

    it('Should pureHref equal url from link when href NOT found', () => {
        mocks.link.value.href = undefined;
        mocks.link.value.url = '/test';

        render(<RouterLink {...mocks} />);

        expect(screen.getByTestId('link')).toHaveAttribute('data-href', '/test');
    });
});
