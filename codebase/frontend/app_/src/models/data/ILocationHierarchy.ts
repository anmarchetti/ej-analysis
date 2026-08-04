export interface ILocationHierarchy {
    country?: ILocationItem;
    hotel?: ILocationItem;
    region?: ILocationItem;
    resort?: ILocationItem;
}

export interface ILocationItem {
    code: string;
    name: string;
    itemName?: string;
    relatedRegions?: string[];
    relatedResorts?: string[];
    url?: string;
}
