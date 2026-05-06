# Fix S6853: Add htmlFor/id pairs to label/input combinations
# Strategy: scan line-by-line. When we find a label without htmlFor whose text content
# is plain text, generate a slug ID, add htmlFor to the label, and add id= to the next
# <input|select|textarea> tag (on the same or following lines, before any </div> or
# next <label>).

param([Parameter(Mandatory=$true)][string[]]$Files)

function Get-Slug([string]$text) {
    $s = $text.ToLower() -replace '[^a-z0-9]+', '-' -replace '^-|-$', ''
    if ($s.Length -gt 30) { $s = $s.Substring(0, 30).TrimEnd('-') }
    return $s
}

$totalFixed = 0
foreach ($f in $Files) {
    if (-not (Test-Path $f)) { Write-Host "MISSING: $f"; continue }
    $lines = [System.Collections.Generic.List[string]]([System.IO.File]::ReadAllLines((Resolve-Path $f)))
    $usedIds = @{}
    $changed = $false
    $localFixed = 0

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        # Match <label ...>TEXT</label> on a single line, where label has no htmlFor
        if ($line -match '^(\s*)(<label\b)((?:(?!htmlFor)[^>])*)(>)([^<]+?)(</label>)\s*$') {
            $indent = $Matches[1]
            $tagOpen = $Matches[2]
            $attrs = $Matches[3]
            $closeBracket = $Matches[4]
            $text = $Matches[5].Trim()
            $tagClose = $Matches[6]

            # Skip empty text
            if ([string]::IsNullOrWhiteSpace($text)) { continue }

            # Generate unique ID
            $base = Get-Slug $text
            if ([string]::IsNullOrEmpty($base)) { continue }
            $id = $base
            $n = 2
            while ($usedIds.ContainsKey($id)) { $id = "$base-$n"; $n++ }

            # Find next <input|select|textarea> within the next 6 lines
            $targetLine = -1
            for ($j = $i + 1; $j -lt [Math]::Min($i + 7, $lines.Count); $j++) {
                $candidate = $lines[$j]
                # Stop if we hit another label or closing div before finding an input
                if ($candidate -match '<label\b' -or $candidate -match '^\s*</div>') { break }
                if ($candidate -match '<(input|select|textarea)\b' -and $candidate -notmatch '\bid\s*=') {
                    $targetLine = $j
                    break
                }
            }

            if ($targetLine -ge 0) {
                # Add htmlFor to label
                $newLabel = "$indent$tagOpen htmlFor=`"$id`"$attrs$closeBracket$text$tagClose"
                $lines[$i] = $newLabel
                # Add id to input
                $lines[$targetLine] = $lines[$targetLine] -replace '(<(input|select|textarea))\b', "`$1 id=`"$id`""
                $usedIds[$id] = $true
                $changed = $true
                $localFixed++
            }
        }
    }
    if ($changed) {
        [System.IO.File]::WriteAllLines((Resolve-Path $f), $lines)
        Write-Host "Updated: $f ($localFixed labels)"
        $totalFixed += $localFixed
    }
}
Write-Host ""
Write-Host "Total labels fixed: $totalFixed"
