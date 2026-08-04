import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import ShareHolidayButtonOptions from 'models/enum/ShareHolidayButtonOptions';

import ShareHolidayButton from './ShareHolidayButton';

const getOption = (number: number) => ({
    fields: {
        Type: { value: ShareHolidayButtonOptions.Copy },
        Name: { value: `name${number}` },
        AlertMessage: { value: `alert${number}` },
        Link: { value: { href: `href${number}`, text: `text${number}`, linktype: 'internal' } },
    },
    id: `${number}`,
});

const createProps = () => ({
    fields: {
        ShareBtnEnabledInDesktop: { value: false },
        ShareBtnEnabledInMobile: { value: false },
        DesktopOptions: [getOption(1), getOption(2)],
        MobileOptions: [getOption(3), getOption(4)],
    },
});

const createStores = () =>
    createMockStores({
        bookingStore: { hotel: { name: 'hotel' }, totalPrice: 10 },
        metadataStore: { metaPageTitle: 'page' },
        layoutStore: { lang: 'en' },
        marketStore: { marketCode: 'UK' },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));

Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: () => {},
    },
});

const url = 'www.easyjet.com/en/holidays?to=17-05-2024&from=14-05-2024';
Object.defineProperty(window, 'location', {
    value: {
        href: url,
    },
    writable: true,
});

jest.mock('frontend/components/common/Callout/Callout', () => ({ children }) => (
    <div data-tid='callout'>{children}</div>
));

jest.mock('frontend/components/icons-new/Share', () => () => <div data-tid='share' />);

jest.mock('frontend/components/icons-new/InfoFilled', () => () => <div data-tid='info-filled' />);

let mockIsMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockIsMobileViewport,
}));

let mockIsMounted = true;
jest.mock('frontend/hooks/useIsMounted', () => ({
    __esModule: true,
    useIsMounted: () => mockIsMounted,
}));

describe('<ShareHolidayButton />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockIsMobileViewport = true;
        mockIsMounted = true;
    });

    it('should NOT render if fields NOT provided', () => {
        mockProps.fields = null;
        const { container } = render(<ShareHolidayButton {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render callout with share icon when screen not mobile, ShareBtnEnabledInDesktop and DesktopOptions provided', () => {
        mockProps.fields.ShareBtnEnabledInDesktop.value = true;
        mockIsMobileViewport = false;
        render(<ShareHolidayButton {...mockProps} />);

        expect(screen.getByTestId('callout')).toBeInTheDocument();
        expect(screen.getByTestId('share')).toBeInTheDocument();
    });

    it('should NOT render callout before mount', () => {
        mockProps.fields.ShareBtnEnabledInDesktop.value = true;
        mockIsMobileViewport = false;
        mockIsMounted = false;
        render(<ShareHolidayButton {...mockProps} />);

        expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
    });

    it('should NOT render callout with share icon when screen is mobile', () => {
        mockProps.fields.ShareBtnEnabledInDesktop.value = true;
        render(<ShareHolidayButton {...mockProps} />);

        expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
        expect(screen.queryByTestId('share')).not.toBeInTheDocument();
    });

    it('should NOT render callout with share icon when ShareBtnEnabledInDesktop is false', () => {
        mockIsMobileViewport = false;
        render(<ShareHolidayButton {...mockProps} />);

        expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
        expect(screen.queryByTestId('share')).not.toBeInTheDocument();
    });

    it('should NOT render callout with share icon when DesktopOptions NOT provided', () => {
        mockIsMobileViewport = false;
        mockProps.fields.ShareBtnEnabledInDesktop.value = true;
        mockProps.fields.DesktopOptions = [];
        render(<ShareHolidayButton {...mockProps} />);

        expect(screen.queryByTestId('callout')).not.toBeInTheDocument();
        expect(screen.queryByTestId('share')).not.toBeInTheDocument();
    });

    it('should render button with share icon when screen is NOT medium, ShareBtnEnabledInMobile and MobileOptions provided', () => {
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        render(<ShareHolidayButton {...mockProps} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByLabelText('share-button')).toBeInTheDocument();
        expect(screen.getByTestId('share')).toBeInTheDocument();
    });

    it('should NOT render button with share icon when screen is not mobile', () => {
        mockIsMobileViewport = false;
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        render(<ShareHolidayButton {...mockProps} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('share')).not.toBeInTheDocument();
    });

    it('should NOT render button with share icon when ShareBtnEnabledInMobile is false', () => {
        render(<ShareHolidayButton {...mockProps} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('share')).not.toBeInTheDocument();
    });

    it('should NOT render button with share icon when MobileOptions NOT provided', () => {
        mockProps.fields.MobileOptions = [];
        render(<ShareHolidayButton {...mockProps} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByTestId('share')).not.toBeInTheDocument();
    });

    it('should render popup after clicking share button when screen is NOT medium', async () => {
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        render(<ShareHolidayButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(screen.getByTestId('popup')).toBeInTheDocument();
    });

    it('should render list with 2 items after clicking share button when screen is NOT medium', async () => {
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        render(<ShareHolidayButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(screen.getByRole('list')).toBeInTheDocument();
        expect(screen.getAllByRole('listitem').length).toBe(2);
    });

    it('should render 2 new buttons when options type is Copy', async () => {
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        render(<ShareHolidayButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));

        expect(screen.getAllByRole('button').length).toBe(3);
        expect(screen.getByText('name3')).toBeInTheDocument();
        expect(screen.getByText('name4')).toBeInTheDocument();
    });

    it('should render allert after clicking copy button', async () => {
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        render(<ShareHolidayButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));
        await userEvent.click(screen.getAllByRole('button')[1]);

        expect(screen.getByText('alert3')).toBeInTheDocument();
        expect(screen.getByTestId('info-filled')).toBeInTheDocument();
    });

    it('should render SMS link when option type is SMS', async () => {
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        mockProps.fields.MobileOptions[0].fields.Type.value = ShareHolidayButtonOptions.SMS;
        const href = encodeURIComponent(
            `${url}&utm_source=easyjetholidays&utm_medium=share_icon&utm_campaign=${ShareHolidayButtonOptions.SMS}&utm_term=${mockStores.layoutStore.lang}&utm_content=${mockStores.marketStore.marketCode}`,
        );

        render(<ShareHolidayButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('link')).toHaveTextContent('name3');
        expect(screen.getByRole('link')).toHaveAttribute('href', `sms:?&body=${href}`);
    });

    it('should render facebook link when option type is facebook', async () => {
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        mockProps.fields.MobileOptions[0].fields.Type.value = ShareHolidayButtonOptions.Facebook;
        const href = encodeURIComponent(
            `${url}&utm_source=easyjetholidays&utm_medium=share_icon&utm_campaign=${ShareHolidayButtonOptions.Facebook}&utm_term=${mockStores.layoutStore.lang}&utm_content=${mockStores.marketStore.marketCode}`,
        );

        render(<ShareHolidayButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('link')).toHaveTextContent('name3');
        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            `https://www.facebook.com/sharer/sharer.php?u=${href}&display=page`,
        );
    });

    it('should render Twitter link when option type is Twitter', async () => {
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        mockProps.fields.MobileOptions[0].fields.Type.value = ShareHolidayButtonOptions.Twitter;
        const href = encodeURIComponent(
            `${url}&utm_source=easyjetholidays&utm_medium=share_icon&utm_campaign=${ShareHolidayButtonOptions.Twitter}&utm_term=${mockStores.layoutStore.lang}&utm_content=${mockStores.marketStore.marketCode}`,
        );

        render(<ShareHolidayButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('link')).toHaveTextContent('name3');
        expect(screen.getByRole('link')).toHaveAttribute('href', `https://twitter.com/share?url=${href}&title=hotel`);
    });

    it('should render email link when option type is email', async () => {
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        mockProps.fields.MobileOptions[0].fields.Type.value = ShareHolidayButtonOptions.Email;
        const href = encodeURIComponent(
            `${url}&utm_source=easyjetholidays&utm_medium=share_icon&utm_campaign=${ShareHolidayButtonOptions.Email}&utm_term=${mockStores.layoutStore.lang}&utm_content=${mockStores.marketStore.marketCode}`,
        );

        render(<ShareHolidayButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('link')).toHaveTextContent('name3');
        expect(screen.getByRole('link')).toHaveAttribute('href', `mailto:?subject=hotel&body=${href}`);
    });

    it('should render HotUKDeals link when option type is HotUKDeals', async () => {
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        mockProps.fields.MobileOptions[0].fields.Type.value = ShareHolidayButtonOptions.HotUKDeals;
        const href = encodeURIComponent(
            `${url}&utm_source=easyjetholidays&utm_medium=share_icon&utm_campaign=${ShareHolidayButtonOptions.HotUKDeals}&utm_term=${mockStores.layoutStore.lang}&utm_content=${mockStores.marketStore.marketCode}`,
        );

        render(<ShareHolidayButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('link')).toHaveTextContent('name3');
        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            `https://hotukdeals.com/social/share?title=hotel&url=${href}&style=vertical&v=2&price=10`,
        );
    });

    it('should render WhatsApp link when option type is WhatsApp', async () => {
        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        mockProps.fields.MobileOptions[0].fields.Type.value = ShareHolidayButtonOptions.WhatsApp;
        const href = encodeURIComponent(
            `${url}&utm_source=easyjetholidays&utm_medium=share_icon&utm_campaign=${ShareHolidayButtonOptions.WhatsApp}&utm_term=${mockStores.layoutStore.lang}&utm_content=${mockStores.marketStore.marketCode}`,
        );

        render(<ShareHolidayButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('link')).toHaveTextContent('name3');
        expect(screen.getByRole('link')).toHaveAttribute('href', `https://wa.me/?text=hotel%20${href}`);
    });

    it('should correctly add utm params when there is no queries in url', async () => {
        const url = 'www.easyjet.com/en/holidays';
        Object.defineProperty(window, 'location', {
            value: {
                href: url,
            },
            writable: true,
        });

        mockProps.fields.ShareBtnEnabledInMobile.value = true;
        mockProps.fields.MobileOptions[0].fields.Type.value = ShareHolidayButtonOptions.WhatsApp;
        const href = encodeURIComponent(
            `${url}?utm_source=easyjetholidays&utm_medium=share_icon&utm_campaign=${ShareHolidayButtonOptions.WhatsApp}&utm_term=${mockStores.layoutStore.lang}&utm_content=${mockStores.marketStore.marketCode}`,
        );

        render(<ShareHolidayButton {...mockProps} />);

        await userEvent.click(screen.getByRole('button'));
        expect(screen.getByRole('link')).toHaveTextContent('name3');
        expect(screen.getByRole('link')).toHaveAttribute('href', `https://wa.me/?text=hotel%20${href}`);
    });
});
