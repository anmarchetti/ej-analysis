import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface ISpecialRequest {
    fields: {
        AlertTitle: ISitecoreField<string>;
        Code: ISitecoreField<string>;
        DisplayName: ISitecoreField<string>;
        Name: ISitecoreField<string>;
        PreSelectedForInfant: ISitecoreField<boolean>;
        PreSelectedForInfantAlert: ISitecoreField<string>;
    };
    id: string;
}

export interface ISpecialRequestContradictoryGroup {
    fields: {
        Options: ISpecialRequest[];
    };
    id: string;
}

export interface IFlattenedSpecialRequest {
    code: string;
    groupCode: string;
    name: string;
    AlertTitle?: ISitecoreField<string>;
    contradictoryGroupId?: string;
    isPreselected?: boolean;
    isSelected?: boolean;
    preselectedAlert?: ISitecoreField<string>;
}

export interface IContradictoryOptionsPayload {
    currentOption: IFlattenedSpecialRequest;
    newOption: IFlattenedSpecialRequest;
}

export interface ISpecialRequestsType {
    fields: {
        Code: ISitecoreField<string>;
        Name: ISitecoreField<string>;
        SpecialRequests: ISpecialRequest[];
    };
    id: string;
}
