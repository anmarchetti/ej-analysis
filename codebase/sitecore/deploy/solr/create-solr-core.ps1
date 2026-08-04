param(
    [parameter(mandatory=$true)] 
    [string] $archiveRoot,
    [parameter(mandatory=$true)] 
    [string] $instanceRoot,
    [parameter(mandatory=$true)] 
    [string] $instanceUrl,
    [parameter(mandatory=$true)] 
    [string] $coreName
)

$coreFolder = "$instanceRoot\$coreName"

$archiveRoot
$instanceRoot
$instanceUrl
$coreName
$coreFolder

if (-Not(Test-Path "$coreFolder")) {

    Expand-Archive -LiteralPath "$archiveRoot" -DestinationPath $coreFolder -Force
    Write-Host "New core folder successfully created"

    $wgetRequest =   "$instanceUrl/admin/cores?action=CREATE&name=$coreName&instanceDir=$coreFolder\&config=solrconfig.xml&dataDir=$coreFolder\data\"
    Write-Host "Creating core $coreName using action string: $wgetRequest"
    Wget $wgetRequest
    Write-Host "$coreName core successfully created"
}
else {
    Write-Host "$coreName already exists"
}