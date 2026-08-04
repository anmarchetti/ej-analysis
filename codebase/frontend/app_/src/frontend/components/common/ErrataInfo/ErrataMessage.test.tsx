import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';

import { ErrataMessage } from './ErrataMessage';
import * as utils from './ErrataMessage.utils';

const observer = {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
};
global.ResizeObserver = jest.fn().mockImplementation(() => observer);

const createProps = () => ({
    errataInfo: ['item-1', 'item-2', 'item-3'],
    flightErratas: ['errataFlight-1', 'errataFlight-2', 'errataFlight-3'],
});

const createSettings = () => ({
    [SiteSettings.ErrataTitle]: 'ErrataTitle',
    [SiteSettings.ErrataIcon]: 'icon-info.svg',
    [SiteSettings.ErrataFlightTitle]: 'ErrataFlightTitle',
    [SiteSettings.ErrataFlightIcon]: 'icon-flight.svg',
});
let settings = createSettings();

const createStores = () => ({
    layoutStore: {
        isErrataEnabled: true,
        isFacilityErrataEnabled: true,
        getSetting: jest.fn(key => settings[key]),
        getPhrase: jest.fn(p => p),
    },
    bookingStore: {
        facilityErratas: [] as string[],
    },
});

let props;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const useReadMoreButtonSpy = jest.spyOn(utils, 'default').mockReturnValue({
    isExpanded: false,
    isButtonRendered: false,
    onClick: jest.fn(),
});

describe('<ErrataMessage />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
        settings = createSettings();
    });

    it('should render null if isErrataEnabled is false', () => {
        mockStores.layoutStore.isErrataEnabled = false;

        const { container } = render(<ErrataMessage {...props} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render null if all errata lists are effectively empty', () => {
        props.errataInfo = [];
        props.flightErratas = [];
        mockStores.bookingStore.facilityErratas = [];
        mockStores.layoutStore.isErrataEnabled = true;

        const { container } = render(<ErrataMessage {...props} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render only errataInfo when provided (single item)', () => {
        const singleInfo = ['Single Info <strong>HTML</strong>'];
        props.flightErratas = [];
        props.errataInfo = singleInfo;

        render(<ErrataMessage {...props} />);

        expect(screen.getByText('ErrataTitle')).toBeInTheDocument();
        expect(document.querySelector('.errata-message__icon')).toBeInTheDocument();
        expect(screen.getByText('HTML', { exact: false })).toBeInTheDocument();
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
        expect(screen.queryByText('ErrataFlightTitle')).not.toBeInTheDocument();
    });

    it('should render both errataInfo and flightErratas titles when both have single items', () => {
        props.errataInfo = ['Info HTML content'];
        props.flightErratas = ['Flight HTML content'];

        render(<ErrataMessage {...props} />);

        expect(screen.getByText('ErrataTitle')).toBeInTheDocument();
        expect(document.querySelector('.errata-message__icon[style*="icon-info.svg"]')).toBeInTheDocument();
        expect(screen.getByText('Info HTML content')).toBeInTheDocument();

        expect(screen.getByText('ErrataFlightTitle')).toBeInTheDocument();
        expect(document.querySelector('.errata-message__icon[style*="icon-flight.svg"]')).toBeInTheDocument();
        expect(screen.getByText('Flight HTML content')).toBeInTheDocument();

        expect(screen.queryAllByRole('list')).toHaveLength(0);
    });

    it('should render errataInfo as a list (multiple items) and single flightErrata', () => {
        const infoItems = ['Info Item 1', 'Info Item 2'];
        const flightItem = ['Flight Item X'];

        props.flightErratas = flightItem;
        props.errataInfo = infoItems;

        render(<ErrataMessage {...props} />);

        expect(screen.getByText('ErrataTitle')).toBeInTheDocument();
        const infoSection = screen.getByText('ErrataTitle').closest('.errata-message');
        const infoLIs = Array.from(infoSection!.querySelectorAll('li'));
        expect(infoLIs.length).toBe(2);
        expect(infoLIs[0]).toHaveTextContent('Info Item 1');
        expect(infoLIs[1]).toHaveTextContent('Info Item 2');

        expect(screen.getByText('ErrataFlightTitle')).toBeInTheDocument();
        expect(screen.getByText('Flight Item X')).toBeInTheDocument();
        const flightSection = screen.getByText('ErrataFlightTitle').closest('.errata-message');
        expect(flightSection!.querySelector('ul')).toBeNull();
    });

    it('should render single errataInfo and flightErratas as a list (multiple items)', () => {
        const infoItem = ['Info Item Y'];
        const flightItems = ['Flight Item 1', 'Flight Item 2', 'Flight Item 3'];

        props.flightErratas = flightItems;
        props.errataInfo = infoItem;

        render(<ErrataMessage {...props} />);

        expect(screen.getByText('ErrataTitle')).toBeInTheDocument();
        expect(screen.getByText('Info Item Y')).toBeInTheDocument();
        const infoSection = screen.getByText('ErrataTitle').closest('.errata-message');
        expect(infoSection!.querySelector('ul')).toBeNull();

        expect(screen.getByText('ErrataFlightTitle')).toBeInTheDocument();
        const flightSection = screen.getByText('ErrataFlightTitle').closest('.errata-message');
        const flightLIs = Array.from(flightSection!.querySelectorAll('li'));
        expect(flightLIs.length).toBe(3);
        expect(flightLIs[0]).toHaveTextContent('Flight Item 1');
        expect(flightLIs[1]).toHaveTextContent('Flight Item 2');
        expect(flightLIs[2]).toHaveTextContent('Flight Item 3');
    });

    it('should render both errataInfo and flightErratas as lists with correct total list items', () => {
        const infoItems = ['Info A', 'Info B'];
        const flightItems = ['Flight X', 'Flight Y', 'Flight Z'];

        props.flightErratas = flightItems;
        props.errataInfo = infoItems;

        render(<ErrataMessage {...props} />);

        expect(screen.getAllByRole('list')).toHaveLength(2);
        expect(screen.getAllByRole('listitem')).toHaveLength(infoItems.length + flightItems.length);
    });

    describe('useReadMoreButton', () => {
        it('should render button when isButtonRendered is true', () => {
            useReadMoreButtonSpy.mockReturnValueOnce({
                isButtonRendered: true,
                isExpanded: false,
                onClick: jest.fn(),
            });

            const { container } = render(<ErrataMessage {...props} />);

            expect(container.getElementsByClassName('expanded')).toHaveLength(0);
            expect(screen.getByTestId('errata-read-more-button')).toBeInTheDocument();
            expect(screen.getByText(SitecoreDictionary.GlobalsButtonsReadMore)).toBeInTheDocument();
        });

        it('should NOT render button when isButtonRendered is false', () => {
            render(<ErrataMessage {...props} />);

            expect(screen.queryByTestId('errata-read-more-button')).toBeNull();
        });

        it('should add expanded class to wrapper when isExpanded is true', () => {
            useReadMoreButtonSpy.mockReturnValueOnce({
                isButtonRendered: true,
                isExpanded: true,
                onClick: jest.fn(),
            });

            const { container } = render(<ErrataMessage {...props} />);

            expect(container.getElementsByClassName('expanded')).toHaveLength(1);
            expect(screen.getByText(SitecoreDictionary.GlobalsButtonsReadLess)).toBeInTheDocument();
        });
    });
});
