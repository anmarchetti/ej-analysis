using System.Collections.Generic;

namespace easyJet.Feature.Redirects.Models
{
    public class RedirectRuleImportResult
    {
        public int Added { get; set; }

        public int Updated { get; set; }

        public int Deleted { get; set; }

        public int Skipped { get; set; }

        public List<string> Errors { get; set; } = new List<string>();
    }
}
