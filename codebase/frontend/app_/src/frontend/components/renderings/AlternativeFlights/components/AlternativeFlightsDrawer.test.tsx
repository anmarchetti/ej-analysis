import React from 'react';
import { render } from '@testing-library/react';
import { observable } from 'mobx';

import { AlternativeFlightsDrawer } from './AlternativeFlightsDrawer';

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    formatDateL10n: jest.fn(),
}));

const mockDrawerPropsCall = jest.fn();
jest.mock('frontend/components/common/Drawer', () => (props: any) => {
    mockDrawerPropsCall(props);

    return <div data-tid='drawer'>{props.children}</div>;
});

const mockButtonPropsCall = jest.fn();
jest.mock('frontend/components/common/Button', () => (props: any) => {
    mockButtonPropsCall(props);

    return <div data-tid={props.dataTid}>{props.children}</div>;
});

const mockFlightCardPropsCall = jest.fn();
jest.mock('./FlightCard', () => (props: any) => {
    mockFlightCardPropsCall(props);

    return <div data-tid='alt-flight-card' />;
});

const mockAltFlightsListPropsCall = jest.fn();
jest.mock('./AlternativeFlightsList', () => (props: any) => {
    mockAltFlightsListPropsCall(props);

    return <div data-tid='alt-flights-list' />;
});

const transportMock = {
    routes: observable([
        {
            id: '170430/2979',
            cycDate: '2019-08-22',
            depPt: 'LGW',
            arrPt: 'PMI',
            arrDate: '2019-08-22T14:00:00',
            routeCd: 'PMILGW4ALGWPMI',
            avail: 177,
            fltNo: 'EZY791',
            car: 'EZY',
            direction: 'outbound',
            depDate: '2019-08-22T11:30:00',
            arrName: 'arrName',
            depName: 'depName',
        },
        {
            id: '170430/2978',
            cycDate: '2019-08-22',
            depPt: 'LGW',
            arrPt: 'PMI',
            arrDate: '2019-08-22T14:00:00',
            routeCd: 'PMILGW4ALGWPMI',
            avail: 177,
            fltNo: 'EZY791',
            car: 'EZY',
            direction: 'inbound',
            depDate: '2019-08-22T11:30:00',
            arrName: 'arrName',
            depName: 'depName',
        },
    ]),
};

const offerMock = {
    pricePP: 100,
    accom: {
        code: 'test',
        packageId: 'packageId',
        date: '2020-02-05T00:00:00',
        unit: [],
    },
    date: '2020-02-05T00:00:00',
    transport: transportMock,
} as any;

const renderWithRef = (props: any) => {
    const ref = React.createRef<AlternativeFlightsDrawer>();
    const utils = render(<AlternativeFlightsDrawer ref={ref} {...props} />);

    return { ...utils, ref };
};

describe('<AlternativeFlightsDrawer />', () => {
    const resetMocks = () =>
        ({
            isExpanded: false,

            drawerRef: [<div key='drawerRef' />],
            showLessMobileRef: [<div key='showLessMobileRef' />],
            showMoreRef: [<div key='showMoreRef' />],

            isShowMoreVisible: false,
            isShowLessVisible: false,

            isLoadingOffer: false,

            selectedOffer: {
                pricePP: 100,
                transport: transportMock,
                date: '2020-02-05T00:00:00',
                accom: {
                    unit: [],
                },
            },
            paginatedFlights: [offerMock],
            sortedFlights: [offerMock],
            isFlightSelected: jest.fn(),

            onClickSelect: jest.fn(),
            onClickShowMore: jest.fn(),
            onClickShowLess: jest.fn(),
            onCancelChanges: jest.fn(),
            onConfirmChanges: jest.fn(),

            nextFlightRef: [<div key='nextFlightRef' />],
            nextFlightIndex: 0,
            getPhrase: jest.fn(),

            alterativeFlightsDate: '2020-02-05T00:00:00',
            currentOfferPP: 100,
            priceGraphPopupVisible: false,
        } as any);

    let props = resetMocks();

    beforeEach(() => {
        props = resetMocks();
    });

    it('should render via Drawer and pass correct props', () => {
        render(<AlternativeFlightsDrawer {...props} />);

        expect(mockDrawerPropsCall).toHaveBeenCalled();
        const drawerProps = mockDrawerPropsCall.mock.calls[0][0];

        expect(drawerProps.open).toBe(false);
        expect(drawerProps.containerRef).toBe(props.drawerRef);
        expect(drawerProps.className).toContain('alternative-flights-drawer');

        expect(mockFlightCardPropsCall).toHaveBeenCalled();
        expect(mockAltFlightsListPropsCall).toHaveBeenCalled();

        const listProps = mockAltFlightsListPropsCall.mock.calls[0][0];
        expect(listProps.isShowMoreVisible).toBe(props.isShowMoreVisible);
        expect(listProps.isShowLessVisible).toBe(props.isShowLessVisible);
        expect(listProps.onClickShowMore).toBe(props.onClickShowMore);
        expect(listProps.onClickShowLess).toBe(props.onClickShowLess);
    });

    it('should call onCancelChanges when cancel Button onClick is triggered', () => {
        render(<AlternativeFlightsDrawer {...props} />);

        const cancelBtnProps = mockButtonPropsCall.mock.calls.find(call => call[0]?.dataTid === 'cancel-btn')?.[0];

        expect(cancelBtnProps).toBeTruthy();
        cancelBtnProps.onClick?.({} as any);

        expect(props.onCancelChanges).toHaveBeenCalled();
    });

    it('should set initialOffer when opening', () => {
        const { ref, rerender } = renderWithRef(props);

        expect((ref.current as any).initialOffer).toBeUndefined();

        rerender(<AlternativeFlightsDrawer ref={ref} {...props} isExpanded />);

        expect((ref.current as any).initialOffer).toEqual(props.selectedOffer);
    });

    it('should have initialOffer defined after setting isExpanded=true', () => {
        const { ref, rerender } = renderWithRef(props);

        expect((ref.current as any).initialOffer).toBeUndefined();

        rerender(<AlternativeFlightsDrawer ref={ref} {...props} isExpanded />);

        expect((ref.current as any).initialOffer).toBeDefined();
    });
});
