using System.Collections.Generic;
using Sitecore.Mvc.Presentation;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public static class VirtualFacilityGroupsContentResolverTestsData
    {
        public static IEnumerable<object[]> NotValidRendering
        {
            get
            {
                return new[]
                {
                    new object[] { new Rendering() { DataSource = null } },
                    new object[] { new Rendering() { DataSource = string.Empty } }
                };
            }
        }
    }
}
