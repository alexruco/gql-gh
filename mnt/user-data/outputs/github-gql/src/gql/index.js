// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const GET_ISSUE_NODE_ID = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) { id number title }
    }
  }
`;

export const GET_PR_NODE_ID = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) { id number title }
    }
  }
`;

export const LIST_SUB_ISSUES = `
  query($id: ID!) {
    node(id: $id) {
      ... on Issue {
        subIssues(first: 100) {
          nodes { id number title state url }
        }
      }
    }
  }
`;

export const GET_PROJECT_ID_USER = `
  query($login: String!, $num: Int!) {
    user(login: $login) {
      projectV2(number: $num) { id title url }
    }
  }
`;

export const GET_PROJECT_ID_ORG = `
  query($login: String!, $num: Int!) {
    organization(login: $login) {
      projectV2(number: $num) { id title url }
    }
  }
`;

export const GET_FIELD_META = `
  query($id: ID!) {
    node(id: $id) {
      ... on ProjectV2 {
        fields(first: 50) {
          nodes {
            ... on ProjectV2Field           { id name dataType }
            ... on ProjectV2SingleSelectField {
              id name dataType
              options { id name }
            }
            ... on ProjectV2IterationField  { id name dataType }
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const CREATE_ISSUE = `
  mutation($repoId: ID!, $title: String!, $body: String, $assigneeIds: [ID!], $labelIds: [ID!]) {
    createIssue(input: {
      repositoryId: $repoId
      title: $title
      body: $body
      assigneeIds: $assigneeIds
      labelIds: $labelIds
    }) {
      issue { id number url title }
    }
  }
`;

export const UPDATE_ISSUE = `
  mutation($id: ID!, $title: String, $body: String, $state: IssueState) {
    updateIssue(input: { id: $id, title: $title, body: $body, state: $state }) {
      issue { id number title state }
    }
  }
`;

export const ADD_ASSIGNEES = `
  mutation($id: ID!, $assigneeIds: [ID!]!) {
    addAssigneesToAssignable(input: { assignableId: $id, assigneeIds: $assigneeIds }) {
      assignable { ... on Issue { id number title } }
    }
  }
`;

export const REMOVE_ASSIGNEES = `
  mutation($id: ID!, $assigneeIds: [ID!]!) {
    removeAssigneesFromAssignable(input: { assignableId: $id, assigneeIds: $assigneeIds }) {
      assignable { ... on Issue { id number title } }
    }
  }
`;

export const ADD_SUB_ISSUE = `
  mutation($parentId: ID!, $childId: ID!) {
    addSubIssue(input: { issueId: $parentId, subIssueId: $childId }) {
      issue    { id number title }
      subIssue { id number title }
    }
  }
`;

export const REMOVE_SUB_ISSUE = `
  mutation($parentId: ID!, $childId: ID!) {
    removeSubIssue(input: { issueId: $parentId, subIssueId: $childId }) {
      issue    { id number title }
      subIssue { id number title }
    }
  }
`;

export const SET_FIELD_VALUE_SINGLE_SELECT = `
  mutation($project: ID!, $item: ID!, $field: ID!, $option: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $project
      itemId: $item
      fieldId: $field
      value: { singleSelectOptionId: $option }
    }) { projectV2Item { id } }
  }
`;

export const SET_FIELD_VALUE_TEXT = `
  mutation($project: ID!, $item: ID!, $field: ID!, $text: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $project
      itemId: $item
      fieldId: $field
      value: { text: $text }
    }) { projectV2Item { id } }
  }
`;

export const SET_FIELD_VALUE_NUMBER = `
  mutation($project: ID!, $item: ID!, $field: ID!, $number: Float!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $project
      itemId: $item
      fieldId: $field
      value: { number: $number }
    }) { projectV2Item { id } }
  }
`;

export const SET_FIELD_VALUE_DATE = `
  mutation($project: ID!, $item: ID!, $field: ID!, $date: Date!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $project
      itemId: $item
      fieldId: $field
      value: { date: $date }
    }) { projectV2Item { id } }
  }
`;

export const UPDATE_PROJECT_DESCRIPTION = `
  mutation($id: ID!, $desc: String!) {
    updateProjectV2(input: { projectId: $id, shortDescription: $desc }) {
      projectV2 { id }
    }
  }
`;

export const GET_REPO_ID = `
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) { id }
  }
`;

export const GET_USER_ID = `
  query($login: String!) {
    user(login: $login) { id }
  }
`;
