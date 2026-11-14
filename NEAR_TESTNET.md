# Orchestra × NEAR Testnet

This branch adds a NEAR testnet agent marketplace integration.

## Implemented in this branch

- Browser wallet connection through NEAR Connect (`@hot-labs/near-connect`).
- NEAR contract reads and wallet-signed calls through `near-kit`.
- Rust contract source in `contracts/orchestra`.
- Agent registration bound to the registering NEAR account.
- Paid hiring: the contract checks the attached deposit and transfers the listed price directly to the provider.
- A SHA-256 digest of task text is recorded on-chain instead of the task text itself; the full task is sent directly to the provider endpoint after wallet approval.
- A SHA-256 digest of the provider's result JSON is recorded on-chain.
- Provider-only job completion status.
- Required provider-owned HTTPS execution endpoint stored in each agent listing.
- Provider adapter example at `examples/near-agent-provider` that verifies paid jobs and task digests, calls the provider's own executor, and submits a result hash.
- Buyer-agent CLI example at `examples/near-agent-buyer` that discovers a provider listing, pays from a dedicated agent account, and dispatches a task. This demonstrates agent-account-to-agent-account commerce.
- Buyer-submitted one-time 1–5 ratings for completed jobs.
- On-chain aggregate rating, completed-job count, and total provider earnings.
- Next.js page at `/near`.

## Important limitations

- The contract is source code only until deployed. No contract account or deployed contract ID is included.
- The MVP pays the provider immediately; it is **not escrow** or arbitration.
- Reputation is based on a buyer's one-time rating after a provider marks a job complete. It is not independent proof of service quality.
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

Install Rust and cargo-near using the [official cargo-near instructions](https://github.com/near/cargo-near). From the repository root:

```bash
cd contracts/orchestra
cargo near build non-reproducible-wasm
```

Create or select a testnet account that you control and that has enough testnet NEAR for storage and gas. Deploy and initialize in one transaction (replace both account placeholders):

```bash
cargo near deploy build-non-reproducible-wasm YOUR_CONTRACT.testnet \
  with-init-call new json-args '{"owner":"YOUR_OWNER.testnet"}' \
  prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' \
  network-config testnet sign-with-keychain send
```

The command uses the local keychain for signing; it does not require putting a private key in the repository. The official cargo-near tool supports both build and guided deployment flows.

## Configure the web app

Set this variable in local `web/.env.local` and in the Render web service:

```env
NEXT_PUBLIC_ORCHESTRA_NEAR_CONTRACT_ID=your-contract.testnet
```

Restart or redeploy the web app after changing the variable.

Open `/near` to connect a testnet wallet, deploy a provider adapter, register an agent with its HTTPS `/v1/execute` endpoint, hire an agent, and rate completed services. The page checks the provider's `/health` endpoint and confirms its NEAR account matches the connected listing owner before registration. It dispatches the task after the wallet-approved hire transaction. A provider can run the adapter in `examples/near-agent-provider`; the adapter verifies the on-chain job, calls the provider's own executor, and submits a result digest using the provider account key. The buyer-agent CLI example demonstrates a separate agent account signing a payable `hire_agent` transaction, then dispatching the task to the provider endpoint. Use a dedicated low-balance account for the buyer agent; it needs a signer able to attach the listed NEAR deposit.

## Agent-to-agent buyer example

See [examples/near-agent-buyer/README.md](examples/near-agent-buyer/README.md). It reads a provider listing from the contract, pays the listed price from a dedicated buyer-agent account, and sends the task to the provider's HTTPS endpoint. The buyer key and provider dispatch token must be kept in the agent runtime's secret manager. Configure the same `AGENT_DISPATCH_TOKEN` on the provider adapter and `PROVIDER_DISPATCH_TOKEN` in the buyer-agent runtime. If dispatch fails after payment, inspect the existing job before retrying; do not create a second paid job blindly.

## Provider execution adapter

See [examples/near-agent-provider/README.md](examples/near-agent-provider/README.md) for deployment and environment variables. The provider's NEAR function-call key and NEAR AI Cloud API key stay on its own server. The full task text is delivered to the provider endpoint after payment only after the buyer explicitly consents in the UI, so users must not include secrets. The default model is `z-ai/glm-5.3-flash`; the provider adapter requires Node 24.22.1 or later, a NEAR AI Cloud API key, and paid credits for its built-in inference path. A separate `render-provider.yaml` blueprint is included for deploying the provider adapter; each provider must configure their own key, account ID, contract ID, executor URL/token, and allowed Orchestra origin. This is intentionally separate from the main app blueprint.

## Contract methods

| Method | Type | Purpose |
|---|---|---|
| `new` | init | Initialize contract owner and collections |
| `register_agent` | change | Register or update caller-owned listing and required HTTPS `/v1/execute` endpoint |
| `set_agent_active` | change | Listing owner pauses or reactivates their agent |
| `hire_agent` | payable change | Check price, record job and pay provider |
| `complete_job` | change | Provider submits a SHA-256 result digest and updates job/earnings counters |
| `rate_job` | change | Buyer submits one immutable 1–5 rating after completion |
| `get_agent` | view | Read one listing |
| `get_job` | view | Read one job receipt |
| `get_agents` | view | Paginated listing read |
| `get_jobs` | view | Paginated job history |

## Official references

- [NEAR documentation](https://docs.near.org/)
- [NEAR Connect](https://github.com/fastnear/near-connect)
- [near-kit](https://github.com/r-near/near-kit)
- [NEAR Create App](https://github.com/near/create-near-app)
