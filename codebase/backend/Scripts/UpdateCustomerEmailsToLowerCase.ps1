[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$apiHeaders = @{'Content-Type' = 'application/json'; 'X-App-Id' = '00f325ae-a274-4d09-b72e-c62b0aeb6903'; 'X-App-Token' = 'c8b8c8b8-860e-40d2-91c9-5b3fc3f7f9ca'} # TST

function updateCustomerEmail($id, $email) {
    $uri = "https://api.voucherify.io/v1/customers/$($id)";
    $body = @"
{
	"email": "$email"
}
"@
    $resp = Invoke-WebRequest  $uri  -Headers $apiHeaders -Method Put -Body $body
    Write-Output $resp
}

$allCustomers = @();
$limit = 100; 
$startingAfter = ''
for($page=1; $page -le 478; $page++) { #47798
    $uri = "https://api.voucherify.io/v1/customers?limit=$limit&page=$page"    
    if($page -gt 1) {
        $uri += "&starting_after=$startingAfter"
    }

    #Write-Output $uri
    $raw = Invoke-WebRequest  $uri  -Headers $apiHeaders 
    $customers = ConvertFrom-Json $([String]::new($raw.Content))
    $allCustomers  += $customers.customers;
    
    $startingAfter = $customers.customers[-1].created_at    
    write-output "Page $page"
}

Write-Output "Found $($allCustomers.Count)"
#$allCustomers  = $allCustomers | Where-Object {$_.email -and -not($_.email -ceq $_.email.ToLower()) -and ($_.id -eq $_.source_id) };
$allCustomers  = $allCustomers | Where-Object {$_.email -and -not($_.email -ceq $_.email.ToLower()) };
Write-Output "Filtered $($allCustomers.Count)"

#Write-Output "Id, SourceId, Email, IsLowerCase, NoSourceId"
$processed = 1
foreach($c in $allCustomers) {    
    $email = $c.email
    $emailLower = $email.ToLower()

    Write-Output "Updating ($processed of $($allCustomers.Count)) $($c.id)/$($c.source_id) with email $($c.email) to be $emailLower"
    updateCustomerEmail $c.id $emailLower

    $processed++
}

write-output "Done"
