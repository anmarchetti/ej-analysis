import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { IButtonSwitchItem } from 'frontend/components/common/ButtonSwitch/ButtonSwitch';

export interface IMapPointsOfInterestCategory {
    Icon: ISitecoreField<ISitecoreImage>;
    Key: ISitecoreField<string>;
    MaxNumberOfItems: ISitecoreField<number>;
    Name: ISitecoreField<string>;
}
export interface IMapPointsOfInterestFields {
    Categories: ISitecoreCompositeField<IMapPointsOfInterestCategory>[];
    DisclaimerText: ISitecoreField<string>;
    DisclaimerTooltip: ISitecoreField<string>;
    Distance: ISitecoreField<string>;
    MobileDrawerTitle: ISitecoreField<string>;
    ShowMoreButtonText: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TMapPointsOfInterestProps = ISitecoreComponent<IMapPointsOfInterestFields>;

export interface IUseMapPointsOfInterestResult {
    activeIndex: number;
    categoriesWithItems: ICategoriesWithItems[];
    handleCategoryClick: (label: string) => void;
    isMobile: boolean;
    setActiveIndex: (index: number) => void;
    title: string;
}

export interface IMapPOIContentProps {
    categoriesWithItems: ICategoriesWithItems[];
    disclaimerText: string;
    disclaimerTooltip: string;
    handleCategoryClick: (label: string) => void;
    drawerTitle?: string;
    showMoreText?: string;
}

export interface IDesktopMapPOIContentProps extends IMapPOIContentProps {
    activeIndex: number;
    setActiveIndex: (index: number) => void;
}

export interface IPointOfInterest {
    categoryName: string;
    distance: string;
    name: string;
}

export interface IHotelPointsOfInterestRequestParams {
    categories: string;
    lat: number;
    lon: number;
    airport?: string;
    resortId?: string;
    theme?: string;
}

export interface IHotelPointsOfInterest {
    category: string;
    items: IPointOfInterest[];
}

export interface ICategoriesWithItems extends IButtonSwitchItem {
    items: IPointOfInterest[];
}
