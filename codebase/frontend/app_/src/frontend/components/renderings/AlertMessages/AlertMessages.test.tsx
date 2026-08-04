import React from 'react';
import { render, screen } from '@testing-library/react';

import AlertMessages from './AlertMessages';

const createProps = () => ({
    fields: {
        Links: [
            {
                fields: {
                    Anchor: {
                        value: 'first',
                    },
                    Link: {
                        value: 'New COVID-19 Restrictions in Portugal',
                    },
                },
                id: '1',
            },
        ],
        Title: {
            value: 'Information update',
        },
    },
    appStore: { setAlertActiveTab: jest.fn(p => p), alertInfoLoaded: true },
    trackingStore: {
        trackEventWithParams: jest.fn(),
    },
});

const mocks = createProps();

let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mocks,
}));

describe('<AlertMessages />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Should not render AlertMessages if no fields', () => {
        props.fields = null;
        const { container } = render(<AlertMessages {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render component', () => {
        render(<AlertMessages {...props} />);

        expect(screen.getByTestId('alert-messages')).toBeInTheDocument();
        expect(screen.getByText('Information update')).toBeInTheDocument();
        expect(screen.getByText('New COVID-19 Restrictions in Portugal')).toBeInTheDocument();
    });

    it('Should not render AlertMessages block if no Anchor and Link text', () => {
        props.fields.Links = null;

        const { container } = render(<AlertMessages {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should not render Title', () => {
        props.fields.Title = null;

        render(<AlertMessages {...props} />);

        expect(screen.queryByText('Information update')).not.toBeInTheDocument();
    });

    it('Should call setAlertActiveTab and trackEventWithParams on a link click', () => {
        render(<AlertMessages {...props} />);

        const link = screen.getByText('New COVID-19 Restrictions in Portugal');
        link.click();

        expect(mocks.appStore.setAlertActiveTab).toHaveBeenCalledWith('first');
        expect(mocks.trackingStore.trackEventWithParams).toHaveBeenCalled();
    });
});
