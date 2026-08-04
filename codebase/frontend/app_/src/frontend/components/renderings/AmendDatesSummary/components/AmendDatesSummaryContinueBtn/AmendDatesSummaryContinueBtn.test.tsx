import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores as createDefaultMockStores, mockAmendDatesStore } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendDatesSummaryContinueBtn from './AmendDatesSummaryContinueBtn';

const createMockStores = () =>
    createDefaultMockStores({
        amendDatesStore: mockAmendDatesStore,
    });

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockButtonProps(props);

        return <button data-tid={props.dataTid}>{children}</button>;
    },
}));

describe('<AmendDatesSummaryContinueBtn />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('Render with desktop view', () => {
        render(<AmendDatesSummaryContinueBtn />);

        expect(screen.getByTestId('amend-dates-continue-cta')).toHaveTextContent(
            SitecoreDictionary.GlobalsButtonsConfirmChanges,
        );
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isMedium: true,
                className: 'summary-edit',
                dataTid: 'amend-dates-continue-cta',
                onClick: mockStores.amendDatesStore.confirmChosenDates,
            }),
        );
    });

    it('Render with mobile view', () => {
        mockStores.appStore.isScreenLessMedium = true;
        render(<AmendDatesSummaryContinueBtn />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isMedium: false,
                className: 'summary-edit',
                dataTid: 'amend-dates-continue-cta',
            }),
        );
    });
});
