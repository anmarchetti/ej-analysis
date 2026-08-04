using easyJet.Holidays.Api.Domain.Data.Guests;

namespace easyJet.Holidays.Api.Domain.Services.Luggage;

/// <inheritdoc />
public class PassengerIndexCalculator : IPassengerIndexCalculator
{
    // the calculator must to be a transition dependency to calculate indexes correct
    private int _adultIndex = 0;
    private int _childIndex = 0;
    private int _infantIndex = 0;


    /// <inheritdoc />
    public int CalculatePassengerIndex(PersonType person, int adultsNumber, int childrenNumber, int infantsNumber)
    {
        const int firstAdultIndex = 1;

        return person switch
        {
            PersonType.Adult => GetAdultIndex(adultsNumber),
            PersonType.Child => GetChildIndex(childrenNumber) + adultsNumber,
            PersonType.Infant => GetInfantIndex(infantsNumber) + adultsNumber + childrenNumber,
            _ => firstAdultIndex
        };
    }

    /// <summary>
    /// Gets round robin index for adult passengers in the trip
    /// </summary>
    /// <param name="adultsAmount">Amount of adults in the trip</param>
    /// <returns>Adult index</returns>
    private int GetAdultIndex(int adultsAmount)
    {
        if (adultsAmount <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(adultsAmount),
                "Number of adults cannot be less than or equal to zero."
            );

        // round robin
        // increase cursor position
        // get modulus to have the remainder (that would be round robin index) after dividing on adults amount
        // if we have 2 adults and call the method 5 times, ergo the indexes would be 1, 2, 1, 2, 1
        return _adultIndex++ % adultsAmount + 1;
    }

    /// <summary>
    /// Gets round robin index for children passengers in the trip
    /// </summary>
    /// <param name="childrenAmount">Amount of children in the trip</param>
    /// <returns>Child index</returns>
    private int GetChildIndex(int childrenAmount)
    {
        if (childrenAmount <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(childrenAmount),
                "Number of children cannot be less than or equal to zero."
            );

        // see explanation in the GetAdultIndex
        return _childIndex++ % childrenAmount + 1;
    }

    /// <summary>
    /// Gets round robin index for infant passengers in the trip
    /// </summary>
    /// <param name="infantsAmount">Amount of infants in the trip</param>
    /// <returns>Infant index</returns>
    private int GetInfantIndex(int infantsAmount)
    {
        if (infantsAmount <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(infantsAmount),
                "Number of infants cannot be less than or equal to zero."
            );

        // see explanation in the GetAdultIndex
        return _infantIndex++ % infantsAmount + 1;
    }
}