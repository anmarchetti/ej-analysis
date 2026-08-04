using System.Collections.Generic;
using easyJet.Foundation.Destinations.Integration.Models;

namespace easyJet.Foundation.Destinations.Integration
{
    public interface IIntegrationService
    {
        /// <summary>
        /// Format name with abbriviation.
        /// </summary>
        /// <param name="pattern">Pattern string.</param>
        /// <returns>Formatted name with abbriviation.</returns>
        string FormatNameWithAbbv(string pattern);

        /// <summary>
        /// Extract integration code from List of integration codes.
        /// </summary>
        /// <param name="sourceCodes">Integration codes.</param>
        /// <returns>Extracted integration code based on integration strategy.</returns>
        string ExtractCode(IEnumerable<string> sourceCodes);

        /// <summary>
        /// Validate atcom code based on pattern code in the intgration chanel.
        /// </summary>
        /// <param name="atcomCode">Atcom code.</param>
        /// <returns>True if code is valid.</returns>
        bool ValidateCode(string atcomCode);

        /// <summary>
        /// Set sorting strategy based on atcom code.
        /// </summary>
        /// <param name="atcomCode">Atcom code.</param>
        /// <returns>Concrete integration service.</returns>
        IIntegrationService SetIntegrationStrategy(string atcomCode);

        /// <summary>
        /// Set sorting strategy based on chanel type.
        /// </summary>
        /// <param name="type">Atcom code.</param>
        /// <returns>Concrete integration service.</returns>
        IIntegrationService SetIntegrationStrategy(ChanelTypes type);
    }
}
