namespace easyJet.Holidays.IntegrationTests.TestApi.Models
{
    public class BookingResponseViewModel
    {
        public string? Email { get; set; }
        public string? Password { get; set; }
        public List<BookingViewModel> Bookings { get; set; } = new List<BookingViewModel>();
    }

    public class BookingViewModel
    {
        public string? BookingReference { get; set; }
        public string? LastName { get; set; }
        public string? Date { get; set; }
        public string? SupplierId { get; set; }
        public string? Currency { get; set; }
    }
}
