import { buildClient } from './client.js';
import { issueModule } from './issues.js';
import { subIssueModule } from './subissues.js';
import { projectModule } from './projects.js';
export { clearCache } from './utils.js';

/**
 * Create a gql-gh client.
 *
 * @param {object} [opts]
 * @param {string} [opts.token]  - GitHub token. Defaults to GITHUB_TOKEN env.
 * @returns {GithubGql}
 *
 * @example
 * import { createClient } from 'gql-gh'
 *
 * const gh = createClient()
 *
 * // Create an issue
 * const r = await gh.issues.createIssue('acme', 'myrepo', { title: 'Bug' })
 * if (!r.ok) console.error(r.error)
 * else console.log(r.data.url)
 *
 * // Add a sub-issue
 * await gh.subIssues.addSubIssue('acme/myrepo#1', 'acme/myrepo#2')
 *
 * // Project: get field meta then set a status
 * const proj = await gh.projects.getProject('acme', 7)
 * const meta = await gh.projects.getFieldMeta(proj.data.id)
 * await gh.projects.setFieldValue(proj.data.id, itemId, meta.data, 'Status', 'In Progress')
 */
export function createClient(opts = {}) {
  const { gql, gqlSubIssues } = buildClient(opts.token);

  return {
    /** Raw clients — escape hatch for custom queries */
    gql,
    gqlSubIssues,

    /** Issue CRUD + assignment */
    issues: issueModule(gql),

    /** Sub-issue relationships (GraphQL preview feature) */
    subIssues: subIssueModule(gqlSubIssues, gql),

    /** Project metadata, items, and field values */
    projects: projectModule(gql),
  };
}
