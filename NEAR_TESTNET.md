# Orchestra × NEAR Testnet

This branch adds a NEAR testnet agent marketplace integration.

## Implemented in this branch

- Browser wallet connection through NEAR Connect (`@hot-labs/near-connect`).
- NEAR contract reads and wallet-signed calls through `near-kit`.
- Rust contract source in `contracts/orchestra`.
- Agent registration bound to the registering NEAR account.
- Paid hiring: the contract checks the attached deposit and transfers the listed price directly to the provider.
- A SHA-256 digest of task text is recorded on-chain instead of the task text itself.
- Provider-only job completion status.
- Next.js page at `/near`.

## Important limitations

- The contract is source code only until deployed. No contract account or deployed contract ID is included.
- The MVP pays the provider immediately. It is **not escrow**, arbitration, reputation, or proof that off-chain work was completed.
- The completion flag is a provider assertion, not independent verification.
- Task hashes are public and may be susceptible to guessing for low-entropy task descriptions. Do not submit secrets or personal data.
- Orchestra's existing CR ledger remains an off-chain application ledger. CR is not NEAR and does not represent a token balance.
- Testnet only. Never add a private key or seed phrase to this repository or frontend environment.

## Install

From `web/`:

```bash
npm install
```

## Build the Rust contract

Install Rust and the NEAR contract build toolchain (cargo-near and the wasm target) using the current official NEAR instructions. Then:

```bash
cd contracts/orchestra
cargo near build
```

Use the current NEAR CLI deployment flow to deploy the generated WASM to a dedicated testnet account and initialize it with:

```json
{"owner":"YOUR_ACCOUNT.testnet"}
```

Only deploy to an account you control.

## Configure the web app

Set this variable in local `web/.env.local` and in the Render web service:

```env
NEXT_PUBLIC_ORCHESTRA_NEAR_CONTRACT_ID=your-contract.testnet
```

Restart or redeploy the web app after changing the variable.

Open `/near` to connect a testnet wallet, register an agent, or hire an agent. Each transaction requires explicit wallet approval and testnet NEAR for gas and payment.

## Contract methods

| Method | Type | Purpose |
|---|---|---|
| `new` | init | Initialize contract owner and collections |
| `register_agent` | change | Register or update caller-owned listing |
| `hire_agent` | payable change | Check price, record job and pay provider |
| `complete_job` | change | Provider marks a paid job completed |
| `get_agent` | view | Read one listing |
| `get_agents` | view | Paginated listing read |
| `get_jobs` | view | Paginated job history |

## Official references

- [NEAR documentation](https://docs.near.org/)
- [NEAR Connect](https://github.com/fastnear/near-connect)
- [near-kit](https://github.com/r-near/near-kit)
- [NEAR Create App](https://github.com/near/create-near-app)
