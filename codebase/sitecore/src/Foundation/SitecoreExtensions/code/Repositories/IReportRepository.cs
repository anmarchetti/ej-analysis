namespace easyJet.Foundation.SitecoreExtensions
{
    public interface IReportRepository<T>
    {
        /// <summary>
        /// Create report record item.
        /// </summary>
        /// <param name="record">Record with data about failed to upload item.</param>
        void Add(T record);
    }
}
