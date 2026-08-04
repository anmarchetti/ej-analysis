using easyJet.Foundation.Destinations.Integration.Models;
using easyJet.Foundation.Destinations.Integration.Strategies;

namespace easyJet.Foundation.Destinations.Integration
{
    /// <summary>
    /// Factory returning integration rules strategy based on ChanelTypes enum or atcom code.
    /// </summary>
    public interface IIntegrationStrategyFactory
    {
        /// <summary>
        /// Factory returning sorting strategy based on atcom code.
        /// </summary>
        /// <param name="atcomCode">Atcom code.</param>
        /// <returns>Returns concrete integration strategy.</returns>
        IIntegrationStrategy GetIntegrationStrategy(string atcomCode);

        /// <summary>
        /// Factory returning sorting strategy based on ChanelTypes enum.
        /// </summary>
        /// <param name="type">ChanelTypes enum.</param>
        /// <returns>Returns concrete integration strategy.</returns>
        IIntegrationStrategy GetIntegrationStrategy(ChanelTypes type);
    }
}
