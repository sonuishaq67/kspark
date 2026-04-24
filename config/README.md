# Config — Runtime Configuration

This directory contains YAML configuration files that drive product behavior without code changes.

## Ownership

### personas/ — Person 2
- `friendly.yaml`, `neutral.yaml`, `challenging.yaml`
- Defines tone, acknowledgment style, pushback frequency, probe depth

### companies/ — Person 1
- `amazon.yaml`, `google.yaml`, `meta.yaml`, `microsoft.yaml`, `generic-faang.yaml`, `generic-startup.yaml`, `indian-it.yaml`
- Defines topic weights, rubric emphases, default persona, round structure, key signals

### modes/ — Person 2
- `learning.yaml`, `professional.yaml`
- Defines mode-specific behavior (hints, encouragements, scoring tone)

### formats/ — Person 2
- `recruiter_screen.yaml`, `technical_screen.yaml`, `hiring_manager.yaml`, `full_loop.yaml`, etc.
- Defines interview structure (sections, durations, topic focus)

### achievements.yaml — Person 3
- Achievement criteria DSL
- Categories: consistency, mastery, variety, breakthrough, grit

### rubrics.yaml — Person 2
- 8-metric scoring rubrics (confidence, clarity, STAR adherence, technical depth, code quality, recovery, professionalism, presence)
- Observable signals per metric

### practice_drills.yaml — Person 3
- Drill definitions (question, rubric, follow-up template, scoring breakdown)
- Types: TMAY, why-this-company, conflict, leadership, failure, strengths/weaknesses, single LeetCode, system design warmup, SQL

## Schema Validation

All configs are validated at service startup using JSON Schema.

## Adding New Configs

1. **New persona:** Add one YAML file to `personas/`, optionally restrict in `modes/*.yaml`
2. **New company:** Add one YAML file to `companies/`
3. **New achievement:** Add one entry to `achievements.yaml`
4. **New format:** Add one YAML file to `formats/`
5. **New drill:** Add one entry to `practice_drills.yaml`

No code changes required — configs are hot-reloadable.
