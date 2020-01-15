# queue-manager
A GitHub App that manages the PR queue when merging into production.

## Details
- When the `READY FOR MERGE` label is added to the PR, a `QUEUED FOR MERGE #X` label will be added to the PR. The `X`  will be the next open spot in the queue.

- The `READY FOR MERGE` label can only be added if the `CORE APPROVED` label is added first to the PR. The PR must be approved by a core approver first before adding the `CORE APPROVED` label.

- If any `QUEUED FOR MERGE` labels are added before adding the `CORE APPROVED` or `READY FOR MERGE` label, a helpful message will appear on the PR telling the user to remove the `QUEUED FOR MERGE` label. The PR will only be added to the queue when the user adds the `CORE APPROVED` and `READY FOR MERGE` labels.

- If all the `QUEUED FOR MERGE #X` labels are assigned (no more spots in the queue), a comment will appear on the PR telling the user that the queue is full, and that the user will need to re-apply back into the queue. To re-apply into the queue, just add the `READY FOR MERGE` label to the PR again.

- The queue is updated when any of the `QUEUED FOR MERGE #X` labels is removed in any of the PRs. Each of the PRs containing these labels will have updated queue labels.

- The PR can only be merged when it contains the `QUEUED FOR MERGE #1`, `READY FOR MERGE`, and `CORE APPROVED` labels.

- Once the PR is merged, the `QUEUED FOR MERGE #1` label will be removed from the PR and update all the other PRs in the queue.

- The `QUEUED FOR MERGE #X` label cannot be manually added. A comment will appear on the PR that this is not allowed. 

- The `READY FOR MERGE` label cannot be manually added without the `CORE APPROVED`. A comment will appear on the PR that this is not allowed. 

- The `QUEUED FOR MERGE #1` label will be removed once the PR is merged.


## Installing This Github App For A Repo
1. Go here: https://github.expedia.biz/github-apps/queue-manager.
2. Click the `Configure` button on the top right.
3. Click the org the repo is in.
4. Click `Select repositories` and add the repository you want this GitHub app to be used in.
5. Click the `Update Access` button.
6. Go to your repo’s Settings -> Integrations and services. The Github App should now be added into your repo’s Integrations and services.

## Before Using This App For Your Repo
1. Set up the labels, the labels must match the below cases exactly:
    1. Need a `READY FOR MERGE` label
    2. Need a `QUEUED FOR MERGE #1`, `QUEUED FOR MERGE #2`, …however many you want to be put in the queue, there is no limit as long as the label starts with `QUEUED FOR MERGE #`
    3. Need a `CORE APPROVED` label
2. To add a PR to the queue, make sure to first add the `CORE APPROVED` label, then the `READY FOR MERGE` label.
3. To remove a PR from the queue, make sure to remove the `QUEUED FOR MERGE #X` label and `READY FOR MERGE` label from the PR
4.  Test try with a few trial PRs (make at least 3 PRs)
    1. Test if the labels properly update when a PR is added to the queue
    2. Test if the labels properly update when a PR is removed from the queue
    3. Test if the PR with the `QUEUED FOR MERGE #1` label can be merged, while other PRs in the queue cannot be merged.

## Contributing
If you have suggestions for how queue-manager could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 jamunoz <jamunoz@expedia.com>
