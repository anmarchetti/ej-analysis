using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Sitecore.Common;

namespace easyJet.Foundation.SitecoreExtensions.Utils
{
    [ExcludeFromCodeCoverage]
    public sealed class SecretsManagerSwitcher : Switcher<bool, SecretsManagerSwitcher>
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="SecretsManagerSwitcher"/> class.
        /// </summary>
        public SecretsManagerSwitcher(Dictionary<string, string> overrideValues)
            : base(true)
        {
            OverrideValues = overrideValues;
        }

        public static Dictionary<string, string> OverrideValues { get; set; }

        public static bool IsActive => CurrentValue;
    }
}
