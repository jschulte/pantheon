# Step 2: Gather Team Configuration (2/8)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 2: TEAM CONFIGURATION (2/8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Configuring developer team...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2.1 Team Size

```
IF team_size NOT provided:
  AskUserQuestion: "How many developers are on the team?"
  Options: [2, 3, 4, 5+]
  TEAM_SIZE = user response

ELSE:
  TEAM_SIZE = team_size
```

### 2.2 Developer Profiles

```
IF developer_profiles NOT provided:
  AskUserQuestion: "Do you want to define developer specializations?"
  Options:
    - "Yes, let me define each developer"
    - "No, assume all are fullstack generalists"

  IF "Yes":
    FOR i IN 1..TEAM_SIZE:
      AskUserQuestion: "Developer {{i}} — Name and specialization?"
      Specialization options: [frontend, backend, fullstack, database, infrastructure]

      DEVELOPERS[i] = {
        name: user_name,
        specialization: user_specialization
      }

  ELSE:
    FOR i IN 1..TEAM_SIZE:
      DEVELOPERS[i] = {
        name: "Dev {{i}}",
        specialization: "fullstack"
      }

ELSE:
  DEVELOPERS = developer_profiles
```

### 2.3 Display Team Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TEAM COMPOSITION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  | # | Name       | Specialization |
  |---|------------|----------------|
  | 1 | {{name_1}} | {{spec_1}}     |
  | 2 | {{name_2}} | {{spec_2}}     |
  | ...                              |
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

AskUserQuestion: "Does this look correct?"
Options: ["Yes, proceed", "Edit team composition"]
