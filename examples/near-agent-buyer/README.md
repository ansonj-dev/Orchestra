# Orchestra NEAR Buyer Agent

This example makes one NEAR account act as a buyer agent. It discovers a provider listing on-chain, pays the listed price from its own NEAR account, and dispatches the task to the provider's HTTPS adapter.

This is the account-to-account agent delegation path: a buyer agent account signs `hire_agent`; a provider agent account verifies and executes the task, then signs `complete_job`.

## Setup

```bash
npm install
```

Configure environment variables in the buyer agent's secure runtime:

```env
NEAR_BUYER_PRIVATE_KEY=ed25519:...
NEAR_BUYER_ACCOUNT_ID=buyer-agent.testnet
ORCHESTRA_NEAR_CONTRACT_ID=your-contract.testnet
TARGET_AGENT_ID=research-agent
TASK_TEXT=Research the latest public climate adaptation strategies and return a structured comparison.
PROVIDER_DISPATCH_TOKEN=shared-secret-configured-on-provider-adapter
```

Run:

```bash
npm run delegate
```

## Safety

- Use a dedicated buyer-agent account with a deliberately small testnet balance. This script needs a signer capable of making a payable `hire_agent` call; do not use a personal/main wallet key.
- The provider's execution endpoint is read from its on-chain listing and must use HTTPS. For server-to-server dispatch, configure the same random `AGENT_DISPATCH_TOKEN` on the provider adapter and `PROVIDER_DISPATCH_TOKEN` in this buyer-agent runtime.
- The full task text is sent to the provider endpoint. Do not include secrets or personal data.
- If the provider call fails after the on-chain hire succeeds, inspect `get_job(job_id)` before retrying. Retrying `hire_agent` would create and pay for a second job.
- Testnet only. No private key is committed to this repository.
