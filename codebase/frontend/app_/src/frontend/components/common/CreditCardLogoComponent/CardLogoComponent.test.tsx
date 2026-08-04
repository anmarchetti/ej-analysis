import React from 'react';
import { render, screen } from '@testing-library/react';

import { CardType } from 'models/enum/CardType';

import { CardLogoComponent } from './CardLogoComponent';

// eslint-disable-next-line eslintDataTidPlugin/data-tid-in-snake-case
jest.mock('frontend/components/icons-new/VisaLogo', () => () => <svg data-tid='Visa' />);
// eslint-disable-next-line eslintDataTidPlugin/data-tid-in-snake-case
jest.mock('frontend/components/icons-new/MastercardLogo', () => () => <svg data-tid='Mastercard' />);
// eslint-disable-next-line eslintDataTidPlugin/data-tid-in-snake-case
jest.mock('frontend/components/icons-new/AmericanExpressLogo', () => () => <svg data-tid='AmericanExpress' />);
// eslint-disable-next-line eslintDataTidPlugin/data-tid-in-snake-case
jest.mock('frontend/components/icons-new/MaestroLogo', () => () => <svg data-tid='Maestro' />);

describe('CardLogoComponent', () => {
    it('should render Visa logo', () => {
        render(<CardLogoComponent cardType={CardType.Visa} />);
        expect(screen.getByTestId('Visa')).toBeInTheDocument();
    });

    it('should render Mastercard logo', () => {
        render(<CardLogoComponent cardType={CardType.Mastercard} />);
        expect(screen.getByTestId('Mastercard')).toBeInTheDocument();
    });

    it('should render American Express logo', () => {
        render(<CardLogoComponent cardType={CardType.AmericanExpress} />);
        expect(screen.getByTestId('AmericanExpress')).toBeInTheDocument();
    });

    it('should render Maestro logo', () => {
        render(<CardLogoComponent cardType={CardType.Maestro} />);
        expect(screen.getByTestId('Maestro')).toBeInTheDocument();
    });

    it('should return null for InvalidType', () => {
        const { container } = render(<CardLogoComponent cardType={CardType.InvalidType} />);
        expect(container.firstChild).toBeNull();
    });
});
