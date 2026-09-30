# Hive Chain

Hive Chain is a blockchain simulation app that combines the strongest ideas from four ecosystems:

- Bitcoin: proof-of-work style block security and a simple UTXO-inspired balance model
- Ethereum: smart-contract thinking and transaction-based state changes
- Solana: fast block production and low-latency throughput priorities
- Dogecoin: viral community energy, fast meme-friendly transfers, and a cheerful user experience

This project is a lightweight prototype, not a full production blockchain. It demonstrates how a hybrid chain could work in a simplified environment.

## Features

- Wallet generation and transaction signing
- In-memory blockchain with proof-of-work blocks
- Pending transaction pool
- Reward mining for block producers
- Chain validation checks
- A runnable demo that prints balances and status

## Run it

```bash
npm start
```

Or:

```bash
node index.js
```

## Example output

The app prints a JSON summary including:

- chain length
- pending transaction count
- validity status
- latest block hash
- wallet balances after mining

## Architecture notes

The prototype intentionally focuses on clarity over production complexity. In a real implementation, you would expand this with:

- real peer-to-peer networking
- validator consensus
- Wasm or EVM smart contracts
- persistence and database storage
- wallet key exports and secure signing
- mempool optimization and fee markets

## License

MIT
