using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking
{
    /// <summary>
    /// Server for passenger changes validation.
    /// </summary>
    public class AmendPassengerValidationService : IAmendPassengerValidationService
    {
        /// <summary>
        /// Calculate how many charactes was changes.(Levenshtein algorithm)
        /// </summary>
        /// <param name="oldName">The old name.</param>
        /// <param name="newName">The new name.</param>
        /// <returns>Characters count which was changes.</returns>
        public int CalculateNumberChangedCharacters(string oldName, string newName)
        {
            if (oldName == null)
            {
                throw new ArgumentNullException(nameof(oldName));
            }

            if (newName == null)
            {
                throw new ArgumentNullException(nameof(newName));
            }

            var oldNameLength = oldName.Length;
            var newNameLength = newName.Length;

            var matrix = new int[oldNameLength + 1, newNameLength + 1];

            // First calculation, if one entry is empty return full length
            if (oldNameLength == 0)
                return newNameLength;

            if (newNameLength == 0)
                return oldNameLength;

            // Initialization of matrix with row size source1Length and columns size source2Length
            for (var i = 0; i <= oldNameLength; matrix[i, 0] = i++) { }
            for (var j = 0; j <= newNameLength; matrix[0, j] = j++) { }

            // Calculate rows and collumns distances
            for (var i = 1; i <= oldNameLength; i++)
            {
                for (var j = 1; j <= newNameLength; j++)
                {
                    var cost = (newName[j - 1] == oldName[i - 1]) ? 0 : 1;

                    matrix[i, j] = Math.Min(
                        Math.Min(matrix[i - 1, j] + 1, matrix[i, j - 1] + 1),
                        matrix[i - 1, j - 1] + cost);
                }
            }
            // return result
            return matrix[oldNameLength, newNameLength];
        }

        /// <summary>
        /// Determines whether is amend lead passenger.
        /// </summary>
        /// <param name="guest">The guest.</param>
        /// <param name="amendPaxId">The amend pax identifier.</param>
        /// <returns>
        ///   <c>true</c> if try amend lead passenger the specified guest; otherwise, <c>false</c>.
        /// </returns>
        public bool IsAmendingLeadPassenger(IEnumerable<PersonWithDetails> guest, string amendPaxId)
        {
            var result = guest.Any(x => x.Index.Equals(amendPaxId) && x.IsLead);
            return result;
        }

        /// <summary>
        /// Calculates the name change count.
        /// </summary>
        /// <param name="paxMemo">The pax memo.</param>
        /// <param name="passengerId">The passenger identifier.</param>
        /// <returns></returns>
        public int CalculateNameChangeCount(IEnumerable<AmendPaxHistoryItem> paxMemo, string passengerId)
        {
            var result = paxMemo?.Count(x => x.PaxNameChanged == AmendPaxCondition.Yes && x.Index == passengerId) ?? 0;

            return result;
        }
    }
}