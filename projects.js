import * as Q from './gql/index.js';
import { safe } from './utils.js';

/**
 * @param {Function} gql - configured client
 */
export function projectModule(gql) {

  // ---------------------------------------------------------------------------
  // Project metadata
  // ---------------------------------------------------------------------------

  /**
   * Get a project's GraphQL node ID (tries user then org).
   *
   * @param {string} owner
   * @param {number} projectNumber
   * @returns {Promise<r>}  data is { id, title, url }
   */
  async function getProject(owner, projectNumber) {
    return safe(async () => {
      for (const [query, key] of [
        [Q.GET_PROJECT_ID_USER, 'user'],
        [Q.GET_PROJECT_ID_ORG, 'organization'],
      ]) {
        try {
          const data = await gql(query, { login: owner, num: Number(projectNumber) });
          const proj = data[key]?.projectV2;
          if (proj?.id) return proj;
        } catch (_) { /* try the other type */ }
      }
      throw new Error(`Project ${owner}#${projectNumber} not found`);
    });
  }

  /**
   * Get all field metadata for a project (needed for setFieldValue).
   *
   * @param {string} projectId  - node ID
   * @returns {Promise<r>}  data is Map<fieldName, fieldNode>
   */
  async function getFieldMeta(projectId) {
    return safe(async () => {
      const data = await gql(Q.GET_FIELD_META, { id: projectId });
      const nodes = data.node?.fields?.nodes ?? [];
      const meta = new Map();
      for (const node of nodes) {
        if (node?.name) meta.set(node.name, node);
      }
      return meta;
    });
  }

  // ---------------------------------------------------------------------------
  // Items
  // ---------------------------------------------------------------------------

  /**
   * Add any GitHub item (issue or PR URL) to a project.
   *
   * @param {string} owner
   * @param {number} projectNumber
   * @param {string} contentUrl  - full GitHub URL of issue or PR
   * @returns {Promise<r>}
   *
   * Note: This delegates to `gh` CLI because there is no stable
   * addProjectV2ItemByContentId mutation in the public API yet.
   * We shell out minimally and keep everything else in GraphQL.
   */
  async function addItemToProject(owner, projectNumber, contentUrl) {
    return safe(async () => {
      const { spawnSync } = await import('child_process');
      const res = spawnSync(
        'gh',
        ['project', 'item-add', String(projectNumber), '--owner', owner, '--url', contentUrl, '--format', 'json'],
        { encoding: 'utf8' }
      );
      if (res.status !== 0) throw new Error(res.stderr.trim());
      return JSON.parse(res.stdout.trim());
    });
  }

  // ---------------------------------------------------------------------------
  // Field values
  // ---------------------------------------------------------------------------

  /**
   * Set a field value on a project item.
   *
   * @param {string} projectId  - node ID
   * @param {string} itemId     - project item node ID
   * @param {Map}    fieldMeta  - result of getFieldMeta().data
   * @param {string} fieldName
   * @param {string|number} value
   * @returns {Promise<r>}
   */
  async function setFieldValue(projectId, itemId, fieldMeta, fieldName, value) {
    return safe(async () => {
      const field = fieldMeta.get(fieldName);
      if (!field) throw new Error(`Field "${fieldName}" not found in project`);

      const base = { project: projectId, item: itemId, field: field.id };

      if (field.dataType === 'SINGLE_SELECT' || field.options) {
        const option = field.options?.find(o => o.name.toLowerCase() === String(value).toLowerCase());
        if (!option) throw new Error(`Option "${value}" not found in field "${fieldName}"`);
        await gql(Q.SET_FIELD_VALUE_SINGLE_SELECT, { ...base, option: option.id });
        return { fieldName, value };
      }

      if (field.dataType === 'NUMBER') {
        await gql(Q.SET_FIELD_VALUE_NUMBER, { ...base, number: Number(value) });
        return { fieldName, value };
      }

      if (field.dataType === 'DATE') {
        await gql(Q.SET_FIELD_VALUE_DATE, { ...base, date: String(value) });
        return { fieldName, value };
      }

      // Default: TEXT
      await gql(Q.SET_FIELD_VALUE_TEXT, { ...base, text: String(value) });
      return { fieldName, value };
    });
  }

  /**
   * Set multiple field values in one call.
   *
   * @param {string} projectId
   * @param {string} itemId
   * @param {Map}    fieldMeta
   * @param {object} values  - { FieldName: value, ... }
   * @returns {Promise<Array<r>>}
   */
  async function setFieldValues(projectId, itemId, fieldMeta, values = {}) {
    return Promise.all(
      Object.entries(values).map(([name, val]) =>
        setFieldValue(projectId, itemId, fieldMeta, name, val)
      )
    );
  }

  return { getProject, getFieldMeta, addItemToProject, setFieldValue, setFieldValues };
}
