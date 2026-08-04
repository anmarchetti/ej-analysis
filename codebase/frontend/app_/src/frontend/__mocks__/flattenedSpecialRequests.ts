import { IFlattenedSpecialRequest } from 'models/data/SpecialRequest';

export const flattenedSpecialRequests: IFlattenedSpecialRequest[] = [
    { code: 'R1', groupCode: 'GRP1', name: 'Request 1' },
    { code: 'R2', groupCode: 'GRP1', name: 'Request 2' },
    {
        code: 'R3',
        groupCode: 'GRP2',
        name: 'Request 3',
        isSelected: true,
        isPreselected: true,
        preselectedAlert: { value: 'alert' },
    },
];
