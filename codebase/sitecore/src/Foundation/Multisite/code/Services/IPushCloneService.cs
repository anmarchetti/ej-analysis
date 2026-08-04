using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Services
{
    public interface IPushCloneService
    {
        /// <summary>
        /// Add child to cloned item.
        /// </summary>
        /// <param name="item">Source Item.</param>
        void AddChild(Item item);

        /// <summary>
        /// Move cloned item.
        /// </summary>
        /// <param name="item">Source Item.</param>
        void Move(Item item);

        /// <summary>
        /// Remove cloned item.
        /// </summary>
        /// <param name="item">Source Item.</param>
        void Remove(Item item);

        /// <summary>
        /// Save changes in cloned item.
        /// </summary>
        /// <param name="item">Source Item.</param>
        /// <param name="changes">Source Item Changes.</param>
        void SaveClone(Item item, ItemChanges changes);

        /// <summary>
        /// Add Version to cloned item.
        /// </summary>
        /// <param name="item">Source Item.</param>
        void AddVersion(Item item);
    }
}