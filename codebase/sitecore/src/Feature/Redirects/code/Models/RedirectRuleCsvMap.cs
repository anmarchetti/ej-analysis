using CsvHelper.Configuration;

namespace easyJet.Feature.Redirects.Models
{
    public sealed class RedirectRuleCsvMap : ClassMap<RedirectRuleCsvRow>
    {
        public RedirectRuleCsvMap()
        {
            Map(m => m.FromUrl).Name("From URL", "From Url", "From");
            Map(m => m.ToUrl).Name("To URL", "To Url", "To");
            Map(m => m.SetupDate).Name("Setup date", "Setup Date");
            Map(m => m.SitecoreUser).Name("Sitecore User", "User");
            Map(m => m.Comments).Name("Comments / purpose of the redirect", "Comments");
            Map(m => m.RedirectType).Name("Redirect type 301 or 302", "Redirect type", "Redirect Type");
            Map(m => m.Priority).Name("Priority", "Rule Priority");
            Map(m => m.FilterPageTypes).Name("FilterPageTypes", "Filter Page Types", "Page Types");
            Map(m => m.Languages).Name("Languages", "Language", "Language Codes");
            Map(m => m.Group).Name("Group", "Group Name");
            Map(m => m.MarkRecordToDelete).Name("Mark record to delete", "Delete");
        }
    }
}
