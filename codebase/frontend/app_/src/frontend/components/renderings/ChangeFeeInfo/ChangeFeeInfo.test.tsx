import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockChangeFeeFields } from 'frontend/__mocks__';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import { AmendmentType } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ChangeFeeInfo, TChangeFeeInfo } from './ChangeFeeInfo';

let mockStores;
let mockProps: TChangeFeeInfo;

let mockChangeFeeHookValue;
jest.mock('./hooks/useChangeFeeInfo', () => ({
    __esModule: true,
    useChangeFeeInfo: () => mockChangeFeeHookValue,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockChangeFeeInfoDesktop = jest.fn();
jest.mock('./components/ChangeFeeInfoDesktop/ChangeFeeInfoDesktop', () => ({
    __esModule: true,
    default: props => {
        mockChangeFeeInfoDesktop(props);

        return <div>Desktop View</div>;
    },
}));

const mockChangeFeeInfoMobile = jest.fn();
jest.mock('./components/ChangeFeeInfoMobile/ChangeFeeInfoMobile', () => ({
    __esModule: true,
    default: props => {
        mockChangeFeeInfoMobile(props);

        return <div>Mobile View</div>;
    },
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ChangeFeeInfo />', () => {
    beforeEach(() => {
        mockProps = {
            fields: mockChangeFeeFields,
            rendering: {},
            params: {
                type: AmendmentType.Flight,
            },
        };
        mockChangeFeeHookValue = { isShown: true, feePP: 20 };
        mockUseMobileViewport = false;
        mockStores = createMockStores({
            amendRoomAndBoardStore: {
                feePP: 0,
            },
            amendHotelStore: {
                alternativeHotels: [],
            },
            marketStore: {
                formatMoney: jest.fn(fee => `£${fee}`),
            },
            layoutStore: {
                isAmendHotelPage: true,
            },
            trackingStore: {
                changeFee: {
                    changeFeeBannerAppearedAction: jest.fn(),
                },
            },
        });
    });

    it('render NULL when fee price is 0', () => {
        mockChangeFeeHookValue.feePP = 0;
        const { container } = render(<ChangeFeeInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render null when no fields are provided', () => {
        const { container } = render(<ChangeFeeInfo {...mockProps} fields={undefined} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render nothing when hook returned isShown = false', () => {
        mockChangeFeeHookValue.isShown = false;
        const { container } = render(<ChangeFeeInfo {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render desktop view when isMobile is false', () => {
        render(<ChangeFeeInfo {...mockProps} />);

        expect(screen.getByText('Desktop View')).toBeInTheDocument();
        expect(mockChangeFeeInfoDesktop).toHaveBeenCalledWith({
            fields: mockProps.fields,
            descriptionText: 'Description Globals.PriceLabels.PerPerson £20,',
        });
        expect(mockStores.trackingStore.changeFee.changeFeeBannerAppearedAction).toHaveBeenCalledWith(20);
    });

    it('should render mobile view when isMobile is true', () => {
        mockUseMobileViewport = true;

        render(<ChangeFeeInfo {...mockProps} />);
        expect(screen.getByText('Mobile View')).toBeInTheDocument();
        expect(mockChangeFeeInfoMobile).toHaveBeenCalledWith({
            fields: mockProps.fields,
            descriptionText: `Description Globals.PriceLabels.PerPerson £20,`,
        });
    });

    it('Render component for amend room and board flow', () => {
        mockStores.amendRoomAndBoardStore.feePP = 25;
        mockStores.layoutStore.isAmendHotelPage = false;

        render(<ChangeFeeInfo {...mockProps} />);

        expect(mockChangeFeeInfoDesktop).toHaveBeenCalledWith({
            fields: mockProps.fields,
            descriptionText: `Description BucketTwoDescription Globals.PriceLabels.PerPerson £20,${SitecoreDictionary.GlobalsLabelsRoomAndBoard}`,
        });
    });

    it('Render component with short description', () => {
        mockStores.amendRoomAndBoardStore.feePP = 0;
        mockStores.layoutStore.isAmendHotelPage = false;

        render(<ChangeFeeInfo {...mockProps} />);

        expect(mockChangeFeeInfoDesktop).toHaveBeenCalledWith({
            fields: mockProps.fields,
            descriptionText: 'Description Globals.PriceLabels.PerPerson £20,',
        });
    });
});
