namespace easyJet.Feature.Redirects.Models
{
    public class RedirectRuleInput
    {
        public string FromUrl { get; set; }

        public string ToUrl { get; set; }

        public int RedirectType { get; set; }

        public string Comments { get; set; }

        public int Priority { get; set; }

        public string FilterPageTypes { get; set; }

        public string GroupName { get; set; }

        public string Languages { get; set; }

        public RedirectRuleStatus? Status { get; set; }

        public string RelatedItem { get; set; }
    }
}
