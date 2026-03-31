#!/bin/bash

# brewup - Homebrew update and upgrade script
# Runs daily at 12:00 PM

LOG_FILE="$HOME/.brewup.log"
BREW="/opt/homebrew/bin/brew"
LOG_RETENTION_DAYS=7

# Rotate log - keep only last 7 days
if [[ -f "$LOG_FILE" ]]; then
    temp_log=$(mktemp)
    week_ago=$(date -v-${LOG_RETENTION_DAYS}d +%s)

    current_block=""
    block_date=0

    while IFS= read -r line || [[ -n "$line" ]]; do
        if [[ "$line" == "========"* ]]; then
            if [[ -n "$current_block" && $block_date -ge $week_ago ]]; then
                echo "$current_block" >> "$temp_log"
            fi
            current_block="$line"
            block_date=0
        elif [[ "$line" =~ ^Brew\ update\ started\ at\ (.+)$ ]]; then
            block_date=$(date -j -f "%a %b %d %T %Z %Y" "${BASH_REMATCH[1]}" +%s 2>/dev/null || echo 0)
            current_block+=$'\n'"$line"
        else
            current_block+=$'\n'"$line"
        fi
    done < "$LOG_FILE"

    if [[ -n "$current_block" && $block_date -ge $week_ago ]]; then
        echo "$current_block" >> "$temp_log"
    fi

    mv "$temp_log" "$LOG_FILE"
fi

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================" >> "$LOG_FILE"
echo "Brew update started at $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

STEP_OK=0
STEP_FAIL=0
STEP=1

run_step() {
    local label="$1"
    local step_num="$2"
    local total="$3"
    shift 3
    echo -e "${YELLOW}[${step_num}/${total}]${NC} ${label}"
    echo ">> $*" >> "$LOG_FILE"
    if "$@" >> "$LOG_FILE" 2>&1; then
        echo -e "      ${GREEN}✓${NC} Done"
        ((STEP_OK++))
    else
        echo -e "      ${RED}✗${NC} Failed (see $LOG_FILE)"
        echo "!! FAILED: $*" >> "$LOG_FILE"
        ((STEP_FAIL++))
    fi
}

echo -e "${BLUE}🍺 Homebrew Update${NC}"
echo ""

# Discover installed packages dynamically (bash 3.2 compatible)
FORMULAE=()
while IFS= read -r pkg; do [[ -n "$pkg" ]] && FORMULAE+=("$pkg"); done < <($BREW list --formula 2>/dev/null)
CASKS=()
while IFS= read -r pkg; do [[ -n "$pkg" ]] && CASKS+=("$pkg");    done < <($BREW list --cask   2>/dev/null)

HAS_MAS=false
command -v mas &>/dev/null && HAS_MAS=true

# Capture version info into temp files for lookup
# brew list --versions  →  "name ver"  or  "name ver1 ver2"  (last word = active)
# brew outdated --verbose →  "name (installed) < latest"     (last word = target)
VERSIONS_FILE=$(mktemp)
OUTDATED_FILE=$(mktemp)
trap 'rm -f "$VERSIONS_FILE" "$OUTDATED_FILE"' EXIT

$BREW list --versions --formula 2>/dev/null >  "$VERSIONS_FILE"
$BREW list --versions --cask    2>/dev/null >> "$VERSIONS_FILE"
$BREW outdated --formula --verbose          2>/dev/null >  "$OUTDATED_FILE"
$BREW outdated --cask --greedy --verbose    2>/dev/null >> "$OUTDATED_FILE"

# Build label "name (installed)" or "name (installed → latest)" if outdated
pkg_label() {
    local name="$1"
    local ver_line outdated_line installed latest
    ver_line=$(grep "^${name} " "$VERSIONS_FILE" | head -1)
    outdated_line=$(grep "^${name} " "$OUTDATED_FILE" | head -1)
    installed="${ver_line##* }"       # last word of versions line
    latest="${outdated_line##* }"     # last word of outdated line = target version
    if [[ -n "$outdated_line" && "$latest" != "$name" ]]; then
        echo "$name ($installed → $latest)"
    elif [[ -n "$installed" && "$installed" != "$name" ]]; then
        echo "$name ($installed)"
    else
        echo "$name"
    fi
}

# Total steps: 1 (update) + formulae + casks + 1 (cleanup) + 1? (mas)
MAS_STEP=$($HAS_MAS && echo 1 || echo 0)
TOTAL=$(( 1 + ${#FORMULAE[@]} + ${#CASKS[@]} + 1 + MAS_STEP ))

echo -e "${BLUE}📋 Installed:${NC} ${#FORMULAE[@]} formulae, ${#CASKS[@]} casks"

# Show outdated summary
count_lines() { [[ -z "$1" ]] && echo 0 || echo "$1" | wc -l | tr -d ' '; }
OUTDATED_FORMULAE=$($BREW outdated --formula 2>/dev/null)
OUTDATED_CASKS=$($BREW outdated --cask --greedy 2>/dev/null)
OUTDATED_COUNT=$(( $(count_lines "$OUTDATED_FORMULAE") + $(count_lines "$OUTDATED_CASKS") ))

if [[ $OUTDATED_COUNT -gt 0 ]]; then
    echo -e "${YELLOW}📦 Outdated: ${OUTDATED_COUNT}${NC}"
    [[ -n "$OUTDATED_FORMULAE" ]] && echo -e "   Formulae: $(echo "$OUTDATED_FORMULAE" | tr '\n' ' ')"
    [[ -n "$OUTDATED_CASKS" ]]    && echo -e "   Casks:    $(echo "$OUTDATED_CASKS" | tr '\n' ' ')"
else
    echo -e "${GREEN}✓ Everything is up to date${NC}"
fi
echo ""

echo "Installed formulae (${#FORMULAE[@]}): ${FORMULAE[*]}" >> "$LOG_FILE"
echo "Installed casks (${#CASKS[@]}): ${CASKS[*]}"           >> "$LOG_FILE"
echo "Outdated ($OUTDATED_COUNT): $OUTDATED_FORMULAE $OUTDATED_CASKS" >> "$LOG_FILE"

# Step 1: Update Homebrew
run_step "Updating Homebrew" $STEP $TOTAL $BREW update
((STEP++))

# Upgrade each formula individually
if [[ ${#FORMULAE[@]} -gt 0 ]]; then
    echo ""
    echo -e "${BLUE}🔧 Formulae (${#FORMULAE[@]})${NC}"
    for formula in "${FORMULAE[@]}"; do
        run_step "$(pkg_label "$formula")" $STEP $TOTAL $BREW upgrade --formula "$formula"
        ((STEP++))
    done
fi

# Upgrade each cask individually
if [[ ${#CASKS[@]} -gt 0 ]]; then
    echo ""
    echo -e "${BLUE}📦 Casks (${#CASKS[@]})${NC}"
    for cask in "${CASKS[@]}"; do
        run_step "$(pkg_label "$cask")" $STEP $TOTAL $BREW upgrade --cask --greedy "$cask"
        ((STEP++))
    done
fi

echo ""

# Cleanup
run_step "Cleaning up" $STEP $TOTAL $BREW cleanup
((STEP++))

# Mac App Store (if mas installed)
if $HAS_MAS; then
    run_step "Upgrading Mac App Store apps" $STEP $TOTAL mas upgrade
fi

echo ""
if [[ $STEP_FAIL -eq 0 ]]; then
    echo -e "${GREEN}✓ All done! (${STEP_OK} steps completed)${NC}"
else
    echo -e "${YELLOW}⚠ Done with issues: ${STEP_OK} ok, ${RED}${STEP_FAIL} failed${NC}"
fi

echo "Brew update completed at $(date) — OK:$STEP_OK FAIL:$STEP_FAIL" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
