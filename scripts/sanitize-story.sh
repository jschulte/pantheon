#!/bin/bash
# sanitize-story.sh - Pre-processing sanitization for story files
#
# Strips HTML comments, detects injection patterns, and validates content
# before the story enters the pipeline. Run BEFORE pipeline ingestion.
#
# Usage:
#   ./scripts/sanitize-story.sh <story-file>
#   ./scripts/sanitize-story.sh docs/sprint-artifacts/story-17-10.md
#
# Exit codes:
#   0 - Clean (or clean after sanitization)
#   1 - Blocked (injection detected, requires manual review)
#   2 - Usage error

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <story-file>"
  exit 2
fi

STORY_FILE="$1"
WARNINGS=0
BLOCKED=0

if [ ! -f "$STORY_FILE" ]; then
  echo "ERROR: File not found: $STORY_FILE"
  exit 2
fi

echo "Sanitizing: $STORY_FILE"
echo ""

# ─────────────────────────────────────────────
# 1. Strip HTML comments (defense-in-depth)
# ─────────────────────────────────────────────
COMMENT_COUNT=$(grep -c '<!--' "$STORY_FILE" 2>/dev/null || true)
if [ "$COMMENT_COUNT" -gt 0 ]; then
  echo "STRIP  Removing $COMMENT_COUNT HTML comment(s)"
  # Remove single-line comments
  sed -i '' 's/<!--.*-->//g' "$STORY_FILE"
  # Remove multi-line comments
  sed -i '' '/<!--/,/-->/d' "$STORY_FILE"
  WARNINGS=$((WARNINGS + 1))
fi

# ─────────────────────────────────────────────
# 2. Detect prompt injection patterns
# ─────────────────────────────────────────────
INJECTION_PATTERNS=(
  "ignore previous instructions"
  "ignore all previous"
  "you are now"
  "new system prompt"
  "override your instructions"
  "disregard your"
  "forget your instructions"
  "act as if you"
  "<system>"
  "</system>"
  "IMPORTANT: override"
)

for pattern in "${INJECTION_PATTERNS[@]}"; do
  if grep -qi "$pattern" "$STORY_FILE" 2>/dev/null; then
    echo "BLOCK  Injection pattern detected: \"$pattern\""
    BLOCKED=$((BLOCKED + 1))
  fi
done

# ─────────────────────────────────────────────
# 3. Detect suspicious XML/HTML tags in content
# ─────────────────────────────────────────────
SUSPICIOUS_TAGS=$(grep -ciE '<(system|prompt|instruction|override|admin|root)' "$STORY_FILE" 2>/dev/null || true)
if [ "$SUSPICIOUS_TAGS" -gt 0 ]; then
  echo "WARN   $SUSPICIOUS_TAGS suspicious XML/HTML tag(s) found"
  WARNINGS=$((WARNINGS + 1))
fi

# ─────────────────────────────────────────────
# 4. Detect shell metacharacters in story key positions
# ─────────────────────────────────────────────
# Story titles/keys should be alphanumeric + hyphens only
TITLE_LINE=$(grep -m1 "^## Story:" "$STORY_FILE" 2>/dev/null || true)
if [ -n "$TITLE_LINE" ]; then
  if echo "$TITLE_LINE" | grep -qE '[;|$\`&<>]'; then
    echo "BLOCK  Shell metacharacters in story title"
    BLOCKED=$((BLOCKED + 1))
  fi
fi

# ─────────────────────────────────────────────
# 5. Compute content hash for integrity verification
# ─────────────────────────────────────────────
HASH=$(shasum -a 256 "$STORY_FILE" | awk '{print $1}')
echo ""
echo "SHA256: $HASH"

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
echo ""
if [ "$BLOCKED" -gt 0 ]; then
  echo "BLOCKED: $BLOCKED injection pattern(s) detected."
  echo "This story requires manual review before pipeline ingestion."
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo "CLEAN (with $WARNINGS warning(s) addressed)"
  exit 0
else
  echo "CLEAN"
  exit 0
fi
