#!/usr/bin/env bash

set -evx

: GHEAD=${GHEAD:=$(which {g,}head)}
: GTAIL=${GTAIL:=( $(which {g,}tail) )}
: GGREP=${GGREP:=( $(which {g,}grep) )}
: GCAT=${GCAT:=( $(which {g,}cat) )}
: GECHO=${GECHO:=( $(which {g,}echo) )}
: GWC=${GWC:=( $(which {g,}wc) )}
: GTEE=${GTEE:=( $(which {g,}tee) )}
: GMV=${GMV:=( $(which {g,}mv) )}
: GMKTEMP=${GMKTEMP:=$(which {g,}mktemp)}

# Initialize output file
OUTPUT=$(mktemp) 

# Combined echo and tee function
TECH() {
    $GTECH "$@" 
}
GCP=${GCP:=( $(which {g,}cp) )}
GFIND=${GFIND:=( $(which {g,}find) )}
GDIFF=${GDIFF:=( $(which {g,}diff) )}
GSED=${GSED:=( $(which {g,}sed) )}
 
function scan {  ##scan requires 1 turn to respond with results.
    $GTECH "scan called with parameters: $1, $2"
    local globpat="$1"    # like gitignore
    local pattern="$2"    # Text-like: regex pattern to match
    local regex_failed=0  # Variable to signal regex failure

    # Return the regex string if called without parameters
    if [[ -z "$globpat" || -z "$pattern" ]]; then
        $GTECH "Regex: (?:scan\\((?<globpat>[^,]+),(?<pattern>.*)\\))"
        return 1
    fi

    # Print the full regex if called with empty parameters
    if [[ -z "$globpat" && -z "$pattern" ]]; then
        $GTECH "Regex: (?:scan\\((?<globpat>[^,]+),(?<pattern>.*)\\))"
        return 1
    fi

    # Define the regex for validating the parameters with named groups
    local regex="^(?<globpat>[a-zA-Z0-9_\\-\\.\\*\\?\\[\\]\\{\\}]+)\\s+(?<pattern>(?:[a-zA-Z0-9_\\-\\.\\(\\)\\[\\]\\{\\}]+|\\(.*\\))*)$"

    # Validate the parameters using the regex
    if ! [[ "$globpat $pattern" =~ $regex ]]; then
        $GTECH '^\s*scan'\\s+"$regex" 
        return 1
    fi 

    # Check if any files match the pattern
    local files=$($GFIND . -iname "$globpat")
    if [[ -z "$files" ]]; then
        $GTECH "Error: No files matching pattern '$globpat'"
        return 1
    fi

    $GTECH "Scanning for pattern: $pattern in files matching: $globpat"
    $GGREP \-nC 2 \-P "$pattern" $files | $GTEE \-a ${OUTPUT}
}

function edit { ### edit happens immediately but requires at least one verification in order to very an edit and validate no concurrency mysteries
    $GTECH "edit called with parameters: $1, $2, $3, $4"
    local file="$1"
    local new_text="$2"
    local start="$3"
    local end="$4"
    local regex_failed=0  # Variable to signal regex failure

    # Return the regex string if called without parameters
    if [[ -z "$file" || -z "$new_text" || -z "$start" || -z "$end" ]]; then
        $GTECH "Regex: (?:edit\\((?<file>[^,]+),(?<new_text>.+),(?<start>[0-9]+),(?<end>[0-9]+)\\))"
        return 1
    fi

    # Print the full regex if called with empty parameters
    if [[ -z "$file" && -z "$new_text" && -z "$start" && -z "$end" ]]; then
        $GTECH "Regex: (?:edit\\((?<file>[^,]+),(?<new_text>.+),(?<start>[0-9]+),(?<end>[0-9]+)\\))"
        return 1
    fi

    # Define the regex for validating the parameters with named groups
    local regex="^(?<file>[a-zA-Z0-9_\\-\\.]+)\\s+(?<new_text>.+)\\s+(?<start>[0-9]+)\\s+(?<end>[0-9]+)$"

    # Validate the parameters using the regex
    if ! [[ "$file $new_text $start $end" =~ $regex ]]; then
        $GTECH "Error: Invalid parameters for _edit"
        regex_failed=1
    fi

    # File existence check
    if [[ ! -f "$file" ]]; then
        $GTECH "Error: File '$file' does not exist"
        regex_failed=1
    fi

    # Get total line count
    local total_lines=$($GWC -l < "$file")
    
    # Validate line numbers
    if [[ "$start" -le 0 || "$end" -le 0 || "$start" -gt "$total_lines" || "$end" -gt $((total_lines + 1)) || "$start" -ge "$end" ]]; then
        $GTECH "Error: Invalid line range $start to $end (file has $total_lines lines)"
        regex_failed=1
    fi

    # If regex failed, exit early
    if [[ $regex_failed -eq 1 ]]; then
        return 1
    fi

    local tmpfile=$(mktemp)
    $GTECH "Editing file: $file from line $start to $end"
    $GTECH "New content: $new_text"
    $GCAT <($GHEAD -n "$((start-1))" "$file") <<< "$new_text" <($GTAIL -n "+$((end))" "$file") > "$tmpfile"
    $GMV -f "$tmpfile" "$file" | $GTEE -a ${OUTPUT}
}

function verify {  ##verify requires 1 turn to respond with results and removes latches on rebuild/test processes.
    $GTECH "verify called with parameters: $1, $2, $3, $4"
    local file1="$1"      # File-like: original file
    local file2="$2"      # File-like: new file
    local start="$3"      # Start line to verify
    local end="$4"        # End line to verify, exclusive
    local regex_failed=0  # Variable to signal regex failure

    # Return the regex string if called without parameters
    if [[ -z "$file1" || -z "$file2" || -z "$start" || -z "$end" ]]; then
        $GTECH "Regex: (?:verify\\((?<file1>[^,]+),(?<file2>[^,]+),(?<start>[0-9]+),(?<end>[0-9]+)\\))"
        return 1
    fi

    # Print the full regex if called with empty parameters
    if [[ -z "$file1" && -z "$file2" && -z "$start" && -z "$end" ]]; then
        $GTECH "Regex: (?:verify\\((?<file1>[^,]+),(?<file2>[^,]+),(?<start>[0-9]+),(?<end>[0-9]+)\\))"
        return 1
    fi

    # Define the regex for validating the parameters with named groups
    local regex="^(?<file1>[a-zA-Z0-9_\\-\\.]+)\\s+(?<file2>[a-zA-Z0-9_\\-\\.]+)\\s+(?<start>[0-9]+)\\s+(?<end>[0-9]+)$"

    # Validate the parameters using the regex
    if ! [[ "$file1 $file2 $start $end" =~ $regex ]]; then
        $GTECH "Error: Invalid parameters for _verify"
        regex_failed=1
    fi

    # File existence checks
    for f in "$file1" "$file2"; do
        if [[ ! -f "$f" ]]; then
            $GTECH "Error: File '$f' does not exist"
            regex_failed=1
        fi

        # Debug: Log the file and line counts
        $GTECH "File: $f"
        $GTECH "Total lines: $($GWC -l < "$f")"
    done

    # Get total line counts
    local lines1=$($GWC -l < "$file1")
    local lines2=$($GWC -l < "$file2")

    # Validate line numbers
    local max_lines=$((lines1 > lines2 ? lines1 : lines2))
    if [[ "$start" -le 0 || "$end" -le 0 || "$start" -gt "$max_lines" || "$end" -gt $((max_lines + 1)) || "$start" -ge "$end" ]]; then
        $GTECH "Error: Invalid line range $start to $end (files have $lines1 and $lines2 lines)"
        regex_failed=1
    fi

    # If regex failed, exit early
    if [[ $regex_failed -eq 1 ]]; then
        return 1
    fi

    # Debug: Log the validation result
    $GTECH "Line range validation passed"

    # Compare the specified line ranges
    local diff_output=$($GDIFF <($GTAIL -n +$start "$file1" | $GHEAD -n $((end - start + 1)) ) <($GTAIL -n +$start "$file2" | $GHEAD -n $((end - start + 1)) ))
    if [[ -n "$diff_output" ]]; then
        $GTECH "Differences found between files in the specified range:"
        $GTECH "$diff_output"
        return 1
    else
        $GTECH "No differences found between files in the specified range."
    fi
}

case $1 in
    scan)
        scan "$2" "$3"
        ;;
    edit)
        edit "$2" "$3" "$4" "$5"
        ;;
    verify)
        verify "$2" "$3" "$4" "$5"
        ;;
    *)
        # Provide appropriate arguments or remove if not needed
        echo "Invalid command"
        exit 1
        ;;
esac

# Explicitly log the contents of ${OUTPUT}
$GTECH "Contents of ${OUTPUT}:"
$GTECH $($GCAT ${OUTPUT})
