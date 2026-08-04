namespace easyJet.Foundation.AmazonS3.Reports.Repositories
{
    public interface IReportRepository<T>
    {
        void Add(T record);
    }
}