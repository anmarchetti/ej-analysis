import React from 'react';
import { render, screen } from '@testing-library/react';

import { IViewAltOptionsButtonProps, ViewAltOptionsButton } from './ViewAltOptionsButton';

jest.mock('frontend/components/icons-new/ExternalLink', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-external-link' />,
}));

jest.mock('frontend/components/icons-new/EditFilled', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-edit-filled' />,
}));

const createProps = (): IViewAltOptionsButtonProps => ({
    children: <span>Label</span>,
    isOfferCardsABTesting: false,
});

let mockProps;

describe('<ViewAltBoardsLink />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<ViewAltOptionsButton {...mockProps} />);

        expect(screen.getByText('Label')).toBeInTheDocument();
        expect(screen.getByTestId('icon-external-link')).toBeInTheDocument();
    });

    it('should render Edit Icon if offer cards ab testing is in progress', () => {
        mockProps.isOfferCardsABTesting = true;
        render(<ViewAltOptionsButton {...mockProps} />);

        expect(screen.getByText('Label')).toBeInTheDocument();
        expect(screen.getByTestId('icon-edit-filled')).toBeInTheDocument();
        expect(screen.queryByTestId('icon-external-link')).not.toBeInTheDocument();
    });
});
