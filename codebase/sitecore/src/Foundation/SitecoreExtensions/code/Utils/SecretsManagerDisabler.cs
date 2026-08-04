using System.Diagnostics.CodeAnalysis;
using Sitecore.Common;

namespace easyJet.Foundation.SitecoreExtensions.Utils
{
    [ExcludeFromCodeCoverage]
    public sealed class SecretsManagerDisabler : Switcher<bool, SecretsManagerDisabler>
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="SecretsManagerDisabler"/> class.
        /// </summary>
        public SecretsManagerDisabler()
            : base(true)
        {
        }

        /// <summary>
        /// Gets a value indicating whether this instance is active.
        /// </summary>
        public static bool IsActive => CurrentValue;
    }
}