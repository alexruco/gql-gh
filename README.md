# gql-gh

Thin GitHub GraphQL layer for issues, sub-issues, projects, and fields.

Built on `@octokit/graphql`. Accepts issue numbers, resolves node IDs internally.  
All functions return `{ ok, data }` or `{ ok, error }`.

## Install

```bash
npm install gql-gh
```

Set `GITHUB_TOKEN` in your environment (needs `repo` + `project` scopes).

## Usage

```js
import { createClient } from 'gql-gh'

const gh = createClient()             // reads GITHUB_TOKEN
// or: createClient({ token: '...' })
```

### Issues

```js
// Create
const r = await gh.issues.createIssue('owner', 'repo', {
  title: 'Fix login bug',
  body: 'Steps to reproduce...',
  assignees: ['alice'],              // logins, resolved automatically
})
// r.data → { id, number, url, title }

// Update
await gh.issues.updateIssue('owner/repo#42', { title: 'New title' })

// Close / reopen
await gh.issues.closeIssue('owner/repo#42')
await gh.issues.openIssue('owner/repo#42')

// Assign / unassign
await gh.issues.assignIssue('owner/repo#42', ['bob'])
await gh.issues.unassignIssue('owner/repo#42', ['alice'])
```

Refs accept either `"owner/repo#number"` or a GraphQL node ID string.

### Sub-issues

> Uses the `GraphQL-Features: sub_issues` preview header automatically.

```js
// Link
await gh.subIssues.addSubIssue('owner/repo#1', 'owner/repo#2')

// Unlink
await gh.subIssues.removeSubIssue('owner/repo#1', 'owner/repo#2')

// List
const r = await gh.subIssues.listSubIssues('owner/repo#1')
// r.data → [{ id, number, title, state, url }, ...]
```

### Projects

```js
// Get project node ID
const proj = await gh.projects.getProject('owner', 7)
// proj.data → { id, title, url }

// Get field metadata (needed for setFieldValue)
const meta = await gh.projects.getFieldMeta(proj.data.id)
// meta.data → Map<fieldName, fieldNode>

// Add an issue to a project (delegates to gh CLI)
await gh.projects.addItemToProject('owner', 7, 'https://github.com/owner/repo/issues/42')

// Set a single field value
await gh.projects.setFieldValue(proj.data.id, itemId, meta.data, 'Status', 'In Progress')

// Set multiple field values at once
await gh.projects.setFieldValues(proj.data.id, itemId, meta.data, {
  'Status': 'In Progress',
  'Priority': 'High',
})
```

### Escape hatch

```js
// Run any query/mutation directly
const data = await gh.gql(`query { viewer { login } }`)
const data = await gh.gqlSubIssues(MY_MUTATION, { ... })
```

## Result objects

Every function returns `{ ok: true, data }` or `{ ok: false, error }`.

```js
const r = await gh.issues.createIssue('owner', 'repo', { title: 'x' })
if (!r.ok) {
  console.error(r.error)   // string message
  process.exit(1)
}
console.log(r.data.url)
```

## Notes

- Node IDs are cached per process (session cache, `Map`). Call `clearCache()` to reset.
- `addItemToProject` shells out to `gh` CLI — the GraphQL mutation for this isn't stable in the public API yet. Everything else is pure GraphQL.
- Sub-issue mutations require a GitHub token with `repo` scope.
