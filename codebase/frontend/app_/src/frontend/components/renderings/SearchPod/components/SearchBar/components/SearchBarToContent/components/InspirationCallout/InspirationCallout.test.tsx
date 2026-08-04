import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import InspirationCallout, {
    IInspirationCalloutProps,
    INSPIRATION_CALLOUT_ID,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarToContent/components/InspirationCallout/InspirationCallout';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/SearchBarInputCallout/SearchBarInputCallout', () => ({ text, onClick, id }) => (
    <div data-tid={id} onClick={onClick}>
        <span dangerouslySetInnerHTML={{ __html: text }} />
    </div>
));

let mockStores;
let mockProps: IInspirationCalloutProps;

const createProps = (): IInspirationCalloutProps => ({
    onCancel: jest.fn(),
    isTextIncludeLink: false,
    calloutText: 'Discover more destinations <a href="https://example.com">here</a>.',
    calloutTitle: 'Explore New Destinations',
});

describe('InspirationCallout', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            layoutStore: {
                getSetting: jest.fn().mockReturnValue(true),
            },
            searchStore: {
                onAnywhereCheck: jest.fn(),
                hasErrorInField: jest.fn(),
            },
        });
        mockProps = createProps();
    });

    it('should render SearchBarInputCallout on holidays', () => {
        render(<InspirationCallout {...mockProps} />);

        expect(screen.getByTestId(INSPIRATION_CALLOUT_ID)).toBeInTheDocument();
    });

    it('should NOT render SearchBarInputCallout when it is disabled in settings', () => {
        mockStores.layoutStore.getSetting = jest.fn().mockReturnValue(false);

        render(<InspirationCallout {...mockProps} />);

        expect(screen.queryByTestId(INSPIRATION_CALLOUT_ID)).not.toBeInTheDocument();
    });

    it('should NOT render SearchBarInputCallout when hasErrorInField returns true', () => {
        mockStores.searchStore.hasErrorInField = jest.fn().mockReturnValue(true);

        render(<InspirationCallout {...mockProps} />);

        expect(screen.queryByTestId(INSPIRATION_CALLOUT_ID)).not.toBeInTheDocument();
    });

    it('should NOT call addAnywhere but SHOULD call onCancel when text does not includes a link and user clicks NOT on link (isTextIncludeLink = false)', async () => {
        const mockedPhraseWithLink = 'Take to find your perfect gateway!';
        mockProps.calloutText = mockedPhraseWithLink;

        render(<InspirationCallout {...mockProps} />);

        await userEvent.click(screen.getByTestId(INSPIRATION_CALLOUT_ID));

        expect(mockStores.searchStore.onAnywhereCheck).toHaveBeenCalledWith(true);
        expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('should NOT call addAnywhere and should NOT call onCancel when user clicks on link (isTextIncludeLink = true)', async () => {
        const mockedPhraseWithLink = 'Take <a data-tid="link" href="#">our quiz</a> to find your perfect gateway!';
        mockProps.isTextIncludeLink = true;
        mockProps.calloutText = mockedPhraseWithLink;
        render(<InspirationCallout {...mockProps} />);

        await userEvent.click(screen.getByTestId('link'));

        expect(mockStores.searchStore.onAnywhereCheck).not.toHaveBeenCalled();
        expect(mockProps.onCancel).not.toHaveBeenCalled();
    });
});
