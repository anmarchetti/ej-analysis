using easyJet.Holidays.Api.Domain.Settings;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    public class BookingMemo
    {
        public string Code { get; set; }
        public string Key { get; set; }
        public string ServiceCode { get; set; }
        public string Description { get; set; }
        public bool Delete { get; set; }
        public string Status { get; set; }
        public BookingMemo() { }
        public BookingMemo(MemoSettings settings)
        {
            Code = settings.Code;
            Description = settings.Description;
        }
    }
}
