namespace easyJet.Feature.Tracker.Models.Eskel
{
    public static class BookingStatusExtenstion
    {
        public static string GetValue(this BookingStatus bookingStatus)
        {
            switch (bookingStatus)
            {
                case BookingStatus.BKG: return "BOOKING";
                case BookingStatus.CNX: return "CANCELED";
                case BookingStatus.OPT: return "OPTION";
                case BookingStatus.QTE: return "QUOTE";
                case BookingStatus.FIX: return "FIXED";
                default: return bookingStatus.ToString();
            }
        }
    }
}