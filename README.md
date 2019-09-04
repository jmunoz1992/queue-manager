# queue-manager

A GitHub App that manages the queue for PRs ready to merge.

## Details
- When the `READY_FOR_MERGE` label is added to the PR, a `QUEUED FOR MERGE #X` label will be added to the PR. The `X`  will be the next open spot in the queue.

- If all the `QUEUED FOR MERGE #X` labels are assigned (no more spots in the queue), the `QUEUE IS CURRENTLY FULL` label will appear on the PR. The assignee needs to remove the `READY_FOR_MERGE` label and `QUEUE IS CURRENTLY FULL` labels, and wait a few minutes before re-applying back to the queue. To re-apply into the queue, just add the `READY_FOR_MERGE` label to the PR again.

- The queue is updated when any of the `QUEUED FOR MERGE #X` labels is removed in any of the PRs. Each of the PRs containing these labels will have updated queue labels.


## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm run dev

# Track webhook requests at: https://smee.io/1nV2sEgmi1rNYmt

# Update all the below vars in index.js
var owner = 'jmunoz1992'; // insert owner's github username here
var repo = 'test-wip-app'; // insert repo you want to test here

# Change the below label vars based on the queue labels in your PR in index.js
var triggerLabel = 'READY_FOR_MERGE';
var queueLabel = 'QUEUED FOR MERGE #';
var firstInQueueLabel = 'QUEUED FOR MERGE #1';
var fullQueueLabel = 'QUEUE IS CURRENTLY FULL';
```

## Contributing

If you have suggestions for how queue-manager could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 jmunoz1992 <jasmine.esplago.munoz@gmail.com>
