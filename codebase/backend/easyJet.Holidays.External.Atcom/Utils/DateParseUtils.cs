using easyJet.Holidays.External.Domain.Exceptions;

namespace easyJet.Holidays.External.Atcom.Utils
{
    public class DateParseUtils
    {
        /// <summary>
        /// COmbines date with time string "hhMM"
        /// </summary>
        /// <param name="date">Date value</param>
        /// <param name="time">Time string hhMM</param>
        /// <returns>Date with time</returns>
        public static DateTimeOffset BuildDate(DateTime date, string time)
        {
            int hours;
            int minutes;

            if (time.Length >= 4)
            {
                if (!int.TryParse(time.Substring(0, 2), out hours))
                {
                    throw new DataFormatException($"Can not parse route hours: {time}");
                }

                if (!int.TryParse(time.Substring(2, 2), out minutes))
                {
                    throw new DataFormatException($"Can not parse route hours: {time}");
                }
            }
            else
            {
                throw new DataFormatException($"Time string should contain 4 characters: {time}");
            }

            var dateTime = new DateTime(
                date.Year,
                date.Month,
                date.Day,
                hours,
                minutes,
                0,
                DateTimeKind.Utc // TODO When we have timezone check if it should be here or it's fine to have UTC here
            );

            return new DateTimeOffset(dateTime);
        }
    }
}