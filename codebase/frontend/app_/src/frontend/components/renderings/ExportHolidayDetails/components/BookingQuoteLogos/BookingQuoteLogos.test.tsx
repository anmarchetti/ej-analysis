import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockExportDetailsFields } from 'frontend/__mocks__/exportHoliday';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { BookingQuoteLogos, IBookingQuoteLogosProps } from './BookingQuoteLogos';

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: jest.fn(({ field, dataTid }) => <img src={field.value.src} alt={field.value.alt} data-tid={dataTid} />),
}));

const logoImage: ISitecoreField<ISitecoreImage> = {
    value: {
        src: 'logoImageSrc',
        alt: 'Logo Image Alt',
    },
};

const logo: ISitecoreField<ISitecoreImage> = {
    value: {
        src: 'logosSrc',
        alt: 'Logos Alt',
    },
};

const createProps: () => IBookingQuoteLogosProps = () => ({
    hasEjLogo: true,
    UMLogoImage: 'umLogo',
    hasUMLogo: true,
    logoImage: logoImage,
    extraLogo: logo,
    dateText: '01/01/2024',
    timeText: '12:00',
    fields: mockExportDetailsFields,
});

let mockProps = createProps();

describe('<BookingQuoteLogos />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render the logo image if hasLogos is true and logoImage is defined', () => {
        render(<BookingQuoteLogos {...mockProps} />);

        expect(screen.getByTestId('easyjet-logo')).toBeInTheDocument();
        expect(screen.getByTestId('easyjet-logo')).toHaveAttribute('src', 'logoImageSrc');
        expect(screen.getByTestId('easyjet-logo')).toHaveAttribute('alt', 'Logo Image Alt');
    });

    it('should NOT render the logo image if hasLogos is false', () => {
        mockProps.hasEjLogo = false;
        mockProps.extraLogo = undefined;
        render(<BookingQuoteLogos {...mockProps} />);

        expect(screen.queryByTestId('easyjet-logo')).not.toBeInTheDocument();
    });

    it('should NOT render the logo image if logoImage is undefined', () => {
        mockProps.logoImage = undefined;
        mockProps.extraLogo = undefined;
        render(<BookingQuoteLogos {...mockProps} />);

        expect(screen.queryByTestId('easyjet-logo')).not.toBeInTheDocument();
    });

    it('should render User Management agency/consortium logo if hasUMLogo is true and umLogo is defined', () => {
        render(<BookingQuoteLogos {...mockProps} />);

        expect(screen.getByTestId('um-logo')).toBeInTheDocument();
        expect(screen.getByTestId('um-logo')).toHaveAttribute('src', 'umLogo');
        expect(screen.getByTestId('um-logo')).toHaveAttribute('alt', 'um-logo');
    });

    it('should NOT render User Management agency/consortium logo if hasUMLogo is false', () => {
        mockProps.hasUMLogo = false;
        render(<BookingQuoteLogos {...mockProps} />);

        expect(screen.queryByTestId('um-logo')).not.toBeInTheDocument();
    });

    it('should NOT render User Management agency/consortium logo if umLogo is undefined', () => {
        mockProps.UMLogoImage = undefined;
        render(<BookingQuoteLogos {...mockProps} />);

        expect(screen.queryByTestId('um-logo')).not.toBeInTheDocument();
    });

    it('should render the additional logos if logos is defined', () => {
        mockProps.hasEjLogo = false;
        mockProps.logoImage = undefined;
        render(<BookingQuoteLogos {...mockProps} />);

        expect(screen.getByTestId('additional-logos')).toBeInTheDocument();
        expect(screen.getByTestId('additional-logos')).toHaveAttribute('src', 'logosSrc');
        expect(screen.getByTestId('additional-logos')).toHaveAttribute('alt', 'Logos Alt');
    });

    it('should NOT render the additional logos if logos is undefined', () => {
        mockProps.extraLogo = undefined;
        mockProps.hasEjLogo = false;
        mockProps.logoImage = undefined;
        render(<BookingQuoteLogos {...mockProps} />);

        expect(screen.queryByTestId('additional-logos')).not.toBeInTheDocument();
    });
});
