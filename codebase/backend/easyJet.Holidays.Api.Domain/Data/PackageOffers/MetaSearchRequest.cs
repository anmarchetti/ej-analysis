using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers
{
    /// <summary>
    /// Search for offers request
    /// </summary>
    public class MetaSearchRequest : PackagesSearchRequest, IValidatableObject
    {
        /// <summary>
        /// Guests allocation. Must be comma separated. 2,1,0 (2 - adults, 1 - children, 0 - infants)
        /// </summary>
        public string Guests { get; set; }

        public override List<RoomAllocation> Room
        {
            get
            {
                try
                {
                    var guests = Guests.Split(',');
                    int.TryParse(guests[0], out var adults);
                    int.TryParse(guests[1], out var children);
                    int.TryParse(guests[2], out var infants);

                    return new List<RoomAllocation>()
                    {
                        new RoomAllocation() {Adults = adults, Children = children, Infants = infants}
                    };
                }
                catch (Exception)
                {
                    return null;
                }
            }

            set => base.Room = value;
        }

        /// <summary>
        /// Validation of the request
        /// </summary>
        /// <param name="validationContext">Context</param>
        /// <returns>Collection of errors</returns>
        public new IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var guests = Guests.Split(',');

            //Must be comma separated. 2,1,0 (2 - adults, 1 - children, 0 - infants)
            if (guests.Length < 3 || !int.TryParse(guests[0], out _) || !int.TryParse(guests[1], out _) || !int.TryParse(guests[2], out _))
            {
                yield return new ValidationResult(
                    "Guests field is not valid. The number of guests by age type must be specified, separated by commas: `adults,children,infants` (e.g. 2,1,0)");
                yield break; // We don't want to do any further validation because there is no information about guests
            }

            var validationResults = base.Validate(validationContext);

            foreach (var validationResult in validationResults)
            {
                yield return validationResult;
            }
        }
    }
}
