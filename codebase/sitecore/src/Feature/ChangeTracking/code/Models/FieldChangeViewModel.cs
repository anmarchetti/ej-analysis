using System.Diagnostics.CodeAnalysis;

namespace easyJet.Feature.ChangeTracking.Models
{
    [ExcludeFromCodeCoverage]
    public class FieldChangeViewModel : ChangeViewModel
    {
        public string Field { get; set; }

        public string OldValue { get; set; }

        public string NewValue { get; set; }
    }
}