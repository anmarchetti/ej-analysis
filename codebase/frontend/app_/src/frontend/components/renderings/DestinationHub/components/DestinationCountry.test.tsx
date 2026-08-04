import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockIntersectionObserver } from 'frontend/__mocks__';

import DestinationCountry from './DestinationCountry';

const createProps = regions => ({
    anchors: [],
    country: {
        Regions: regions,
        Name: 'country1',
    },
    nextCountry: {},
    icon: 'icon',
    isScrollDown: jest.fn(),
    onSetLetter: jest.fn(),
});

mockIntersectionObserver();

let mockProps;
let mockPropsTreeRegions;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/common/Link', () => ({ children }) => <div data-tid='link'>{children}</div>);

describe('<DestinationCountry />', () => {
    beforeEach(() => {
        mockProps = createProps([
            { Code: 'code1', Id: 'id1', Name: 'name1', Url: 'url1' },
            { Code: 'code2', Id: 'id2', Name: 'name2', Url: 'url2' },
        ]);
        mockPropsTreeRegions = createProps([
            { Code: 'code1', Id: 'id1', Name: 'name1', Url: 'url1' },
            { Code: 'code2', Id: 'id2', Name: 'name2', Url: 'url2' },
            { Code: 'code3', Id: 'id3', Name: 'name3', Url: 'url3' },
        ]);
    });

    it('should render icon', () => {
        render(<DestinationCountry {...mockProps} />);
        expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('should NOT render icon when icon not provided', () => {
        render(<DestinationCountry {...{ ...mockProps, icon: null }} />);
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should render 3 links', () => {
        render(<DestinationCountry {...mockProps} />);
        expect(screen.getAllByTestId('link').length).toBe(3);
    });

    it('should render country name in the first link', () => {
        render(<DestinationCountry {...mockProps} />);
        expect(screen.getAllByTestId('link')[0]).toHaveTextContent('country1');
    });

    it('should render regions name in list links', () => {
        render(<DestinationCountry {...mockProps} />);
        const links = screen.getAllByTestId('link');
        expect(links[1]).toHaveTextContent('name1');
        expect(links[2]).toHaveTextContent('name2');
    });

    it('should NOT render list links when regions NOT provided', () => {
        render(<DestinationCountry {...(createProps([]) as any)} />);
        expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    it('should render 2 list links', () => {
        render(<DestinationCountry {...mockProps} />);
        expect(screen.getAllByRole('listitem').length).toBe(2);
    });

    it('should render 3 list links', () => {
        render(<DestinationCountry {...mockPropsTreeRegions} />);
        expect(screen.getAllByRole('listitem').length).toBe(3);
    });

    it('should render 2 list links with flex-grid class', () => {
        render(<DestinationCountry {...mockProps} />);
        const list = screen.getByTestId('destinations-region-list');
        expect(list).toHaveClass('destinations-list-item__children-flex-grid');
        expect(list).not.toHaveClass('destinations-list-item__children');
    });

    it('should render 3 list links with no flex-grid class', () => {
        render(<DestinationCountry {...mockPropsTreeRegions} />);
        const list = screen.getByTestId('destinations-region-list');
        expect(list).toHaveClass('destinations-list-item__children');
        expect(list).not.toHaveClass('destinations-list-item__children-flex-grid');
    });
});
