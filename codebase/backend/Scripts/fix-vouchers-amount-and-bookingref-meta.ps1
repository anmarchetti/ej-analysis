cls;
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$apiHeaders = @{'Content-Type' = 'application/json'; 'X-App-Id' = '00f325ae-a274-4d09-b72e-c62b0aeb6903'; 'X-App-Token' = 'c8b8c8b8-860e-40d2-91c9-5b3fc3f7f9ca'} # TST

function updateAmount($voucherId, $amountToAdd) {
    $uri = "https://api.voucherify.io/v1/vouchers/$voucherId/balance"
    $body = @"
{
	"amount": $amountToAdd
}
"@
    $resp = Invoke-WebRequest  $uri  -Headers $apiHeaders -Method Post -Body $body
    Write-Output $resp
}

function updateBookingRefMetadata($voucherId, $bookingRef) {
    $uri = "https://api.voucherify.io/v1/vouchers/$voucherId"
    $body = @"
{
	"metadata": {
		"booking_ref": "$bookingRef"
	}
}
"@
    $resp = Invoke-WebRequest  $uri  -Headers $apiHeaders -Method Put -Body $body
    Write-Output $resp
}

function activate($voucherId) {
    $uri = "https://api.voucherify.io/v1/vouchers/$voucherId"
    $body = @"
{
	"active": true
}
"@

    $resp = Invoke-WebRequest  $uri  -Headers $apiHeaders -Method Put -Body $body
    Write-Output $resp
}

$rows = import-csv “c:\\q\\logs\\fix.csv”

$processed = 1
foreach($row in $rows) {    
    
    # actual amount is 100 more
    $currentBalance = [decimal]$row.Amount * 100 * 100 # eg 120 -> 1200000
    $balanceToAdd = -$currentBalance * 0.99;

    Write-Output "Updating ($processed of $($rows.Count)) $($row.VoucherId) $($row.Booking) $($row.Amount)"
    
    #updateAmount $row.VoucherId $balanceToAdd
    #updateBookingRefMetadata $row.VoucherId $row.Booking
    activate  $row.VoucherId

    $processed++
}


write-output "Done"