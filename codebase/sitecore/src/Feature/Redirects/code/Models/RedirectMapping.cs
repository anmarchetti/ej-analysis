using System.Text.RegularExpressions;

namespace easyJet.Feature.Redirects.Models
{
    public class RedirectMapping
    {
        public int RedirectType { get; set; }

        public bool PreserveQueryString { get; set; }

        public string Pattern { get; set; }

        public string Target { get; set; }

        public bool IsRegex { get; set; }

        public bool IncludeVirtualFolder { get; set; }

        public Regex Regex
        {
            get
            {
                string key = "RedirectMapping_regex:" + Pattern;
                if (Sitecore.Context.Items[key] is Regex regex)
                {
                    return regex;
                }

                Regex newRegex = new Regex(Pattern, RegexOptions.IgnoreCase);
                Sitecore.Context.Items[key] = newRegex;
                return newRegex;
            }
        }
    }
}