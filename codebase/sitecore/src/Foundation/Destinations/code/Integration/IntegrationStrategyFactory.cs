using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Integration.Models;
using easyJet.Foundation.Destinations.Integration.Strategies;

namespace easyJet.Foundation.Destinations.Integration
{
    /// <summary>
    /// Factory returning integration rules strategy based on ChanelTypes enum or atcom code.
    /// </summary>
    [Service(typeof(IIntegrationStrategyFactory), Lifetime = Lifetime.Singleton)]
    public class IntegrationStrategyFactory : IIntegrationStrategyFactory
    {
        private static readonly Dictionary<ChanelTypes, IIntegrationStrategy> IntegrationStrategies = new Dictionary<ChanelTypes, IIntegrationStrategy>()
        {
            { ChanelTypes.HotelBeds, new HotelBeds() },
            { ChanelTypes.DynamicInventory, new DynamicInventory() },
            { ChanelTypes.DirectlyContracted, new DirectlyContacted() },
            { ChanelTypes.Expedia, new Expedia() }
        };

        /// <inheritdoc/>
        public IIntegrationStrategy GetIntegrationStrategy(string atcomCode)
        {
            foreach (var strategy in IntegrationStrategies.Values)
            {
                if (strategy.CheckIfCodeMatchStrategy(atcomCode, out var code))
                {
                    return strategy;
                }
            }

            return null;
        }

        /// <inheritdoc/>
        public IIntegrationStrategy GetIntegrationStrategy(ChanelTypes type) => IntegrationStrategies[type];
    }
}
