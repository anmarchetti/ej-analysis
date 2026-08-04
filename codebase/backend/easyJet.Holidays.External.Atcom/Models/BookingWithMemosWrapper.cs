using easyJet.Holidays.External.Atcom.Models.Internal;

namespace easyJet.Holidays.External.Atcom.Models
{
    public class BookingWithMemosWrapper
    {
        public DisplayResponse DisplayResponse { get; set; }
        public Memo[] Memos { get; set; }
    }
}
