namespace easyJet.Foundation.BeCause.Services
{
    public interface IDataPushService
    {
        (bool isFaulted, string errorMessage) PushHotelData();
    }
}