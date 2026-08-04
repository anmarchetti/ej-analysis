import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SpecialRequestItem from './SpecialRequestItem';

describe('<SpecialRequestItem />', () => {
    const item = {
        code: 'code',
        groupCode: 'groupCode',
        name: 'name',
    };

    it('Should onSelect to be invoked', async () => {
        let onSelectTestCode;
        const view = render(
            <SpecialRequestItem
                item={item}
                onSelect={code => {
                    onSelectTestCode = code;
                }}
            />,
        );
        const requestItem = view.container.querySelector('button');

        if (requestItem) {
            await userEvent.click(requestItem);
        }

        expect(onSelectTestCode).toEqual(item.code);
    });
});
