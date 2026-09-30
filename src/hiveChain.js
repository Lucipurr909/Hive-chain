import crypto from 'node:crypto';

export class Wallet {
  constructor(name) {
    this.name = name;
    this.privateKey = crypto.randomBytes(32).toString('hex');
    this.publicKey = crypto.createHash('sha256').update(this.privateKey).digest('hex');
  }

  sign(payload) {
    return crypto.createHmac('sha256', this.privateKey).update(JSON.stringify(payload)).digest('hex');
  }

  send(chain, to, amount, fee = 1, type = 'transfer', metadata = {}) {
    const tx = {
      from: this.publicKey,
      to,
      amount,
      fee,
      type,
      metadata,
      nonce: Date.now(),
      timestamp: Date.now(),
    };

    tx.signature = this.sign(tx);
    return chain.addTransaction(tx);
  }
}

export class Block {
  constructor(previousHash, transactions, difficulty = 2) {
    this.previousHash = previousHash;
    this.transactions = transactions;
    this.timestamp = Date.now();
    this.nonce = 0;
    this.hash = '';
    this.difficulty = difficulty;
    this.mine();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        `${this.previousHash}${this.timestamp}${this.nonce}${JSON.stringify(this.transactions)}`
      )
      .digest('hex');
  }

  mine() {
    while (!this.hash.startsWith('0'.repeat(this.difficulty))) {
      this.nonce += 1;
      this.hash = this.calculateHash();
    }
  }
}

export class HiveChain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.miningReward = 10;
    this.difficulty = 2;
    this.wallets = new Map();
  }

  createGenesisBlock() {
    const genesis = new Block('genesis', [{
      from: 'network',
      to: 'hive-foundation',
      amount: 0,
      fee: 0,
      type: 'genesis',
      metadata: { message: 'Hive Chain bootstraps from four chain inspirations' },
      timestamp: 0,
      nonce: 0,
    }], 1);
    genesis.hash = '0'.repeat(64);
    return genesis;
  }

  registerWallet(wallet) {
    this.wallets.set(wallet.publicKey, wallet);
  }

  addTransaction(tx) {
    if (!tx.from || !tx.to || !tx.amount || tx.amount <= 0) {
      throw new Error('Transaction is missing required fields.');
    }

    const wallet = this.wallets.get(tx.from);
    if (!wallet) {
      throw new Error('Unknown sender wallet.');
    }

    const payload = { ...tx };
    delete payload.signature;
    const expectedSignature = wallet.sign(payload);
    if (expectedSignature !== tx.signature) {
      throw new Error('Signature verification failed.');
    }

    this.pendingTransactions.push(tx);
    return tx;
  }

  minePendingTransactions(minerAddress) {
    const blockTransactions = [
      {
        from: 'network',
        to: minerAddress,
        amount: this.miningReward,
        fee: 0,
        type: 'reward',
        metadata: { reward: 'mine success' },
        timestamp: Date.now(),
        nonce: 0,
      },
      ...this.pendingTransactions,
    ];

    const newBlock = new Block(
      this.chain[this.chain.length - 1].hash,
      blockTransactions,
      this.difficulty,
    );

    this.chain.push(newBlock);
    this.pendingTransactions = [];
    return newBlock;
  }

  getBalance(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.to === address) balance += tx.amount;
        if (tx.from === address) balance -= tx.amount + (tx.fee || 0);
      }
    }

    for (const tx of this.pendingTransactions) {
      if (tx.to === address) balance += tx.amount;
      if (tx.from === address) balance -= tx.amount + (tx.fee || 0);
    }

    return balance;
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i += 1) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.hash !== current.calculateHash()) {
        return false;
      }

      if (current.previousHash !== previous.hash) {
        return false;
      }
    }

    return true;
  }

  getStatus() {
    return {
      chainLength: this.chain.length,
      pendingTransactions: this.pendingTransactions.length,
      difficulty: this.difficulty,
      valid: this.isValid(),
      latestHash: this.chain[this.chain.length - 1].hash,
    };
  }
}

export function runDemo() {
  const chain = new HiveChain();
  const alice = new Wallet('Alice');
  const bob = new Wallet('Bob');
  const miner = new Wallet('Miner');

  chain.registerWallet(alice);
  chain.registerWallet(bob);
  chain.registerWallet(miner);

  alice.send(chain, bob.publicKey, 25, 1, 'transfer', { note: 'payment for API access' });
  bob.send(chain, alice.publicKey, 12, 1, 'transfer', { note: 'refund' });
  const minedBlock = chain.minePendingTransactions(miner.publicKey);

  const balances = {
    Alice: chain.getBalance(alice.publicKey),
    Bob: chain.getBalance(bob.publicKey),
    Miner: chain.getBalance(miner.publicKey),
  };

  console.log('Hive Chain demo');
  console.log(JSON.stringify({
    status: chain.getStatus(),
    latestBlock: {
      index: chain.chain.length - 1,
      hash: minedBlock.hash,
      transactionCount: minedBlock.transactions.length,
    },
    balances,
  }, null, 2));
}
