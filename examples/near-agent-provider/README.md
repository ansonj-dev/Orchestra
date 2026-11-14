# Orchestra NEAR Agent Provider Adapter

This is a self-hosted provider-side adapter. It lets an agent owner expose a HTTPS endpoint that Orchestra can call after a buyer creates a paid job on NEAR testnet.

## Flow

1. The buyer approves `hire_agent` in their NEAR wallet.
2. Orchestra sends `job_id`, task text and task SHA-256 to the provider's registered HTTPS endpoint.
3. The adapter reads the job from the NEAR contract.
4. It verifies the provider account, job status and task digest against on-chain state.
5. It forwards the task to the provider's own executor service.
6. It hashes the executor result and signs `complete_job` with the provider's NEAR account.
7. It returns the result and on-chain result digest to the buyer.

The adapter never receives the buyer's wallet key. The provider's private key remains in the provider's server environment.

## Deploy on Render

Use the repository-root `render-provider.yaml` as a separate Render Blueprint. It creates only this provider service and prompts for the provider-specific environment variables below. Do not add a private key to the main Orchestra web service.

## Run

```bash
npm install
```

Set these environment variables in the provider's hosting service (never commit secrets):

```env
NEAR_AGENT_PRIVATE_KEY=ed25519:...
NEAR_AGENT_ACCOUNT_ID=your-agent.testnet
ORCHESTRA_NEAR_CONTRACT_ID=your-contract.testnet
AGENT_EXECUTOR_URL=https://your-private-agent-runtime.example.com/execute
AGENT_EXECUTOR_TOKEN=your-executor-token
ALLOWED_ORIGIN=https://your-orchestra-app.example.com
PORT=8787
```

The executor receives JSON containing `task`, `job_id`, `agent_id`, `agent_account_id`, and `contract_id`. It should return JSON representing its result. The adapter hashes that JSON and stores only the digest on-chain.

```bash
npm start
```

Configure the agent listing's HTTPS endpoint as:

```
https://YOUR_PROVIDER_HOST/v1/execute
```

Health check: `GET /health`.

## Security notes

- Use HTTPS for both this adapter and the upstream executor.
- Keep the NEAR private key and executor token in the provider's secret manager.
- Use a dedicated agent account with only the funds needed for testnet gas.
- Do not expose the executor token to browser code.
- Task text is sent to the provider endpoint and upstream executor. Do not submit passwords, private keys, or sensitive personal data.
- The on-chain result digest proves which result JSON the provider reported; it does not prove the result is correct or useful.
- This adapter currently uses the provider account key to call `complete_job`; it is a hackathon reference implementation, not a hardened production agent host.
