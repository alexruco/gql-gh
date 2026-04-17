import * as Q from './gql/index.js';

// ---------------------------------------------------------------------------
// Result envelope
// ---------------------------------------------------------------------------

export const ok  = (data)  => ({ ok: true,  data });
export const err = (error) => ({ ok: false, error: error instanceof Error ? error.message : String(error) });

export async function safe(fn) {
  try { return ok(await fn()); }
  catch (e) { return err(e); }
}

// ---------------------------------------------------------------------------
// Node ID resolver (numbers → GraphQL global IDs)
// In-process cache: Map<`owner/repo#number` → nodeId>
// ---------------------------------------------------------------------------

const _cache = new Map();

/**
 * Resolve a GitHub issue or PR to its GraphQL node ID.
 *
 * @param {Function} gql   - configured @octokit/graphql instance
 * @param {string}   owner
 * @param {string}   repo
 * @param {number}   number
 * @param {'issue'|'pr'} [kind='issue']
 * @returns {Promise<string>} node ID
 */
export async function resolveNodeId(gql, owner, repo, number, kind = 'issue') {
  const key = `${owner}/${repo}#${number}:${kind}`;
  if (_cache.has(key)) return _cache.get(key);

  const query = kind === 'pr' ? Q.GET_PR_NODE_ID : Q.GET_ISSUE_NODE_ID;
  const data = await gql(query, { owner, repo, number: Number(number) });
  const node = kind === 'pr'
    ? data.repository.pullRequest
    : data.repository.issue;

  if (!node) throw new Error(`${kind} ${owner}/${repo}#${number} not found`);
  _cache.set(key, node.id);
  return node.id;
}

/**
 * Resolve a repository to its GraphQL node ID.
 */
export async function resolveRepoId(gql, owner, repo) {
  const key = `repo:${owner}/${repo}`;
  if (_cache.has(key)) return _cache.get(key);
  const data = await gql(Q.GET_REPO_ID, { owner, repo });
  const id = data.repository?.id;
  if (!id) throw new Error(`Repo ${owner}/${repo} not found`);
  _cache.set(key, id);
  return id;
}

/**
 * Resolve a GitHub user login to their GraphQL node ID.
 */
export async function resolveUserId(gql, login) {
  const key = `user:${login}`;
  if (_cache.has(key)) return _cache.get(key);
  const data = await gql(Q.GET_USER_ID, { login });
  const id = data.user?.id;
  if (!id) throw new Error(`User ${login} not found`);
  _cache.set(key, id);
  return id;
}

/**
 * Clear the session cache (useful in tests).
 */
export function clearCache() {
  _cache.clear();
}

// ---------------------------------------------------------------------------
// Ref parser  "owner/repo#12"  or  "owner/repo"  or  node ID string
// ---------------------------------------------------------------------------

/**
 * Parse a ref string into parts.
 *
 * Accepted formats:
 *   "owner/repo#12"   → { owner, repo, number: 12 }
 *   "owner/repo"      → { owner, repo, number: null }
 *   "I_abc123..."     → { nodeId: "I_abc123..." }  (already a node ID)
 */
export function parseRef(ref) {
  if (/^[A-Z_][A-Za-z0-9_]{5,}$/.test(ref)) return { nodeId: ref };
  const m = ref.match(/^([^/]+)\/([^#]+)(?:#(\d+))?$/);
  if (!m) throw new Error(`Cannot parse ref: "${ref}"`);
  return { owner: m[1], repo: m[2], number: m[3] ? Number(m[3]) : null };
}
