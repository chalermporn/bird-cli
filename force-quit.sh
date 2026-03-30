#!/usr/bin/env bash
# force-quit.sh — Interactive force quit for macOS applications
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ─── Usage ────────────────────────────────────────────────────────────────────
usage() {
    local cmd
    cmd=$(basename "$0")
    echo -e "${BOLD}Usage:${RESET}"
    echo -e "  $cmd              # Interactive mode — list & pick app to kill"
    echo -e "  $cmd -i           # Multi-select mode — toggle multiple apps to kill"
    echo -e "  $cmd <app_name>   # Kill app by name (e.g. \"Safari\", \"Finder\")"
    echo -e "  $cmd -p <PID>     # Kill by process ID"
    echo -e "  $cmd -l           # List running GUI applications"
    echo -e "  $cmd -h           # Show this help"
    echo ""
    echo -e "${BOLD}Examples:${RESET}"
    echo -e "  $cmd Safari"
    echo -e "  $cmd -p 12345"
    echo -e "  $cmd              # interactive picker"
    exit 0
}

# ─── List running GUI apps ────────────────────────────────────────────────────
list_apps() {
    osascript -e '
        tell application "System Events"
            set appList to name of every process whose background only is false
        end tell
        set AppleScript'\''s text item delimiters to linefeed
        return appList as text
    ' 2>/dev/null
}

# ─── Force quit by app name ──────────────────────────────────────────────────
force_quit_by_name() {
    local app_name="$1"

    # Check if app is running
    if ! pgrep -xiq "$app_name" 2>/dev/null; then
        # Try partial match
        if ! pgrep -if "$app_name" >/dev/null 2>&1; then
            echo -e "${RED}✗ '$app_name' is not running.${RESET}"
            exit 1
        fi
    fi

    echo -e "${YELLOW}⚡ Force quitting '${app_name}'...${RESET}"

    # Try graceful quit first via AppleScript
    if osascript -e "tell application \"$app_name\" to quit" 2>/dev/null; then
        sleep 1
        # Check if still running
        if ! pgrep -xiq "$app_name" 2>/dev/null; then
            echo -e "${GREEN}✓ '$app_name' quit gracefully.${RESET}"
            return 0
        fi
    fi

    # Force kill with killall
    if killall -9 "$app_name" 2>/dev/null; then
        echo -e "${GREEN}✓ '$app_name' force killed.${RESET}"
    else
        # Try case-insensitive pkill as fallback
        if pkill -9 -if "$app_name" 2>/dev/null; then
            echo -e "${GREEN}✓ '$app_name' force killed (via pkill).${RESET}"
        else
            echo -e "${RED}✗ Failed to kill '$app_name'. Try with sudo or check the name.${RESET}"
            exit 1
        fi
    fi
}

# ─── Force quit by PID ───────────────────────────────────────────────────────
force_quit_by_pid() {
    local pid="$1"

    if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
        echo -e "${RED}✗ Invalid PID: '$pid'${RESET}"
        exit 1
    fi

    if ! kill -0 "$pid" 2>/dev/null; then
        echo -e "${RED}✗ No process with PID $pid.${RESET}"
        exit 1
    fi

    local proc_name
    proc_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")

    echo -e "${YELLOW}⚡ Force killing PID $pid ($proc_name)...${RESET}"
    if kill -9 "$pid" 2>/dev/null; then
        echo -e "${GREEN}✓ PID $pid killed.${RESET}"
    else
        echo -e "${RED}✗ Failed to kill PID $pid. Try: sudo kill -9 $pid${RESET}"
        exit 1
    fi
}

# ─── Interactive picker ───────────────────────────────────────────────────────
interactive_picker() {
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}${CYAN}║    ⚡ Force Quit Application         ║${RESET}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}"
    echo ""

    local apps
    apps=$(list_apps)

    if [[ -z "$apps" ]]; then
        echo -e "${RED}✗ No GUI applications found.${RESET}"
        exit 1
    fi

    # Display numbered list
    local i=1
    local app_array=()
    while IFS= read -r app; do
        app_array+=("$app")
        printf "  ${CYAN}%2d)${RESET} %s\n" "$i" "$app"
        ((i++))
    done <<< "$apps"

    echo ""
    echo -e "  ${CYAN} 0)${RESET} Cancel"
    echo ""
    read -rp "$(echo -e "${BOLD}Select app to force quit [0-$((i-1))]: ${RESET}")" choice

    # Validate input
    if [[ -z "$choice" ]] || ! [[ "$choice" =~ ^[0-9]+$ ]]; then
        echo -e "${YELLOW}Cancelled.${RESET}"
        exit 0
    fi

    if [[ "$choice" -eq 0 ]]; then
        echo -e "${YELLOW}Cancelled.${RESET}"
        exit 0
    fi

    if [[ "$choice" -lt 1 ]] || [[ "$choice" -ge "$i" ]]; then
        echo -e "${RED}✗ Invalid selection.${RESET}"
        exit 1
    fi

    local selected="${app_array[$((choice-1))]}"

    # Confirm
    read -rp "$(echo -e "${YELLOW}Force quit '${selected}'? [y/N]: ${RESET}")" confirm
    if [[ "$confirm" == [yY] ]]; then
        force_quit_by_name "$selected"
    else
        echo -e "${YELLOW}Cancelled.${RESET}"
    fi
}

# ─── Read single keypress (including arrow key sequences) ─────────────────────
# Sets global _KEY instead of echo — avoids subshell issues with terminal input
_KEY=""
read_key() {
    _KEY=""
    local key=""
    IFS= read -rsn1 key </dev/tty || true
    # Detect escape sequence (arrow keys send ESC [ A/B/C/D)
    if [[ "$key" == $'\x1b' ]]; then
        local seq=""
        # Read 2 bytes at once — [A, [B, etc. are already in the input buffer
        IFS= read -rsn2 -t 1 seq </dev/tty || true
        case "$seq" in
            '[A') _KEY="UP" ;;
            '[B') _KEY="DOWN" ;;
            *)    _KEY="ESC" ;;
        esac
    elif [[ "$key" == " " ]]; then
        _KEY="SPACE"
    elif [[ "$key" == "" ]]; then
        _KEY="ENTER"
    elif [[ "$key" == "a" || "$key" == "A" ]]; then
        _KEY="ALL"
    elif [[ "$key" == "q" || "$key" == "Q" ]]; then
        _KEY="QUIT"
    else
        _KEY="OTHER"
    fi
}

# ─── Multi-select interactive picker (TUI) ───────────────────────────────────
multi_select_picker() {
    local apps
    apps=$(list_apps)

    if [[ -z "$apps" ]]; then
        echo -e "${RED}✗ No GUI applications found.${RESET}"
        exit 1
    fi

    local app_array=()
    while IFS= read -r app; do
        app_array+=("$app")
    done <<< "$apps"

    local count=${#app_array[@]}
    local cursor=0
    local selected=()
    for (( j=0; j<count; j++ )); do
        selected+=(0)
    done

    # Hide cursor & save terminal state
    tput civis 2>/dev/null || true
    stty -echo 2>/dev/null || true

    # Restore terminal on exit
    trap 'tput cnorm 2>/dev/null; stty echo 2>/dev/null; echo' EXIT INT TERM

    # Total lines to render (header 4 + apps + footer 5)
    local total_lines=$(( 4 + count + 5 ))

    # First draw
    local first_draw=1

    while true; do
        # Move cursor up to redraw (skip on first draw)
        if [[ "$first_draw" -eq 0 ]]; then
            printf '\033[%dA' "$total_lines"
        fi
        first_draw=0

        # Count selections
        local sel_count=0
        for s in "${selected[@]}"; do
            (( sel_count += s ))
        done

        # Header
        echo -e "${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}\033[K"
        echo -e "${BOLD}${CYAN}║  ⚡ Force Quit — Multi Select        ║${RESET}\033[K"
        echo -e "${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}\033[K"
        echo -e " Selected: ${BOLD}${CYAN}${sel_count}${RESET} / ${count}\033[K"

        # App list
        for (( j=0; j<count; j++ )); do
            local pointer="  "
            local check="○"
            local name_color=""

            if [[ $j -eq $cursor ]]; then
                pointer="${CYAN}▸${RESET} "
            fi

            if [[ "${selected[$j]}" -eq 1 ]]; then
                check="${GREEN}●${RESET}"
                name_color="${GREEN}"
            fi

            printf "  %b %b %b%s${RESET}\033[K\n" "$pointer" "$check" "$name_color" "${app_array[$j]}"
        done

        # Footer
        echo -e "\033[K"
        echo -e "  ${CYAN}↑↓${RESET} Move  ${CYAN}Space${RESET} Toggle  ${CYAN}a${RESET} All  ${CYAN}Enter${RESET} Confirm  ${CYAN}q${RESET} Quit\033[K"
        echo -e "\033[K"
        echo -e "\033[K"
        echo -e "\033[K"

        # Read keypress (sets _KEY global)
        read_key

        case "$_KEY" in
            UP)
                (( cursor = (cursor - 1 + count) % count ))
                ;;
            DOWN)
                (( cursor = (cursor + 1) % count ))
                ;;
            SPACE)
                if [[ "${selected[$cursor]}" -eq 0 ]]; then
                    selected[$cursor]=1
                else
                    selected[$cursor]=0
                fi
                ;;
            ALL)
                # Toggle: if all selected → deselect all, else select all
                local all_on=1
                for s in "${selected[@]}"; do
                    if [[ "$s" -eq 0 ]]; then all_on=0; break; fi
                done
                if [[ "$all_on" -eq 1 ]]; then
                    for (( j=0; j<count; j++ )); do selected[$j]=0; done
                else
                    for (( j=0; j<count; j++ )); do selected[$j]=1; done
                fi
                ;;
            ENTER)
                # Collect selected apps
                local to_kill=()
                for (( j=0; j<count; j++ )); do
                    if [[ "${selected[$j]}" -eq 1 ]]; then
                        to_kill+=("${app_array[$j]}")
                    fi
                done

                # Restore terminal before prompts
                tput cnorm 2>/dev/null || true
                stty echo 2>/dev/null || true
                trap - EXIT INT TERM

                if [[ ${#to_kill[@]} -eq 0 ]]; then
                    echo ""
                    echo -e "${YELLOW}No apps selected.${RESET}"
                    exit 0
                fi

                echo ""
                echo -e "${BOLD}Will force quit:${RESET}"
                for app in "${to_kill[@]}"; do
                    echo -e "  ${RED}✗${RESET} $app"
                done
                echo ""
                read -rp "$(echo -e "${YELLOW}Confirm? [y/N]: ${RESET}")" confirm
                if [[ "$confirm" == [yY] ]]; then
                    for app in "${to_kill[@]}"; do
                        force_quit_by_name "$app"
                    done
                else
                    echo -e "${YELLOW}Cancelled.${RESET}"
                fi
                exit 0
                ;;
            QUIT|ESC)
                tput cnorm 2>/dev/null || true
                stty echo 2>/dev/null || true
                trap - EXIT INT TERM
                echo ""
                echo -e "${YELLOW}Cancelled.${RESET}"
                exit 0
                ;;
        esac
    done
}

# ─── Main ─────────────────────────────────────────────────────────────────────
main() {
    # Parse flags
    while getopts ":p:lih" opt; do
        case "$opt" in
            p) force_quit_by_pid "$OPTARG"; exit 0 ;;
            i) multi_select_picker; exit 0 ;;
            l)
                echo -e "${BOLD}Running GUI Applications:${RESET}"
                list_apps | while IFS= read -r app; do
                    echo -e "  ${CYAN}•${RESET} $app"
                done
                exit 0
                ;;
            h) usage ;;
            \?) echo -e "${RED}✗ Unknown option: -$OPTARG${RESET}"; usage ;;
            :) echo -e "${RED}✗ Option -$OPTARG requires an argument.${RESET}"; exit 1 ;;
        esac
    done
    shift $((OPTIND - 1))

    # Direct app name argument
    if [[ $# -gt 0 ]]; then
        force_quit_by_name "$*"
        exit 0
    fi

    # No args → interactive mode
    interactive_picker
}

main "$@"
