using System.Collections.Generic;

namespace easyJet.Foundation.BeCause.Settings
{
    public class BeCauseSettings
    {
        public HashSet<string> Certificates { get; set; } = new HashSet<string>();

        public HashSet<string> SelectedResultFieldNames { get; set; } = new HashSet<string>();

        public bool IsEnabled { get; set; }

        public string Endpoint { get; set; }

        public string CustomIdentifierId { get; set; }

        public string[] CertificationTags { get; set; }
    }
}