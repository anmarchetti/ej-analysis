import { IAirportParking } from 'models/data/externalExtras/IAirportParking';

export const mockAirportParking: IAirportParking = {
    title: 'Holiday Extras Park & Ride by Purple Parking - all terminals',
    description: 'Parking description',
    brandImage: 'test/image-url',
    isMeetAndGreet: true,
    transferTip: 'Meet and Greet',
    address: 'Charlwood Road,<br />Lowfield Heath,<br />Crawley<br />RH11 0QB',
    bookingDetails: {
        productCode: 'LGF2',
        totalPrice: 116.99,
        startTime: '11:50:00',
        endTime: '02:25:00',
        type: 'OFF_SITE',
        startDate: '2025-04-23T00:00:00',
        endDate: '2025-05-01T00:00:00',
        promotionCode: 'AUCI',
        keyData:
            '<KeyData><BookingURL>/sandbox/v1/carpark/HPLGF2/priceCheck?</BookingURL><Ticket><AvailabilityList><Availability Code="LGF2" Name="Holiday Extras Park &amp; Ride by Purple Parking - all terminals"><AirportTransfer TravelDuration="10" Frequency="20" Price=""/><Prices TotalPrice="116.99"/><Raw><Filter><meet_and_greet>1</meet_and_greet><park_and_ride>1</park_and_ride><car_parked_for_you>1</car_parked_for_you></Filter><tfhrpricing>24hour</tfhrpricing></Raw></Availability></AvailabilityList></Ticket></KeyData>',
        extRefId: 'GRLBDQ',
    },
    isParkAndRide: false,
    isParkAndStroll: false,
};
