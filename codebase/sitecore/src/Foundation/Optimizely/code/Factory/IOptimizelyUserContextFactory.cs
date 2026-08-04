namespace easyJet.Foundation.Optimizely.Factory
{
    using OptimizelySDK;
    using OptimizelySDK.Entity;

    /// <summary>
    /// The Optimizely user context
    /// </summary>
    public interface IOptimizelyUserContextFactory
    {
        /// <summary>
        /// Creates an OptimizelyUserContext when a stable user id is present
        /// </summary>
        /// <param name="client">The client.</param>
        /// <param name="context">The Optimizely context.</param>
        /// <param name="userId">The userId.</param>
        /// <returns>Returns false when decisioning must be disabled.</returns>
        bool TryCreateUserContext(IOptimizely client, out OptimizelyUserContext context, out string userId);

        /// <summary>
        /// Gets the user id if available or null.
        /// </summary>
        /// <returns>The user id.</returns>
        string GetUserId();

        /// <summary>
        /// Gets User Attributes.
        /// </summary>
        /// <returns>The UserAttributes.</returns>
        UserAttributes GetAttributes();
    }
}