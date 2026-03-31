#!/usr/bin/env bash
# install.sh — Install all .sh scripts to ~/bin so they can be called from anywhere
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ─── Config ───────────────────────────────────────────────────────────────────
INSTALL_DIR="$HOME/bin"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SHELL_RC=""

# Detect shell config file
detect_shell_rc() {
    case "$(basename "$SHELL")" in
        zsh)  SHELL_RC="$HOME/.zshrc" ;;
        bash) SHELL_RC="$HOME/.bashrc" ;;
        *)    SHELL_RC="$HOME/.profile" ;;
    esac
}

# ─── Usage ────────────────────────────────────────────────────────────────────
usage() {
    local cmd
    cmd=$(basename "$0")
    echo -e "${BOLD}Usage:${RESET}"
    echo -e "  $cmd              # Install all scripts to ~/bin"
    echo -e "  $cmd -i           # Interactive select — pick scripts to install"
    echo -e "  $cmd --uninstall  # Remove installed scripts"
    echo -e "  $cmd --list       # List what would be installed"
    echo -e "  $cmd -h           # Show this help"
    exit 0
}

# ─── Find installable scripts (exclude install.sh itself) ────────────────────
find_scripts() {
    local self
    self=$(basename "$0")
    find "$SCRIPT_DIR" -maxdepth 1 -name '*.sh' -type f ! -name "$self" | sort
}

# ─── List mode ────────────────────────────────────────────────────────────────
list_scripts() {
    echo -e "${BOLD}Scripts to install:${RESET}"
    echo ""
    local scripts
    scripts=$(find_scripts)
    if [[ -z "$scripts" ]]; then
        echo -e "  ${YELLOW}No .sh scripts found in ${SCRIPT_DIR}${RESET}"
        exit 0
    fi
    while IFS= read -r script; do
        local name
        name=$(basename "$script" .sh)
        echo -e "  ${CYAN}•${RESET} ${name}  ← $(basename "$script")"
    done <<< "$scripts"
    echo ""
    echo -e "  Install to: ${BOLD}${INSTALL_DIR}/${RESET}"
}

# ─── Read single keypress ─────────────────────────────────────────────────────
_KEY=""
read_key() {
    _KEY=""
    local key=""
    IFS= read -rsn1 key </dev/tty || true
    if [[ "$key" == $'\x1b' ]]; then
        local seq=""
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

# ─── TUI multi-select picker ─────────────────────────────────────────────────
# Sets SELECTED_INDICES=() with indexes of chosen items
SELECTED_INDICES=()
tui_select() {
    local title="$1"
    shift
    local items=("$@")
    local count=${#items[@]}
    local cursor=0
    local sel=()
    SELECTED_INDICES=()

    for (( j=0; j<count; j++ )); do sel+=(1); done

    tput civis 2>/dev/null || true
    stty -echo 2>/dev/null || true
    trap 'tput cnorm 2>/dev/null; stty echo 2>/dev/null; echo' EXIT INT TERM

    local total_lines=$(( 4 + count + 5 ))
    local first_draw=1

    while true; do
        if [[ "$first_draw" -eq 0 ]]; then
            printf '\033[%dA' "$total_lines"
        fi
        first_draw=0

        local sel_count=0
        for s in "${sel[@]}"; do (( sel_count += s )); done

        echo -e "${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}\033[K"
        echo -e "${BOLD}${CYAN}║  ${title}${RESET}\033[K"
        echo -e "${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}\033[K"
        echo -e " Selected: ${BOLD}${CYAN}${sel_count}${RESET} / ${count}\033[K"

        for (( j=0; j<count; j++ )); do
            local pointer="  "
            local check="○"
            local name_color=""
            if [[ $j -eq $cursor ]]; then pointer="${CYAN}➜${RESET} "; fi
            if [[ "${sel[$j]}" -eq 1 ]]; then
                check="${GREEN}●${RESET}"
                name_color="${GREEN}"
            fi
            printf "  %b %b %b%s${RESET}\033[K\n" "$pointer" "$check" "$name_color" "${items[$j]}"
        done

        echo -e "\033[K"
        echo -e "  ${CYAN}↑↓${RESET} Move  ${CYAN}Space${RESET} Toggle  ${CYAN}a${RESET} All  ${CYAN}Enter${RESET} Install  ${CYAN}q${RESET} Quit\033[K"
        echo -e "\033[K"
        echo -e "\033[K"
        echo -e "\033[K"

        read_key
        case "$_KEY" in
            UP)    (( cursor = (cursor - 1 + count) % count )) ;;
            DOWN)  (( cursor = (cursor + 1) % count )) ;;
            SPACE)
                if [[ "${sel[$cursor]}" -eq 0 ]]; then sel[$cursor]=1; else sel[$cursor]=0; fi
                ;;
            ALL)
                local all_on=1
                for s in "${sel[@]}"; do if [[ "$s" -eq 0 ]]; then all_on=0; break; fi; done
                if [[ "$all_on" -eq 1 ]]; then
                    for (( j=0; j<count; j++ )); do sel[$j]=0; done
                else
                    for (( j=0; j<count; j++ )); do sel[$j]=1; done
                fi
                ;;
            ENTER)
                tput cnorm 2>/dev/null || true
                stty echo 2>/dev/null || true
                trap - EXIT INT TERM
                for (( j=0; j<count; j++ )); do
                    if [[ "${sel[$j]}" -eq 1 ]]; then
                        SELECTED_INDICES+=("$j")
                    fi
                done
                return 0
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

# ─── Ensure ~/bin exists and is in PATH ───────────────────────────────────────
setup_bin_dir() {
    if [[ ! -d "$INSTALL_DIR" ]]; then
        echo -e "${YELLOW}Creating ${INSTALL_DIR}...${RESET}"
        mkdir -p "$INSTALL_DIR"
    fi

    # Check if ~/bin is in PATH
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        detect_shell_rc
        echo -e "${YELLOW}Adding ${INSTALL_DIR} to PATH in ${SHELL_RC}...${RESET}"

        {
            echo ""
            echo "# Added by force-quit installer"
            echo "export PATH=\"\$HOME/bin:\$PATH\""
        } >> "$SHELL_RC"

        export PATH="$INSTALL_DIR:$PATH"
        echo -e "${GREEN}✓ PATH updated. Run ${BOLD}source ${SHELL_RC}${RESET}${GREEN} or open a new terminal.${RESET}"
    fi
}

# ─── Install given script paths ───────────────────────────────────────────────
do_install() {
    local script_paths=("$@")

    if [[ ${#script_paths[@]} -eq 0 ]]; then
        echo -e "${YELLOW}No scripts selected.${RESET}"
        exit 0
    fi

    setup_bin_dir

    echo ""
    local installed=0
    for script in "${script_paths[@]}"; do
        local name
        name=$(basename "$script" .sh)
        local target="${INSTALL_DIR}/${name}"

        if [[ -L "$target" || -f "$target" ]]; then
            rm -f "$target"
        fi

        ln -sf "$script" "$target"
        chmod +x "$script"
        echo -e "  ${GREEN}✓${RESET} ${name}  → $(basename "$script")"
        ((installed++))
    done

    echo ""
    echo -e "${GREEN}${BOLD}✓ Installed ${installed} script(s) to ${INSTALL_DIR}${RESET}"
    echo ""
    echo -e "${BOLD}Now you can run from anywhere:${RESET}"
    for script in "${script_paths[@]}"; do
        local name
        name=$(basename "$script" .sh)
        echo -e "  ${CYAN}\$${RESET} ${name}"
    done
    echo ""

    if ! command -v "$(basename "${script_paths[0]}" .sh)" &>/dev/null; then
        detect_shell_rc
        echo -e "${YELLOW}⚠  Run: ${BOLD}source ${SHELL_RC}${RESET}${YELLOW} to activate PATH${RESET}"
    fi
}

# ─── Install all ──────────────────────────────────────────────────────────────
install_all() {
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}${CYAN}║  📦 Install All Scripts              ║${RESET}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}"

    local scripts
    scripts=$(find_scripts)

    if [[ -z "$scripts" ]]; then
        echo -e "${YELLOW}No .sh scripts found in ${SCRIPT_DIR}${RESET}"
        exit 0
    fi

    local arr=()
    while IFS= read -r s; do arr+=("$s"); done <<< "$scripts"
    do_install "${arr[@]}"
}

# ─── Interactive install (TUI picker) ────────────────────────────────────────
interactive_install() {
    local scripts
    scripts=$(find_scripts)

    if [[ -z "$scripts" ]]; then
        echo -e "${YELLOW}No .sh scripts found in ${SCRIPT_DIR}${RESET}"
        exit 0
    fi

    # Build arrays
    local script_paths=()
    local display_names=()
    while IFS= read -r s; do
        script_paths+=("$s")
        display_names+=("$(basename "$s" .sh)  ← $(basename "$s")")
    done <<< "$scripts"

    tui_select "📦 Select Scripts to Install   " "${display_names[@]}"

    if [[ ${#SELECTED_INDICES[@]} -eq 0 ]]; then
        echo ""
        echo -e "${YELLOW}No scripts selected.${RESET}"
        exit 0
    fi

    local chosen=()
    for idx in "${SELECTED_INDICES[@]}"; do
        chosen+=("${script_paths[$idx]}")
    done

    do_install "${chosen[@]}"
}

# ─── Uninstall ────────────────────────────────────────────────────────────────
uninstall_scripts() {
    echo -e "${BOLD}Uninstalling scripts from ${INSTALL_DIR}...${RESET}"
    echo ""

    local scripts
    scripts=$(find_scripts)
    local removed=0

    while IFS= read -r script; do
        local name
        name=$(basename "$script" .sh)
        local target="${INSTALL_DIR}/${name}"

        if [[ -L "$target" || -f "$target" ]]; then
            rm -f "$target"
            echo -e "  ${RED}✗${RESET} Removed ${name}"
            ((removed++))
        fi
    done <<< "$scripts"

    if [[ "$removed" -eq 0 ]]; then
        echo -e "  ${YELLOW}Nothing to remove.${RESET}"
    else
        echo ""
        echo -e "${GREEN}✓ Removed ${removed} script(s).${RESET}"
    fi
}

# ─── Main ─────────────────────────────────────────────────────────────────────
case "${1:-}" in
    -i)          interactive_install ;;
    --uninstall) uninstall_scripts ;;
    --list)      list_scripts ;;
    -h|--help)   usage ;;
    "")          install_all ;;
    *)           echo -e "${RED}✗ Unknown option: $1${RESET}"; usage ;;
esac
