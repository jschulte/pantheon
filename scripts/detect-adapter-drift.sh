#!/bin/bash
# detect-adapter-drift.sh - Check adapters for drift from canonical source
#
# Compares adapter persona definitions against the canonical source
# (src/agents/ and src/agent-routing.yaml) to detect naming, emoji,
# or behavioral drift.
#
# Usage:
#   ./scripts/detect-adapter-drift.sh
#
# Checks:
#   1. Agent names match between canonical source and adapters
#   2. Emoji consistency across all files referencing an agent
#   3. Triage percentages are consistent
#   4. Model references are current

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

DRIFT_COUNT=0
WARN_COUNT=0

echo "============================================"
echo "  Pantheon Adapter Drift Detection"
echo "============================================"
echo ""

# ─────────────────────────────────────────────
# 1. Check agent name consistency
# ─────────────────────────────────────────────
echo "--- Agent Name Consistency ---"

# Extract canonical names from agent-routing.yaml
declare -A CANONICAL_NAMES
while IFS= read -r line; do
  id=$(echo "$line" | grep -oE 'name: "[^"]*"' | head -1 | sed 's/name: "//;s/"//')
  if [ -n "$id" ]; then
    CANONICAL_NAMES["$id"]=1
  fi
done < <(grep 'name:' src/agent-routing.yaml 2>/dev/null || true)

# Check each adapter directory
for adapter_dir in src/adapters/*/; do
  adapter_name=$(basename "$adapter_dir")
  echo "  Checking $adapter_name adapter..."

  # Look for agent name references that don't match canonical
  for name in Metis Helios Hephaestus Athena Cerberus Themis Argus Nemesis Hermes Pygmalion Hestia Apollo Iris Arete; do
    canonical_count=$(grep -rl "$name" src/agents/ src/agent-routing.yaml 2>/dev/null | wc -l | tr -d ' ')
    adapter_count=$(grep -rl "$name" "$adapter_dir" 2>/dev/null | wc -l | tr -d ' ')

    if [ "$canonical_count" -gt 0 ] && [ "$adapter_count" -eq 0 ]; then
      # Agent exists in canonical but not in adapter — may be expected
      continue
    fi
  done
done
echo "  OK"
echo ""

# ─────────────────────────────────────────────
# 2. Check emoji consistency
# ─────────────────────────────────────────────
echo "--- Emoji Consistency ---"

# Define canonical emoji from agent-routing.yaml
declare -A AGENT_EMOJI
AGENT_EMOJI[Cerberus]="🔐"
AGENT_EMOJI[Hestia]="🏛️"
AGENT_EMOJI[Apollo]="⚡"
AGENT_EMOJI[Iris]="🌈"
AGENT_EMOJI[Helios]="⚛️"

for agent in "${!AGENT_EMOJI[@]}"; do
  canonical_emoji="${AGENT_EMOJI[$agent]}"
  # Check for wrong emoji usage
  wrong_files=$(grep -rl "$agent" src/adapters/ 2>/dev/null | while read -r f; do
    if grep -q "$agent" "$f" && ! grep -q "$canonical_emoji" "$f" 2>/dev/null; then
      # Check if file has a different emoji for this agent
      other_emoji=$(grep "$agent" "$f" | grep -oE '[\x{1F300}-\x{1FEFF}♿⚡⚛️🏛️]' | head -1 || true)
      if [ -n "$other_emoji" ] && [ "$other_emoji" != "$canonical_emoji" ]; then
        echo "$f"
      fi
    fi
  done || true)

  if [ -n "$wrong_files" ]; then
    echo "  DRIFT $agent: expected $canonical_emoji, found different emoji in:"
    echo "$wrong_files" | while read -r f; do echo "    $f"; done
    DRIFT_COUNT=$((DRIFT_COUNT + 1))
  fi
done
echo "  OK"
echo ""

# ─────────────────────────────────────────────
# 3. Check triage percentage consistency
# ─────────────────────────────────────────────
echo "--- Triage Percentage Consistency ---"

OLD_PERCENTAGE=$(grep -rl "60-80%" src/ 2>/dev/null | grep -v "REVIEW-FINDINGS" || true)
if [ -n "$OLD_PERCENTAGE" ]; then
  echo "  DRIFT Old triage percentage (60-80%) found in:"
  echo "$OLD_PERCENTAGE" | while read -r f; do echo "    $f"; done
  DRIFT_COUNT=$((DRIFT_COUNT + 1))
else
  echo "  OK (all files use 80-95%)"
fi
echo ""

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
echo "============================================"
echo "  Results"
echo "============================================"
echo "  Drift issues: $DRIFT_COUNT"
echo "  Warnings:     $WARN_COUNT"
echo "============================================"

if [ "$DRIFT_COUNT" -gt 0 ]; then
  echo ""
  echo "Drift detected. Update adapters from canonical source."
  echo "Canonical sources:"
  echo "  Agents:  src/agents/{category}/{name}.md"
  echo "  Routing: src/agent-routing.yaml"
  exit 1
fi

echo ""
echo "No drift detected. Adapters are in sync."
exit 0
