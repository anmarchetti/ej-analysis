using System.Diagnostics.CodeAnalysis;

namespace easyJet.Foundation.SitecoreExtensions.Models
{
    [ExcludeFromCodeCoverage]
    public class SortItems
    {
        public string[] ItemIds { get; set; }

        public string[] SortOrders { get; set; }
    }
}