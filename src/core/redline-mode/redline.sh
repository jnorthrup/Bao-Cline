#!/usr/bin/env bash

set -evx

echo "Initializing redline protocol..."
# AI DO NOT EDIT ENCLOSED -------
: GWHICH=${GWHICH:=($(which "{g,}which") )}
: GMKTEMP=${GMKTEMP:=( $($GWHICH {g,}mktemp) ) }
: GHEAD=${GHEAD:=($($GWHICH {g,}head))}
: GTAIL=${GTAIL:=( $($GWHICH {g,}tail) )}
: GGREP=${GGREP:=( $($GWHICH {g,}grep) )}
: GCAT=${GCAT:=( $($GWHICH {g,}cat) )}
: GECHO=${GECHO:=( $($GWHICH {g,}echo) )}
: GWC=${GWC:=( $($GWHICH {g,}wc) )}
: GTEE=${GTEE:=( $($GWHICH {g,}tee) )}
: GMV=${GMV:=( $($GWHICH {g,}mv) )} 
: GCP=${GCP:=( $($GWHICH {g,}cp) )}
: GFIND=${GFIND:=( $($GWHICH {g,}find) )}
: GDIFF=${GDIFF:=( $($GWHICH {g,}diff) )}
: GSED=${GSED:=( $($GWHICH {g,}sed) )}
 
# Initialize output file
export OUTPUT=${OUTPUT:=$($GMKTEMP)}
 
# Combined echo and tee function
function TECH() {
    $GECHO "$@" |$GTEE -a $OUTPUT
}
GTECH=TECH
#AI DO NOT EDIT ABOVE ---------------------------  

function _scan() {
    local regex="(?<gitignore-pattern>[\w\-.*?\[\]{}]+)\s+(?<pattern>(?:[\w\-().\[\]{}]+|\(.*\))*)$"
    local full_regex='^\s+scan\s+$regex'
    regex="([\w\-.*?\[\]{}]+)\s+((?:[\w\-().\[\]{}]+|\(.*\))*)$"

    if [[ -z "$1" && -z "$2" ]]; then
        $GTECH $full_regex
        return 1
    fi
}

function scan() {
    _scan "$@" && return 1
    
    local globpat="$1"
    local pattern="$2"
    local files=$($GFIND . -type f \( -iname "$globpat" -o -path "*/$globpat" \))
    
    if [[ -z "$files" ]]; then
        $GTECH "Error: No files matching pattern '$globpat'"
        return 1
    fi

    $GTECH "Scanning for pattern: $pattern in files matching: $globpat"
    $GGREP -nC 2 -P "$pattern" $files | $GTEE -a ${OUTPUT} || return 1
}

function _edit() {
    local regex="^([\w\-\.]+)\s+(.+)\s+(\d+)\s+(\d+)$"
    local full_regex='^\s+edit\s+(?<file>[\w\-\.]+)\s+(?<new_text>.+)\s+(?<start>\d+)\s+(?<end>\d+)$'
    
    if [[ "$1 $2 $3 $4" =~ $regex ]]; then
        return 0
    else
        $GTECH $full_regex
        return 1
    fi
}

function edit() {
    if ! _edit "$@"; then
        exit 1
    fi
    
    local file="$1"
    local new_text="$2"
    local start="$3"
    local end="$4"

    if [[ ! -f "$file" ]]; then
        $GTECH "Error: File '$file' does not exist"
        return 1
    fi

    local total_lines=$($GWC -l < "$file")
    
    if [[ "$start" -le 0 || "$end" -le 0 || 
          "$start" -gt "$total_lines" || 
          "$end" -gt $((total_lines + 1)) || 
          "$start" -ge "$end" ]]; then
        $GTECH "Error: Invalid line range $start to $end (file has $total_lines lines)"
        return 1
    fi

    local tmpfile=$(mktemp)
    $GTECH "Editing file: $file from line $start to $end"
    $GTECH "New content: $new_text"
    $GCAT <($GHEAD -n "$((start-1))" "$file") <<< "$new_text" <($GTAIL -n "+$((end))" "$file") > "$tmpfile"
    $GMV -f "$tmpfile" "$file" | $GTEE -a ${OUTPUT}
}

function _verify() {
    local regex="^(?<file1>[\w\-\.]+)\s+(?<file2>[\w\-\.]+)\s+(?<start>\d+)\s+(?<end>\d+)$"
    local full_regex='^\s+verify\s+$regex'
    regex="^([\w\-\.]+)\s+([\w\-\.]+)\s+(\d+)\s+(\d+)$"
    
    if [[ -z "$1" && -z "$2" && -z "$3" && -z "$4" ]]; then
        $GTECH $full_regex
        return 1
    fi
    return 0
}

function verify() {
    if ! _verify "$@"; then
        return 1
    fi

    local file1="$1"
    local file2="$2"
    local start="$3"
    local end="$4"
    local lines1=$($GWC -l < "$file1")
    local lines2=$($GWC -l < "$file2")
    local max_lines=$((lines1 > lines2 ? lines1 : lines2))

    if [[ "$start" -le 0 || "$end" -le 0 || 
          "$start" -gt "$max_lines" || 
          "$end" -gt $((max_lines + 1)) || 
          "$start" -ge "$end" ]]; then
        $GTECH "Error: Invalid line range $start to $end (files have $lines1 and $lines2 lines)"
        return 1
    fi

    local diff_output=$($GDIFF \
        <($GTAIL -n +$start "$file1" | $GHEAD -n $((end - start + 1))) \
        <($GTAIL -n +$start "$file2" | $GHEAD -n $((end - start + 1))))
    
    if [[ -n "$diff_output" ]]; then
        $GTECH "Differences found between files in the specified range:"
        $GTECH "$diff_output"
        return 1
    fi
    
    $GTECH "No differences found between files in the specified range."
    return 0
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
    *)  _scan 
        _edit
        _verify
        ;;
esac
