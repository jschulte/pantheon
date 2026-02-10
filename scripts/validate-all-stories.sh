#!/bin/bash
# validate-all-stories.sh - Pre-batch validation for story files
#
# Validates that all ready-for-dev stories meet the 12-section BMAD format
# requirements before running batch-stories.
#
# Usage:
#   ./scripts/validate-all-stories.sh [story-dir]
#
# Arguments:
#   story-dir  Path to sprint artifacts directory (default: docs/sprint-artifacts)

set -euo pipefail

STORY_DIR="${1:-docs/sprint-artifacts}"
ERRORS=0
WARNINGS=0
VALID=0
TOTAL=0

# Required BMAD sections (12 sections)
REQUIRED_SECTIONS=(
  "Business Context"
  "Current State"
  "Acceptance Criteria"
  "Tasks"
  "Technical Requirements"
  "Architecture Compliance"
  "Testing Requirements"
  "Dev Agent Guardrails"
  "Definition of Done"
  "References"
  "Dev Agent Record"
  "Change Log"
)

echo "============================================"
echo "  Pantheon Story Validation"
echo "============================================"
echo ""
echo "Scanning: $STORY_DIR"
echo ""

# Check directory exists
if [ ! -d "$STORY_DIR" ]; then
  echo "ERROR: Story directory not found: $STORY_DIR"
  exit 1
fi

# Find all story files
for file in "$STORY_DIR"/story-*.md; do
  [ -f "$file" ] || continue
  TOTAL=$((TOTAL + 1))
  story_name=$(basename "$file" .md)
  missing_sections=()

  # Check for all 12 required sections
  for section in "${REQUIRED_SECTIONS[@]}"; do
    if ! grep -qi "^## .*${section}" "$file" 2>/dev/null; then
      missing_sections+=("$section")
    fi
  done

  if [ ${#missing_sections[@]} -gt 0 ]; then
    section_count=$((12 - ${#missing_sections[@]}))
    echo "FAIL  $story_name ($section_count/12 sections)"
    for s in "${missing_sections[@]}"; do
      echo "       Missing: $s"
    done
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Check for tasks (at least 3 unchecked)
  task_count=$(grep -c '^- \[ \]' "$file" 2>/dev/null || true)
  if [ "$task_count" -lt 3 ]; then
    echo "WARN  $story_name (12/12 sections, but only $task_count unchecked tasks)"
    WARNINGS=$((WARNINGS + 1))
    continue
  fi

  # Check Current State has substantial content (rough word count)
  current_state_words=0
  in_section=0
  while IFS= read -r line; do
    if echo "$line" | grep -qi "^## .*Current State"; then
      in_section=1
      continue
    fi
    if [ "$in_section" -eq 1 ] && echo "$line" | grep -q "^## "; then
      break
    fi
    if [ "$in_section" -eq 1 ]; then
      words=$(echo "$line" | wc -w | tr -d ' ')
      current_state_words=$((current_state_words + words))
    fi
  done < "$file"

  if [ "$current_state_words" -lt 50 ]; then
    echo "WARN  $story_name (12/12 sections, Current State may be stub: ~${current_state_words} words)"
    WARNINGS=$((WARNINGS + 1))
    continue
  fi

  # Check file size (story quality heuristic)
  file_size=$(wc -c < "$file" | tr -d ' ')
  if [ "$file_size" -lt 3000 ]; then
    echo "WARN  $story_name (12/12 sections, $task_count tasks, ${file_size}B — likely too thin)"
    echo "       Stories under 3KB rarely have enough context for quality implementation."
    echo "       Most stories should be 10KB+ for non-trivial work."
    WARNINGS=$((WARNINGS + 1))
    continue
  elif [ "$file_size" -lt 6000 ]; then
    echo "WARN  $story_name (12/12 sections, $task_count tasks, ${file_size}B — may be thin)"
    echo "       Consider enriching: Business Context, Acceptance Criteria, Technical Requirements."
    WARNINGS=$((WARNINGS + 1))
    continue
  fi

  size_kb=$((file_size / 1024))
  echo "OK    $story_name (12/12 sections, $task_count tasks, ${size_kb}KB)"
  VALID=$((VALID + 1))
done

echo ""
echo "============================================"
echo "  Results"
echo "============================================"
echo "  Total:    $TOTAL"
echo "  Valid:    $VALID"
echo "  Warnings: $WARNINGS"
echo "  Errors:   $ERRORS"
echo "============================================"

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "Fix errors before running batch-stories."
  echo "Use /create-story-with-gap-analysis to regenerate incomplete stories."
  exit 1
fi

if [ "$TOTAL" -eq 0 ]; then
  echo ""
  echo "No story files found in $STORY_DIR"
  echo "Expected files matching: story-*.md"
  exit 1
fi

echo ""
echo "All stories validated. Ready for batch-stories."
echo ""
echo "Tip: Stories under 10KB often lack sufficient context for quality"
echo "implementation. If results aren't meeting expectations, enrich your"
echo "story files with more detailed Business Context, Acceptance Criteria,"
echo "Technical Requirements, and Dev Agent Guardrails."
