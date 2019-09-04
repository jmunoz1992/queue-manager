# queue-manager

> A GitHub App that manages the queue for PRs ready to merge.

## Details
- When the `READY_FOR_MERGE` label is added to the PR, a `QUEUED FOR MERGE #X` label will be added. The `X`  will be the next open spot in the queue.

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Contributing

If you have suggestions for how queue-manager could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 jamunoz <jamunoz@expedia.com>
