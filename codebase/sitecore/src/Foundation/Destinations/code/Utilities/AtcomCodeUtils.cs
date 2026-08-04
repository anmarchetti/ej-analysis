using System;
using System.Linq;

namespace easyJet.Foundation.Destinations.Utilities
{
    public static class AtcomCodeUtils
    {
        private const int MinimumRoomFolderCodeLength = 6;
        private const string ExpediaPrefix = "W";
        private const string HotelBedsPrefix = "X";

        public static string GetAtcomCodeFromHotelBedsCode(string hotelBedsCode)
        {
            var code = hotelBedsCode?.Trim();

            if (string.IsNullOrEmpty(code) || code.StartsWith("X"))
            {
                return code;
            }

            // WP-422 - if hbg code is 6 digits or fewer >> atcom code will start with 'X9'
            if (code.Length <= 6)
            {
                return !int.TryParse(code, out var hbgCode)
                    ? code
                    : $"X9{hbgCode:D6}";
            }

            // WP-422 - if hbg code is 7 digits >> atcom code will start with only 'X'
            return $"X{code}";
        }

        public static bool IsExpediaRoomFolderCode(string code)
        {
            var normalizedCode = code?.Trim();

            return !string.IsNullOrWhiteSpace(normalizedCode)
                && normalizedCode.Length >= MinimumRoomFolderCodeLength
                && normalizedCode.StartsWith(ExpediaPrefix, StringComparison.OrdinalIgnoreCase)
                && normalizedCode.Skip(1).All(char.IsDigit);
        }

        public static bool IsHotelBedsRoomFolderCode(string code)
        {
            var normalizedCode = code?.Trim();

            return !string.IsNullOrWhiteSpace(normalizedCode)
                && normalizedCode.Length >= MinimumRoomFolderCodeLength
                && normalizedCode.StartsWith(HotelBedsPrefix, StringComparison.OrdinalIgnoreCase)
                && normalizedCode.Skip(1).All(char.IsDigit);
        }
    }
}