import { graphql } from '@octokit/graphql';

/**
 * Build a configured graphql client.
 *
 * @param {string} [token] - GitHub token. Defaults to process.env.GITHUB_TOKEN.
 * @returns {{ gql, gqlSubIssues }}
 *   gql           – standard calls
 *   gqlSubIssues  – calls that need the sub_issues feature flag header
 */
export function buildClient(token) {
  const tok = token || process.env.GITHUB_TOKEN;
  if (!tok) throw new Error('GitHub token required (GITHUB_TOKEN env or token param)');

  const gql = graphql.defaults({
    headers: { authorization: `token ${tok}` },
  });

  // Sub-issue mutations require an extra preview header
  const gqlSubIssues = graphql.defaults({
    headers: {
      authorization: `token ${tok}`,
      'GraphQL-Features': 'sub_issues',
    },
  });

  return { gql, gqlSubIssues };
}
