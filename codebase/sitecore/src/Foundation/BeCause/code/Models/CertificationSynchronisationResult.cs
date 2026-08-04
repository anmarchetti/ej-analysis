using System.Diagnostics.CodeAnalysis;
using Sitecore.Data.Items;

namespace easyJet.Foundation.BeCause.Models
{
    [ExcludeFromCodeCoverage]
    public class CertificationSynchronisationResult
    {
        public Item Hotel { get; set; }

        public SynchronizationOperation Operation { get; set; }

        public string Message { get; set; }
    }
}