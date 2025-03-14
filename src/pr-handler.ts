import * as fs from 'fs';
import * as path from 'path';

// [ag1] migration(app-1): (step-2) title here

class MigrationStep {
  public application: string;
  public environment: string;
  public step: number;
  public prURL: string;
  action: PullRequestAction;

  constructor(application: string, environment: string, step: number, pr_url: string, action: PullRequestAction = PullRequestAction.OPENED) {
    this.application = application;
    this.environment = environment;
    this.step = step;
    this.prURL = pr_url;
    this.action = action;
  }
}

// extract the MigrationStep from the PR title
// filter PRs which match matching pattern: [{environment}] migration({application_name}): (step-{step_number}) title here
// sample payload:
// {
//   "action": "opened",
//   "number": 2,
//   "pull_request": {
//     "url": "https://api.github.com/repos/xxx/github-webhook-listener/pulls/2",
//     "id": 2392555763,
//     "node_id": "PR_kwDOOIWZSg",
//     "number": 2,
//     "state": "open",
//     "locked": false,
//     "title": "qc",
//     "user": {
//       "login": "xxx"
//     },
//     "body": null,
//     "created_at": "2025-03-14T03:53:02Z",
//     "updated_at": "2025-03-14T03:53:02Z",
//     "closed_at": null,
//     "merged_at": null,
//     "merge_commit_sha": null,
//     "assignee": null,
//     "assignees": [],
//     "requested_reviewers": [],
//     "head": {
//       "label": "xxx:qc",
//       "ref": "qc",
//       "sha": "71caff2f159e98b64d4974815e41f4c07163c62"
//     },
//     "base": {
//       "label": "xxx:main",
//       "ref": "main",
//       "sha": "477acc2f1d4f359c80d5e6f4f8b7f8eeb6483833"
//     },
//     "author_association": "OWNER",
//     "auto_merge": null,
//     "active_merge": null,
//     "assignee": null,
//     "commits": 1,
//     "additions": 1,
//     "deletions": 0,
//     "changed_files": 1
//   },
//   "repository": {
//     "id": 948279626,
//     "node_id": "R_kgDOOIWZSg",
//     "name": "github-webhook-listener",
//     "full_name": "xxx/github-webhook-listener",
//     "html_url": "https://github.com/xxx/github-webhook-listener",
//     "description": "Testing Webhooks",
//     "fork": false,
//     "url": "https://api.github.com/repos/xxx/github-webhook-listener"
//   },
//   "sender": {
//     "login": "xxx",
//     "id": 48039235,
//     "node_id": "MDQ6VXNlcjQ4MDM5MjM1",
//     "html_url": "https://github.com/xxx",
//     "type": "User"
//   }
// }
export function handlePREvent(payload: any) {
  const title = payload.pull_request.title;
  const titlePattern = /^\[(.+?)\]\s+migration\((.+?)\):\s+\(step-(\d+)\)\s+(.+)$/i;
  const match = title.match(titlePattern);
  if (!match) {
    console.log(`${title} does not match the migration pattern`);
    return;
  }
  const environment = match[1];
  const application = match[2];
  const step = parseInt(match[3]);
  const prUrl = payload.pull_request.url;
  const prAction = payload.action;

  // build the migration step object
  const migrationStep = new MigrationStep(application, environment, step, prUrl, prAction);
  console.log('Migration step:', migrationStep);
  saveData(migrationStep)
  console.log('Saved data')
}

// Enum to define PR actions clearly
enum PullRequestAction {
  OPENED = "opened",
  CLOSED = "closed",
  SUBMITTED = "submitted",
}


const PRStatusMapping = {
  [PullRequestAction.OPENED]: 'CREATED',
  [PullRequestAction.SUBMITTED]: 'APPROVED',
  [PullRequestAction.CLOSED]: 'MERGED',
}

function toMigrationStatus(action: PullRequestAction): string {
  return PRStatusMapping[action] || 'UNKNOWN';
}


function saveData(data: MigrationStep) {
  const outputFilePath = path.resolve(__dirname, '../data/output.csv');
  const headers = ['Application', 'Environment', 'Step', 'PR URL', 'Action'];
  const row = [data.application, data.environment, data.step.toString(), data.prURL, toMigrationStatus(data.action)];

  const csvLine = row.join(',') + '\n';

  // Check if the file exists; if not, write headers first
  if (!fs.existsSync(outputFilePath)) {
    fs.writeFileSync(outputFilePath, headers.join(',') + '\n');
  }

  // Append the data
  fs.appendFileSync(outputFilePath, csvLine);
}