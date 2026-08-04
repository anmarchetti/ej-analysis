<#
.SYNOPSIS

Extend vouchers expiration date

.DESCRIPTION

Extend credits which expire between dates by one year

.PARAMETER ExpirationBefore
Voucher expiration date before which we want to process voucehrs.
Format: ISO 8601

.PARAMETER ExpirationAfter
Voucher expiration date after which we want to process voucehrs.
Format: ISO 8601

.OUTPUTS

Modified vouchers codes with new expiration date

.EXAMPLE
For Preprod directory:
PS> .\ExtendVouchersExpirationDate.ps1 -ExpirationAfter 2021-05-15T00:00:00Z -ExpirationBefore 2021-09-30T23:59:59.99Z -AppId 57e5ccb2-9108-46d1-a187-7696a94546ec -AppToken 8477b6a8-6fd0-4480-af98-623e3bf87439
#>
[CmdletBinding()]
Param(
    [Parameter(Mandatory=$true)]
    [string]$ExpirationAfter,
    
    [Parameter(Mandatory=$true)]
    [string]$ExpirationBefore,
    
    [Parameter(Mandatory=$true)]
    [string]$AppId,
    
    [Parameter(Mandatory=$true)]
    [string]$AppToken
) 

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$baseUri = 'https://deu4.api.voucherify.io/v1';
$apiHeaders = @{
    'Content-Type' = 'application/json'; 
    'X-App-Id' = $AppId;
    'X-App-Token' = $AppToken;
}

$customerEmails = @{}
function getCustomerEmail($id) {        
    if($customerEmails.ContainsKey($id)) {        
        return $customerEmails[$id]
    }

    $uri = "$baseUri/customers/$id"
    $resp = Invoke-RestMethod  $uri  -Headers $apiHeaders -Method Get
    $customerEmails.Add($id, $resp.email)    
    return $resp.email
}

function fetchVouchers($expirationAfter, $expirationBefore) {    
    $allVouchers = @();
    $limit = 100     
    $page = 1
    $totalPages = 1
    while($page -le $totalPages) {
        $fetchUri = "$baseUri/vouchers?limit=$limit&page=$page&[filters][expiration_date][conditions][`$after][0]=$expirationAfter&[filters][expiration_date][conditions][`$before][0]=$expirationBefore&[filters][type][conditions][`$is][0]=GIFT_VOUCHER&[filters][junction]=and"

        $vouchersRaw = Invoke-WebRequest  $fetchUri  -Headers $apiHeaders 
        $vouchers = ConvertFrom-Json $([String]::new($vouchersRaw.Content))
        $allVouchers  += $vouchers.vouchers

        # update total pages on each request, why not?
        $totalPages = [int][Math]::Ceiling($vouchers.total / $limit)
        Write-Host "Fetched $page / $totalPages, $fetchUri"        
        $page++        
    }

    return $allVouchers
}

function updateExpirationDate($code, $expirationDate) {    
    $isoExpirationStr = $expirationDate.ToString("yyyy-MM-ddTHH:mm:ss.sssZ");
    $uri = "$baseUri/vouchers/$code"
    $body = @"
{
	"expiration_date": "$isoExpirationStr"
}
"@
    $resp = Invoke-RestMethod  $uri  -Headers $apiHeaders -Method Put -Body $body
    return $resp
}

# get rid of vouchers which are redeemed: balance is zero
$vouchers = fetchVouchers $ExpirationAfter $ExpirationBefore
Write-Output "Fetched $($vouchers.Count) vouchers"

# take only vouchers with positive balance
$vouchers = $vouchers | Where-Object {$_.gift.balance -gt 0 };
Write-Output "Vouchers with posiitive balance: $($vouchers.Count)"

Write-Output "`n`nUpdating expiration date:"
$outputFileName = "output-$($(Get-Date).Ticks).csv"
"Progress,Code,Expiration Date,Booking reference,Email"|add-Content -Path $outputFileName

$counter = 0
foreach($row in $vouchers) {    
    $counter++
    $expDate = ([DateTime]$row.expiration_date).ToUniversalTime()
    # extend expiration by one year
    $expDate = $expDate.AddYears(1)
   
    try {        
        try {
            $response = updateExpirationDate $row.code $expDate        
            $custEmail = getCustomerEmail $response.holder_id
            $line = "$counter of $($vouchers.Count),$($response.code),$($response.expiration_date),$($response.metadata.booking_ref),$custEmail"
        } catch {
            $line = "ERROR: Cannot update $($row.Code): $_"
        }   
        Write-Output $line
        $line|add-Content -Path $outputFileName

    } catch {
        Write-Error $_
    }
}

Write-Output "Done. Output file: $outputFileName"