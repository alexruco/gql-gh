import * as Q from './gql/index.js';
import { safe, resolveNodeId, resolveRepoId, resolveUserId, parseRef } from './utils.js';

/**
 * @param {Function} gql - configured client
 */
export function issueModule(gql) {
  /**
   * Create a new issue.
   *
   * @param {string}   owner
   * @param {string}   repo
   * @param {object}   opts
   * @param {string}   opts.title
   * @param {string}   [opts.body]
   * @param {string[]} [opts.assignees]  - login strings, resolved to IDs
   * @param {string[]} [opts.labelIds]   - node IDs
   * @returns {Promise<Result>}
   */
  async function createIssue(owner, repo, { title, body, assignees = [], labelIds = [] } = {}) {
    return safe(async () => {
      const repoId = await resolveRepoId(gql, owner, repo);
      const assigneeIds = await Promise.all(assignees.map(l => resolveUserId(gql, l)));
      const data = await gql(Q.CREATE_ISSUE, { repoId, title, body, assigneeIds, labelIds });
      return data.createIssue.issue;
    });
  }

  /**
   * Update title, body, or state ('OPEN' | 'CLOSED') of an issue.
   *
   * @param {string} ref  - "owner/repo#number" or node ID
   * @param {object} patch
   */
  async function updateIssue(ref, patch = {}) {
    return safe(async () => {
      const id = await _resolveIssueId(ref);
      const data = await gql(Q.UPDATE_ISSUE, { id, ...patch });
      return data.updateIssue.issue;
    });
  }

  /**
   * Close an issue.
   */
  async function closeIssue(ref) {
    return updateIssue(ref, { state: 'CLOSED' });
  }

  /**
   * Reopen an issue.
   */
  async function openIssue(ref) {
    return updateIssue(ref, { state: 'OPEN' });
  }

  /**
   * Assign users to an issue.
   *
   * @param {string}   ref       - "owner/repo#number" or node ID
   * @param {string[]} assignees - login strings
   */
  async function assignIssue(ref, assignees = []) {
    return safe(async () => {
      const id = await _resolveIssueId(ref);
      const assigneeIds = await Promise.all(assignees.map(l => resolveUserId(gql, l)));
      const data = await gql(Q.ADD_ASSIGNEES, { id, assigneeIds });
      return data.addAssigneesToAssignable.assignable;
    });
  }

  /**
   * Remove assignees from an issue.
   */
  async function unassignIssue(ref, assignees = []) {
    return safe(async () => {
      const id = await _resolveIssueId(ref);
      const assigneeIds = await Promise.all(assignees.map(l => resolveUserId(gql, l)));
      const data = await gql(Q.REMOVE_ASSIGNEES, { id, assigneeIds });
      return data.removeAssigneesFromAssignable.assignable;
    });
  }

  // Internal: resolve "owner/repo#num" or node ID → node ID
  async function _resolveIssueId(ref) {
    const parsed = parseRef(ref);
    if (parsed.nodeId) return parsed.nodeId;
    if (!parsed.number) throw new Error(`Ref "${ref}" must include an issue number`);
    return resolveNodeId(gql, parsed.owner, parsed.repo, parsed.number, 'issue');
  }

  return { createIssue, updateIssue, closeIssue, openIssue, assignIssue, unassignIssue };
}
