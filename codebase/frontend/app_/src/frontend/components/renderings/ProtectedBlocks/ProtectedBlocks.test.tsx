import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import { ProtectedBlocks, TProtectedBlocksProps } from './ProtectedBlocks';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSImageNextProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSImageNextProps(props);

        return <div data-tid='jss-image-next' />;
    },
}));

let mockStores;

describe('<ProtectedBlocks />', () => {
    const resetMocks = () =>
        ({
            fields: {
                AtolImage: mockSitecoreField(mockSitecoreImageField('')),
                AbtaImage: mockSitecoreField(mockSitecoreImageField('')),
                AtolText: mockSitecoreField('AtolText'),
                AbtaText: mockSitecoreField('AbtaText'),
                AtolTitle: mockSitecoreField('AtolTitle'),
                AbtaTitle: mockSitecoreField('AbtaTitle'),
            },
        } as TProtectedBlocksProps);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores();
    });

    it('Should render JSS images', () => {
        render(<ProtectedBlocks {...mocks} />);

        expect(screen.getAllByTestId('jss-image-next')).toHaveLength(2);
        expect(mockJSSImageNextProps).toHaveBeenCalledWith({
            field: {
                value: {
                    src: '',
                },
            },
            fill: true,
        });
    });

    it('should render empty block if no fields', () => {
        delete mocks.fields;
        render(<ProtectedBlocks {...mocks} />);

        expect(screen.queryByTestId('protected-block')).not.toBeInTheDocument();
        expect(screen.queryByTestId('protected-blocks-container')).toBeInTheDocument();
    });

    it('should render protected blocks', () => {
        render(<ProtectedBlocks {...mocks} />);

        expect(screen.getAllByTestId('protected-block')).toHaveLength(2);
    });
});
