using Sitecore.Data;

namespace easyJet.Feature.Redirects.Models
{
    public class RedirectRuleMatchResult
    {
        public ID Id { get; set; }

        public string FromUrl { get; set; }

        public string ToUrl { get; set; }

        public int RedirectType { get; set; }

        public bool IsWildcard { get; set; }

        public RedirectRuleStatus Status { get; set; }

        public ID RelatedItemId { get; set; }
    }
}
