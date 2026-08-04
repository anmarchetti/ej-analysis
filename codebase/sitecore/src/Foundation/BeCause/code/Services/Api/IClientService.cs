using System.Threading.Tasks;

namespace easyJet.Foundation.BeCause.Services.Api
{
    public interface IClientService
    {
        Task<string> GetResultAsync(string url, string payload);

        Task<string> GetStatusAsync(string url);

        Task<string> GetDataAsync(string url);
    }
}