import * as Q from './gql/index.js';
import { safe, resolveNodeId, parseRef } from './utils.js';

/**
 * @param {Function} gqlSubIssues - client pre-configured with GraphQL-Features: sub_issues
 * @param {Function} gql          - standard client (for node ID resolution)
 */
export function subIssueModule(gqlSubIssues, gql) {

  async function _resolveId(ref) {
    const parsed = parseRef(ref);
    if (parsed.nodeId) return parsed.nodeId;
    if (!parsed.number) throw new Error(`Ref "${ref}" must include an issue number`);
    return resolveNodeId(gql, parsed.owner, parsed.repo, parsed.number, 'issue');
  }

  /**
   * Add a sub-issue relationship.
   *
   * @param {string} parentRef  - "owner/repo#number" or node ID
   * @param {string} childRef   - "owner/repo#number" or node ID
   */
  async function addSubIssue(parentRef, childRef) {
    return safe(async () => {
      const [parentId, childId] = await Promise.all([
        _resolveId(parentRef),
        _resolveId(childRef),
      ]);
      const data = await gqlSubIssues(Q.ADD_SUB_ISSUE, { parentId, childId });
      return data.addSubIssue;
    });
  }

  /**
   * Remove a sub-issue relationship.
   */
  async function removeSubIssue(parentRef, childRef) {
    return safe(async () => {
      const [parentId, childId] = await Promise.all([
        _resolveId(parentRef),
        _resolveId(childRef),
      ]);
      const data = await gqlSubIssues(Q.REMOVE_SUB_ISSUE, { parentId, childId });
      return data.removeSubIssue;
    });
  }

  /**
   * List all sub-issues of a parent.
   *
   * @param {string} parentRef
   * @returns {Promise<r>}  data is array of { id, number, title, state, url }
   */
  async function listSubIssues(parentRef) {
    return safe(async () => {
      const id = await _resolveId(parentRef);
      // READ queries work fine with the standard client
      const data = await gql(Q.LIST_SUB_ISSUES, { id });
      return data.node?.subIssues?.nodes ?? [];
    });
  }

  return { addSubIssue, removeSubIssue, listSubIssues };
}
