import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import BannerCTAType from 'models/enum/banners/CTAType';

import CountdownWithinLightboxBanner from './CountdownWithinLightboxBanner';

const createProps = () => ({
    time: [{ value: 1, label: 'time' }],
    fields: {
        Title: { value: 'title' },
        Subtitle: { value: 'subtitle' },
        Brightness: { value: 'Dark' },
        CountdownLabel: { value: 'countdown' },
        TextColor: { value: 'Orange' },
        CTA: { value: { href: 'CTAhref', text: 'CTA' } },
        CTAType: BannerCTAType.Orange,
        UseCode: { value: 'code' },
        AdditionalInfo: { value: 'info' },
        UseCodeLabel: { value: 'label' },
    },
    isLower: false,
    backgroundStyles: [],
    singleSlide: false,
    onClickButton: jest.fn(),
    onClickComponent: jest.fn(),
});

const createStores = () => ({
    layoutStore: {},
    routerStore: {},
    appStore: {},
    queryParamStore: {},
    userStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./Countdown', () => () => <div data-tid='countdown' />);

jest.mock('frontend/components/common/CreditAnchor/CreditAnchor', () => () => <div data-tid='anchor' />);

describe('<CountdownWithinLightboxBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should return null when fields is not defined', () => {
        mockProps.fields = null;
        const { container } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render dark brightness when BannerBrightnessType.Dark', () => {
        const { container } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(container.getElementsByClassName('brightness-dark').length).toBe(1);
    });

    it('should render medium brightness when BannerBrightnessType.Medium', () => {
        mockProps.fields.Brightness.value = 'Medium';
        const { container } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(container.getElementsByClassName('brightness-medium').length).toBe(1);
    });

    it('should render low when isLower', () => {
        mockProps.isLower = true;
        const { container } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(container.getElementsByClassName('low').length).toBe(1);
    });

    it('should call onClickComponent after clicking component', () => {
        const { container } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        fireEvent.click(container.getElementsByClassName('brightness-dark')[0]);
        expect(mockProps.onClickComponent).toHaveBeenCalled();
    });

    it('should render orange text color when text color value is orange', () => {
        const { container } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(container.getElementsByClassName('text-color--orange').length).toBe(1);
    });

    it('should render black text color when text color value is black', () => {
        mockProps.fields.TextColor.value = 'Black';
        const { container } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(container.getElementsByClassName('text-color--black').length).toBe(1);
    });

    it('should render grey text color when text color value is grey', () => {
        mockProps.fields.TextColor.value = 'Grey';
        const { container } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(container.getElementsByClassName('text-color--grey').length).toBe(1);
    });

    it('should render white text color when text color value is white', () => {
        mockProps.fields.TextColor.value = 'White';
        const { container } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(container.getElementsByClassName('text-color--white').length).toBe(1);
    });

    it('should render single slide', () => {
        mockProps.singleSlide = true;
        const { container } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(container.getElementsByClassName('single-slide').length).toBe(1);
    });

    it('should render title', () => {
        const { getByRole } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('title');
    });

    it('should NOT render title when title NOT provided', () => {
        mockProps.fields.Title = null;
        const { queryByRole } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should NOT render countdown-banner__subtitle when subtitle NOT provided', () => {
        mockProps.fields.Subtitle = null;
        const { container } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(container.getElementsByClassName('countdown-banner__subtitle').length).toBe(0);
    });

    it('should render subtitle', () => {
        const { getByText } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(getByText('subtitle')).toBeInTheDocument();
    });

    it('should render countdown label', () => {
        const { getByText } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(getByText('countdown')).toBeInTheDocument();
    });

    it('should NOT render countdown label when label NOT provided', () => {
        mockProps.fields.CountdownLabel = null;
        const { queryByText } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(queryByText('countdown')).not.toBeInTheDocument();
    });

    it('should render countdown component', () => {
        const { getByTestId } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(getByTestId('countdown')).toBeInTheDocument();
    });

    it('should render CTA', () => {
        const { getByRole } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(getByRole('link')).toHaveTextContent('CTA');
    });

    it('should NOT render CTA when href NOT provided', () => {
        mockProps.fields.CTA.value.href = null;
        const { queryByRole } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(queryByRole('link')).not.toBeInTheDocument();
    });

    it('should render credit anchor', () => {
        const { getByTestId } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(getByTestId('anchor')).toBeInTheDocument();
    });

    it('should render additional info', () => {
        const { getByText } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(getByText('info')).toBeInTheDocument();
    });

    it('should NOT render additional info when additional info NOT provided', () => {
        mockProps.fields.AdditionalInfo = null;
        const { queryByText } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(queryByText('info')).not.toBeInTheDocument();
    });

    it('should render use code label', () => {
        const { getByText } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(getByText('label')).toBeInTheDocument();
    });

    it('should render code', () => {
        const { getByText } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(getByText('code')).toBeInTheDocument();
    });

    it('should NOT render use code label and code when use code label NOT provided', () => {
        mockProps.fields.UseCodeLabel = null;
        const { queryByText } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(queryByText('label')).not.toBeInTheDocument();
        expect(queryByText('code')).not.toBeInTheDocument();
    });

    it('should NOT render use code label and code when code NOT provided', () => {
        mockProps.fields.UseCode = null;
        const { queryByText } = render(<CountdownWithinLightboxBanner {...mockProps} />);

        expect(queryByText('label')).not.toBeInTheDocument();
        expect(queryByText('code')).not.toBeInTheDocument();
    });
});
