export interface IBd4Tracking {
    apiUrl: string;
    pToken: string;
    tracking: Nullable<{
        campaignId?: string[];
        campaignInfo?: IBd4CampaignInfo[];
    }>;
    apiMessage?: string;
    recoInfo?: any;
}

export interface IBd4CampaignInfo {
    action: string;
    id: string;
    name: string;
    productId: string; // contain accomId (e.g. "ej:X9017210")
}
