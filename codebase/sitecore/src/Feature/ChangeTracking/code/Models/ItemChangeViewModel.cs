using System.Diagnostics.CodeAnalysis;

namespace easyJet.Feature.ChangeTracking.Models
{
    [ExcludeFromCodeCoverage]
    public class ItemChangeViewModel : ChangeViewModel
    {
        public string Field { get; set; }

        public string Action { get; set; }

        public string OldPath { get; set; }

        public string Path { get; set; }
    }
}