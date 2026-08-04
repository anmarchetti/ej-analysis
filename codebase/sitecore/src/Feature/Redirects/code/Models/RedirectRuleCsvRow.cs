using easyJet.Foundation.SitecoreExtensions.Attributes;

namespace easyJet.Feature.Redirects.Models
{
    public class RedirectRuleCsvRow
    {
        public string FromUrl { get; set; }

        public string ToUrl { get; set; }

        public string SetupDate { get; set; }

        public string SitecoreUser { get; set; }

        public string Comments { get; set; }

        public string RedirectType { get; set; }

        public string Priority { get; set; }

        public string FilterPageTypes { get; set; }

        public string Group { get; set; }

        public string Languages { get; set; }

        public string MarkRecordToDelete { get; set; }

        [IgnoreCsvColumn]
        public bool ShouldDelete => !string.IsNullOrWhiteSpace(MarkRecordToDelete)
            && MarkRecordToDelete.Trim().Equals("Y", System.StringComparison.OrdinalIgnoreCase);
    }
}
