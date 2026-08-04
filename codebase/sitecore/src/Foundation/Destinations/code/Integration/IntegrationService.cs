using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Integration.Models;
using easyJet.Foundation.Destinations.Integration.Strategies;

namespace easyJet.Foundation.Destinations.Integration
{
    [Service(typeof(IIntegrationService), Lifetime = Lifetime.Transient)]
    public class IntegrationService : IIntegrationService
    {
        private readonly IIntegrationStrategyFactory integrationStrategyFactory;
        private IIntegrationStrategy integrationStrategy;

        public IntegrationService(IIntegrationStrategyFactory integrationStrategyFactory)
        {
            this.integrationStrategyFactory = integrationStrategyFactory;
        }

        /// <inheritdoc/>
        public string FormatNameWithAbbv(string pattern)
        {
            return integrationStrategy.FormatNameWithAbbv(pattern);
        }

        /// <inheritdoc/>
        public string ExtractCode(IEnumerable<string> sourceCodes)
        {
            foreach (var sourceCode in sourceCodes)
            {
                if (integrationStrategy.CheckIfCodeMatchStrategy(sourceCode, out var validCode))
                {
                    return validCode;
                }
            }

            return null;
        }

        /// <inheritdoc/>
        public bool ValidateCode(string atcomCode)
        {
            return integrationStrategy.CheckIfCodeMatchStrategy(atcomCode, out var validCode);
        }

        /// <inheritdoc/>
        public IIntegrationService SetIntegrationStrategy(string atcomCode)
        {
            integrationStrategy = integrationStrategyFactory.GetIntegrationStrategy(atcomCode);
            return this;
        }

        /// <inheritdoc/>
        public IIntegrationService SetIntegrationStrategy(ChanelTypes type)
        {
            integrationStrategy = integrationStrategyFactory.GetIntegrationStrategy(type);
            return this;
        }
    }
}
