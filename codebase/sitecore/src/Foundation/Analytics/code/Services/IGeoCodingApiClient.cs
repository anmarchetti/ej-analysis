using System.Threading.Tasks;

namespace easyJet.Foundation.Analytics.Services
{
    public interface IGeoCodingApiClient
    {
        string GetPostalTown(string latitude, string longitude);
    }
}