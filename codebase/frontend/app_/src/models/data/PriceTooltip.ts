export interface IPriceTooltipSitecoreModel {
    Content?: string;
    MaxNumberOfGuests?: number;
    MinNumberOfGuests?: number;
    NoOffer?: string;
}

export interface IPriceTooltipSetting {
    content?: string;
    maxNumberOfGuests?: number;
    minNumberOfGuests?: number;
    noOffer?: boolean;
}

export interface ISitecoreTooltipSettings {
    Children: IPriceTooltipSitecoreModel[];
}
