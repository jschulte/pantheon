# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Pantheon, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, email the maintainer directly via the contact information in `package.json`, or use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability).

## What Qualifies

- Prompt injection vectors that bypass the story sanitizer (`scripts/sanitize-story.sh`)
- Agent instruction bypasses that allow privilege escalation (e.g., a reviewer executing code changes)
- Playbook or specialist registry poisoning that degrades pipeline safety
- File path traversal in workflow variable interpolation
- Secrets exposure through pipeline artifacts or logs

## What Does Not Qualify

- LLM hallucination or instruction-following failures (these are inherent to the platform, not Pantheon-specific)
- Issues in the underlying AI platform (Claude Code, Codex, Copilot) — report those to their respective maintainers
- Style or quality issues in generated code — use `/batch-review` for that

## Security Architecture

Pantheon implements defense-in-depth:

1. **Input sanitization** — `scripts/sanitize-story.sh` strips HTML comments, detects prompt injection patterns, and validates story titles
2. **Independent security gate** — Cerberus runs as an independent reviewer that cannot be overridden by other agents or the triage process. BLOCK findings halt the pipeline.
3. **Schema validation** — JSON schemas enforce structured output with enum constraints, pattern validation, and array limits
4. **Agent isolation** — Reviewers run in separate contexts (blind reviewer pattern) and cannot access builder reasoning
5. **Git safety constraints** — Charon (committer agent) has explicit constraints against force push, hard reset, and hook bypass

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.2.x   | Yes       |
| < 1.2   | No        |
