import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { UserService } from 'frontend/services/user.service';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ExportButtons, { TExportButtonsParams } from './ExportButtons';

const mockPosterContentComponent = jest.fn();

jest.mock('./components/PosterContent/PosterContent', () => ({
    __esModule: true,
    default: props => {
        mockPosterContentComponent(props);

        return <div data-tid='hotel-poster-content' />;
    },
}));

jest.mock('frontend/hooks/useAgentLogo', () => () => 'agent-logo');

const mockedItem = {
    displayName: 'displayName',
    id: '1',
    name: 'name',
    fields: { ExportPromoLabel: mockSitecoreField('export label') },
};

const resetMocks = (): TExportButtonsParams => ({
    fields: {
        items: [mockedItem, { ...mockedItem, id: '2' }],
    },
    params: {},
    rendering: {},
});

let mockStores;
let mocks: TExportButtonsParams;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ExportButtons />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({ bookingStore: { isLuxuryPackage: false } });
        UserService.getUMUserInfo = jest.fn().mockResolvedValue({ data: {} });
    });

    it('should NOT render when items are NOT provided', () => {
        mocks.fields = { items: [] };

        const { container } = render(<ExportButtons {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render items when items are provided', () => {
        render(<ExportButtons {...mocks} />);

        expect(screen.getAllByTestId('hotel-poster-content')).toHaveLength(2);
        expect(screen.getByTestId('export-buttons-wrapper')).toHaveClass('itemsWrapper');
    });

    it('should render export-buttons-wrapper with luxury class when isLuxuryPackage is true', () => {
        mockStores.bookingStore.isLuxuryPackage = true;

        render(<ExportButtons {...mocks} />);

        expect(screen.getByTestId('export-buttons-wrapper')).toHaveClass('itemsWrapper luxury');
    });
});
