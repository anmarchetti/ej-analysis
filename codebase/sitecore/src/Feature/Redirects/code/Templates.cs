using Sitecore.Data;

namespace easyJet.Feature.Redirects
{
    public static class Templates
    {
        public struct RedirectRule
        {
            public static readonly ID ID = new ID("{866F48C6-3EE9-495F-80F0-15D94A74DBB4}");

            public struct Fields
            {
                public static ID FromUrl { get; } = new ID("{5E4B7DE3-EB6A-4B65-9B1E-97AF72E5B0B1}");

                public static ID ToUrl { get; } = new ID("{6C62F9C6-4BAF-4A6D-8C1F-0A2E8F4A1B0D}");

                public static ID RedirectType { get; } = new ID("{AE597BE3-5A08-4139-A21C-0716FAE2B805}");

                public static ID Comments { get; } = new ID("{F1C3F38B-88B5-4C76-9C5B-85D5CFB012A1}");

                public static ID Priority { get; } = new ID("{8D858341-ABB1-4AC1-A9D2-203BB423FEC7}");

                public static ID FilterPageTypes { get; } = new ID("{D1D77D52-5339-4090-9F06-BE4250F839BB}");

                public static ID Languages { get; } = new ID("{B69ADDC5-3133-4308-BF7C-AC05E7EB0175}");

                public static ID Status { get; } = new ID("{A1F4C2D8-7B3E-4C9A-9F21-6E2D5B8A1C30}");

                public static ID RelatedItem { get; } = new ID("{B2E5D3F9-8C4F-4D0B-8A12-7F3E6C9B2D41}");
            }
        }

        public struct RedirectRulesFolder
        {
            public static readonly ID ID = ID.Parse("{AD2205DC-AEC6-427F-B285-4C5AEF8A4478}");
        }
    }
}
