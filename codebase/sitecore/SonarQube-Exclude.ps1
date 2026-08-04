# Define the source path (the root of your project)
$SourcePath = $PSScriptRoot

Write-Host "Processing ExcludeFromCodeCoverage Attributes..."

# Function to get files with [ExcludeFromCodeCoverage] attribute
function Get-FilesWithExcludeFromCodeCoverageAttribute {
    param (
        [string]$Path
    )

    # Get all .cs and .js files excluding bin and obj directories
    $files = Get-ChildItem -Path $Path -Include *.cs, *.js -Recurse -File |
        Where-Object { $_.FullName -notmatch '\\(bin|obj)\\' }

    $filesWithAttribute = @()

    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($content -match '\[ExcludeFromCodeCoverage\]') {
            # Format the path for sonar.exclusions (e.g., **/path/to/file.cs)
            $relativePath = $file.FullName.Substring($Path.Length).TrimStart('\','/')
            $relativePath = "**" + $relativePath.Replace('\', '/')
            $relativePath = $relativePath -replace '//', '/'
            $relativePath = $relativePath.Trim()
            $filesWithAttribute += $relativePath
        }
    }

    return $filesWithAttribute
}

# Function to update SonarQube.Analysis.xml
function Update-SonarQubeAnalysisXml {
    param (
        [string]$Path,
        [string[]]$ExcludedFiles
    )

    $xmlFilePath = Join-Path -Path $Path -ChildPath 'SonarQube.Analysis.xml'

    # Check if the XML file exists
    if (Test-Path $xmlFilePath) {
        [xml]$xmlDoc = Get-Content -Path $xmlFilePath
    } else {
        # Create a new XML document with the necessary namespaces
        $xmlContent = @"
<?xml version="1.0" encoding="utf-8"?>
<SonarQubeAnalysisProperties xmlns="http://www.sonarsource.com/msbuild/integration/2015/1"
                             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                             xmlns:xsd="http://www.w3.org/2001/XMLSchema">
</SonarQubeAnalysisProperties>
"@
        $xmlDoc = [xml]$xmlContent
    }

    # Handle namespaces
    $nsmgr = New-Object System.Xml.XmlNamespaceManager($xmlDoc.NameTable)
    $nsmgr.AddNamespace("ns", $xmlDoc.DocumentElement.NamespaceURI)

    $root = $xmlDoc.DocumentElement

    # Find the <Property Name="sonar.exclusions"> element
    $propertyNode = $root.SelectSingleNode("//ns:Property[@Name='sonar.coverage.exclusions']", $nsmgr)

    if ($propertyNode) {
		# Override existing exclusions with new ones
		$propertyNode.InnerText = [string]::Join(', ', $ExcludedFiles)
    } else {
        # Create new <Property Name="sonar.coverage.exclusions"> element
        $propertyNode = $xmlDoc.CreateElement('Property', $root.NamespaceURI)
        $nameAttr = $xmlDoc.CreateAttribute('Name')
        $nameAttr.Value = 'sonar.coverage.exclusions'
        $propertyNode.Attributes.Append($nameAttr)
        $propertyNode.InnerText = [string]::Join(', ', $ExcludedFiles)
        $root.AppendChild($propertyNode)
    }

    # Save the updated XML document
    $xmlDoc.Save($xmlFilePath)
}

# Get the list of files to exclude
$excludedFiles = Get-FilesWithExcludeFromCodeCoverageAttribute -Path $SourcePath

if ($excludedFiles.Count -gt 0) {
    Update-SonarQubeAnalysisXml -Path $SourcePath -ExcludedFiles $excludedFiles
    Write-Host "Updated SonarQube.Analysis.xml with excluded files."
} else {
    Write-Host "No files with [ExcludeFromCodeCoverage] attribute found."
}
