namespace easyJet.Holidays.Api.Domain.Constants;

public static class OfferConstants
{
    /// <summary>
    /// Free for kids filter. This needs to match code property in /sitecore/content/EasyJet/Holidays/Data/Offer Filters/Free For Kids Only
    /// to work as expected. Additionally it's hardcoded on frontend for promo pages, as promo pages don't support offer filters 
    /// and there are no plans to implement them for promo pages. These pages are setup by Show Kids Go Free in pages property in
    /// /sitecore/content/EasyJet/Holidays/Settings/Offers And Promotions Settings
    /// </summary>
    public const string FreeForKidsFilter = "ffk";
}
