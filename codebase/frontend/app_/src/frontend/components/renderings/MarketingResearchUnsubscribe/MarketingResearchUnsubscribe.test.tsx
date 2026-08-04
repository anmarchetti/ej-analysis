import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserService } from 'frontend/services/user.service';
import * as utils from 'frontend/utils/validation.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import MarketingResearchUnsubscribe from './MarketingResearchUnsubscribe';

jest.mock('next/router', () => ({
    useRouter: () => ({
        query: {
            email: 'email',
            encEmail: 'encEmail',
            source: 'source',
        },
    }),
}));

const createProps = () => ({
    fields: {
        Title: { value: 'title' },
        Subtitle: { value: 'subtitle' },
        UnsubscribedTitle: { value: 'unsub title' },
        UnsubscribedSubtitle: { value: 'unsub subtitle' },
        Icon: { value: { src: 'icon' } },
        UnsubscribedIcon: { value: { src: 'unsub icon' } },
        Image: { value: { src: 'image' } },
        AcceptButton: { value: 'accept' },
        DeclineButton: { value: 'decline' },
        GoHomeButton: { value: 'home' },
    },
});

const createStores = () => ({
    layoutStore: { isEditMode: false, getPhrase: jest.fn(p => p) },
    appStore: { isScreenLessMedium: false },
    routerStore: { redirectToHomePage: jest.fn() },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/JSSImage', () => () => <div data-tid='image' />);

describe('<MarketingResearchUnsubscribe />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        UserService.marketingUnsubscribe = jest.fn();
        UserService.decryptEncEmail = jest.fn(() => 'test' as any);
        jest.spyOn(utils, 'checkIfEmailValid').mockImplementation(() => true);
    });

    it('should render icon when it is not unsubscribed', async () => {
        const { getByTestId } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await waitFor(() => expect(getByTestId('image')).toBeInTheDocument());
    });

    it('should NOT render icon when it is not unsubscribed and Icon NOT provided', async () => {
        mockProps.fields.Icon = null;
        const { queryByTestId } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await waitFor(() => expect(queryByTestId('image')).not.toBeInTheDocument());
    });

    it('should render title when it is not unsubscribed', async () => {
        const { getByText } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await waitFor(() => expect(getByText('title')).toBeInTheDocument());
    });

    it('should NOT render title when it is not unsubscribed and title NOT provided', async () => {
        mockProps.fields.Title = null;
        const { queryByText } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await waitFor(() => expect(queryByText('title')).not.toBeInTheDocument());
    });

    it('should render subtitle when it is not unsubscribed', async () => {
        const { getByText } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await waitFor(() => expect(getByText('subtitle')).toBeInTheDocument());
    });

    it('should NOT render subtitle when it is not unsubscribed and subtitle NOT provided', async () => {
        mockProps.fields.Subtitle = null;
        const { queryByText } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await waitFor(() => expect(queryByText('subtitle')).not.toBeInTheDocument());
    });

    it('should render 1st button with accept text when it is not unsubscribed and accept value is provided', async () => {
        const { getAllByRole } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await waitFor(() => expect(getAllByRole('button')[0]).toHaveTextContent('accept'));
    });

    it('should render 1st button with GlobalsButtonsOK text when it is not unsubscribed and accept value is NOT provided', async () => {
        mockProps.fields.AcceptButton = null;
        const { getAllByRole } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await waitFor(() => expect(getAllByRole('button')[0]).toHaveTextContent(SitecoreDictionary.GlobalsButtonsOK));
    });

    it('should render 2nd button with decline text when it is not unsubscribed and decline value is provided', async () => {
        const { getAllByRole } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await waitFor(() => expect(getAllByRole('button')[1]).toHaveTextContent('decline'));
    });

    it('should render 2nd button with GlobalsButtonsCancel text when it is not unsubscribed and decline value is NOT provided', async () => {
        mockProps.fields.DeclineButton = null;
        const { getAllByRole } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await waitFor(() =>
            expect(getAllByRole('button')[1]).toHaveTextContent(SitecoreDictionary.GlobalsButtonsCancel),
        );
    });

    it('should call redirectToHomePage after clicking 2nd button when it is not unsubscribed', async () => {
        const { getAllByRole } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await userEvent.click(getAllByRole('button')[1]);

        await waitFor(() => expect(mockStores.routerStore.redirectToHomePage).toHaveBeenCalled());
    });

    it('should render unsub icon after clicking 1st button', async () => {
        const { getAllByRole, getByTestId } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await userEvent.click(getAllByRole('button')[0]);
        await waitFor(() => expect(getByTestId('image')).toBeInTheDocument());
    });

    it('should NOT render unsub icon after clicking 1st button when unsub icon is NOT provided', async () => {
        mockProps.fields.UnsubscribedIcon = null;
        const { getAllByRole, queryByTestId } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await userEvent.click(getAllByRole('button')[0]);
        await waitFor(() => expect(queryByTestId('image')).not.toBeInTheDocument());
    });

    it('should render unsub title after clicking 1st button', async () => {
        const { getAllByRole, getByText } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await userEvent.click(getAllByRole('button')[0]);
        await waitFor(() => expect(getByText('unsub title')).toBeInTheDocument());
    });

    it('should NOT render unsub title after clicking 1st button when unsub title is NOT provided', async () => {
        mockProps.fields.UnsubscribedTitle = null;
        const { getAllByRole, queryByText } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await userEvent.click(getAllByRole('button')[0]);
        await waitFor(() => expect(queryByText('unsub title')).not.toBeInTheDocument());
    });

    it('should render unsub subtitle after clicking 1st button', async () => {
        const { getAllByRole, getByText } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await userEvent.click(getAllByRole('button')[0]);
        await waitFor(() => expect(getByText('unsub subtitle')).toBeInTheDocument());
    });

    it('should NOT render unsub subtitle after clicking 1st button when unsub subtitle is NOT provided', async () => {
        mockProps.fields.UnsubscribedSubtitle = null;
        const { getAllByRole, queryByText } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await userEvent.click(getAllByRole('button')[0]);
        await waitFor(() => expect(queryByText('unsub subtitle')).not.toBeInTheDocument());
    });

    it('should render 1 button with go home text after clicking 1st button', async () => {
        const { getAllByRole, getByRole } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await userEvent.click(getAllByRole('button')[0]);
        await waitFor(() => expect(getByRole('button')).toHaveTextContent('home'));
    });

    it('should render 1 button with PaymentButtonsGoToTheHomePage text after clicking 1st button when go home vaslue NOT provided', async () => {
        mockProps.fields.GoHomeButton = null;
        const { getAllByRole, getByRole } = render(<MarketingResearchUnsubscribe {...mockProps} />);

        await userEvent.click(getAllByRole('button')[0]);
        await waitFor(() =>
            expect(getByRole('button')).toHaveTextContent(SitecoreDictionary.PaymentButtonsGoToTheHomePage),
        );
    });
});
