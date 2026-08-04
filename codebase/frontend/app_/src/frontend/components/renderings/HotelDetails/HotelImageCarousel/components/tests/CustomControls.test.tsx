import * as React from 'react';

import { shallowSnapshot } from 'frontend/utils/tests.utils';
import CustomControls from 'frontend/components/renderings/HotelDetails/HotelImageCarousel/components/CustomControls';

describe('CustomControls', () => {
    it('renders correctly', () => {
        const tree = shallowSnapshot(<CustomControls currentIndex={0} imagesLength={0} />);

        expect(tree).toMatchSnapshot();
    });
});
