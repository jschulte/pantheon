#!/bin/bash

# Pantheon - Multi-Platform Adapter Installer
# Installs appropriate adapter configurations for your AI coding platform

set -e
shopt -s nullglob

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Pantheon - Adapter Installer${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Parse arguments
PLATFORM=""
TARGET_DIR=""
FORCE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --platform|-p)
      PLATFORM="$2"
      shift 2
      ;;
    --target|-t)
      TARGET_DIR="$2"
      shift 2
      ;;
    --force|-f)
      FORCE=true
      shift
      ;;
    --help|-h)
      echo "Usage: install.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -p, --platform PLATFORM  Specify platform (opencode|copilot|codex|claude-code)"
      echo "  -t, --target DIR         Target project directory (default: current)"
      echo "  -f, --force              Overwrite existing files"
      echo "  -h, --help               Show this help"
      echo ""
      echo "Platforms:"
      echo "  opencode    - OpenCode AI (sst.dev)"
      echo "  copilot     - GitHub Copilot CLI / Agent Mode"
      echo "  codex       - OpenAI Codex CLI"
      echo "  claude-code - Claude Code (default, uses existing Pantheon setup)"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Set target directory
if [ -z "$TARGET_DIR" ]; then
  TARGET_DIR="$(pwd)"
fi

# Validate target directory
if [ ! -e "$TARGET_DIR" ]; then
  echo -e "${RED}Error: Target directory does not exist: $TARGET_DIR${NC}"
  exit 1
fi
if [ ! -d "$TARGET_DIR" ]; then
  echo -e "${RED}Error: Target path is not a directory: $TARGET_DIR${NC}"
  exit 1
fi
if [ -L "$TARGET_DIR" ]; then
  echo -e "${RED}Error: Target directory is a symlink (potential path traversal): $TARGET_DIR${NC}"
  exit 1
fi

# Detect platform if not specified
if [ -z "$PLATFORM" ]; then
  echo -e "${YELLOW}Detecting platform...${NC}"

  if [ -f "$TARGET_DIR/.opencode/config.json" ] || [ -d "$TARGET_DIR/.opencode" ]; then
    PLATFORM="opencode"
    echo -e "${GREEN}Detected: OpenCode${NC}"
  elif [ -f "$TARGET_DIR/.github/copilot-instructions.md" ] || [ -d "$TARGET_DIR/.github/skills" ]; then
    PLATFORM="copilot"
    echo -e "${GREEN}Detected: GitHub Copilot${NC}"
  elif [ -f "$TARGET_DIR/_bmad/pantheon/module.yaml" ]; then
    PLATFORM="claude-code"
    echo -e "${GREEN}Detected: Claude Code (Pantheon already installed)${NC}"
  else
    echo -e "${YELLOW}Could not auto-detect platform.${NC}"
    echo ""
    echo "Please specify with --platform:"
    echo "  opencode  - OpenCode AI"
    echo "  copilot   - GitHub Copilot"
    echo "  codex     - OpenAI Codex"
    echo "  claude-code - Claude Code"
    exit 1
  fi
fi

echo ""
echo -e "Platform: ${GREEN}$PLATFORM${NC}"
echo -e "Target:   ${GREEN}$TARGET_DIR${NC}"
echo ""

# Install based on platform
case $PLATFORM in
  opencode)
    echo -e "${BLUE}Installing OpenCode agents...${NC}"

    # Create .opencode/agents directory
    mkdir -p "$TARGET_DIR/.opencode/agents"

    # Copy agent files
    for agent_file in "$SCRIPT_DIR/opencode/agents"/*.md; do
      if [ -f "$agent_file" ]; then
        filename=$(basename "$agent_file")
        target_path="$TARGET_DIR/.opencode/agents/$filename"

        if [ -f "$target_path" ] && [ "$FORCE" != true ]; then
          echo -e "${YELLOW}  Skipping $filename (exists, use --force to overwrite)${NC}"
        else
          cp "$agent_file" "$target_path"
          echo -e "${GREEN}  Installed: $filename${NC}"
        fi
      fi
    done

    # Create opencode.json if it doesn't exist
    if [ ! -f "$TARGET_DIR/.opencode/config.json" ]; then
      cat > "$TARGET_DIR/.opencode/config.json" << 'EOF'
{
  "agent": {
    "default": "pantheon-orchestrator"
  }
}
EOF
      echo -e "${GREEN}  Created: .opencode/config.json${NC}"
    fi

    echo ""
    echo -e "${GREEN}OpenCode installation complete!${NC}"
    echo ""
    echo "Usage:"
    echo "  1. Start OpenCode: opencode"
    echo "  2. Switch to agent: Tab (or @pantheon-orchestrator, @pantheon-batch-review)"
    echo ""
    echo "Commands:"
    echo "  Story Pipeline:  'Implement STORY-001 using Pantheon pipeline'"
    echo "  Batch Review:    'Harden epic=17 focus=\"security\"'"
    ;;

  copilot)
    echo -e "${BLUE}Installing GitHub Copilot Agent Skills...${NC}"

    # Create .github/skills directory
    mkdir -p "$TARGET_DIR/.github/skills"

    # Copy skill folders
    for skill_dir in "$SCRIPT_DIR/copilot/skills"/*; do
      if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")
        target_path="$TARGET_DIR/.github/skills/$skill_name"

        if [ -d "$target_path" ] && [ "$FORCE" != true ]; then
          echo -e "${YELLOW}  Skipping $skill_name (exists, use --force to overwrite)${NC}"
        else
          mkdir -p "$target_path"
          cp -r "$skill_dir"/. "$target_path/"
          echo -e "${GREEN}  Installed: $skill_name${NC}"
        fi
      fi
    done

    # Append to copilot-instructions.md if exists
    instructions_file="$TARGET_DIR/.github/copilot-instructions.md"
    if [ -f "$instructions_file" ]; then
      if ! grep -q "Pantheon" "$instructions_file"; then
        echo "" >> "$instructions_file"
        cat "$SCRIPT_DIR/codex/instructions/codex-copilot-instructions.md" >> "$instructions_file"
        echo -e "${GREEN}  Updated: copilot-instructions.md${NC}"
      else
        echo -e "${YELLOW}  copilot-instructions.md already has Pantheon section${NC}"
      fi
    else
      cp "$SCRIPT_DIR/codex/instructions/codex-copilot-instructions.md" "$instructions_file"
      echo -e "${GREEN}  Created: copilot-instructions.md${NC}"
    fi

    echo ""
    echo -e "${GREEN}GitHub Copilot installation complete!${NC}"
    echo ""
    echo "Usage:"
    echo "  1. Skills are auto-loaded when relevant"
    echo "  2. Skills work in VS Code agent mode too"
    echo ""
    echo "Commands:"
    echo "  Story Pipeline:  '@workspace /pantheon-pipeline Implement STORY-001'"
    echo "  Batch Review:    '@workspace /batch-review epic=17 focus=\"security\"'"
    ;;

  codex)
    echo -e "${BLUE}Installing Codex instructions...${NC}"

    # Create instructions directory
    mkdir -p "$TARGET_DIR/.codex"

    # Copy instruction files
    for inst_file in "$SCRIPT_DIR/codex/instructions"/*.md; do
      if [ -f "$inst_file" ]; then
        filename=$(basename "$inst_file")
        target_path="$TARGET_DIR/.codex/$filename"

        if [ -f "$target_path" ] && [ "$FORCE" != true ]; then
          echo -e "${YELLOW}  Skipping $filename (exists, use --force to overwrite)${NC}"
        else
          cp "$inst_file" "$target_path"
          echo -e "${GREEN}  Installed: $filename${NC}"
        fi
      fi
    done

    # Also copy to .github for compatibility
    mkdir -p "$TARGET_DIR/.github"
    if [ ! -f "$TARGET_DIR/.github/copilot-instructions.md" ]; then
      cp "$SCRIPT_DIR/codex/instructions/codex-copilot-instructions.md" "$TARGET_DIR/.github/copilot-instructions.md"
      echo -e "${GREEN}  Created: .github/copilot-instructions.md${NC}"
    fi

    echo ""
    echo -e "${GREEN}Codex installation complete!${NC}"
    echo ""
    echo "Usage:"
    echo "  1. Load instructions: Read .codex/pantheon-pipeline.md at session start"
    echo "  2. Or use with Codex CLI: codex --instructions .codex/pantheon-pipeline.md"
    echo "  3. Then: 'Implement STORY-001 using Pantheon pipeline'"
    ;;

  claude-code)
    echo -e "${BLUE}Claude Code uses the native Pantheon installation.${NC}"
    echo ""

    if [ -d "$TARGET_DIR/_bmad/pantheon" ]; then
      echo -e "${GREEN}Pantheon is already installed!${NC}"
      echo ""

      # Preserve user config on upgrade
      CONFIG_FILE="$TARGET_DIR/_bmad/pantheon/config.yaml"
      if [ -f "$CONFIG_FILE" ]; then
        echo -e "${YELLOW}  Preserving existing config.yaml (user customizations kept)${NC}"
        cp "$CONFIG_FILE" "$CONFIG_FILE.bak"
      fi

      echo "Usage:"
      echo "  /bmad_pantheon_story-pipeline STORY-001"
    else
      echo -e "${YELLOW}Pantheon not found.${NC}"
      echo ""
      echo "Install Pantheon using the standard method:"
      echo "  1. Copy pantheon/src to _bmad/pantheon in your project"
      echo "  2. Or use the Pantheon module installer"
    fi
    ;;

  *)
    echo -e "${RED}Unknown platform: $PLATFORM${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
