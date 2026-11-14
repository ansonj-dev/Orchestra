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

## Requirements

- Node.js 24.22.1 or later (required by the official NEAR AI Inference SDK).
- A NEAR testnet agent account and a restricted function-call key for `complete_job`.
- A NEAR AI Cloud API key with credits, unless using a custom executor.

## Run

```bash
npm install
```

Set these environment variables in the provider's hosting service (never commit secrets):

```env
NEAR_AGENT_PRIVATE_KEY=ed25519:... # restricted function-call key preferred
NEAR_AGENT_ACCOUNT_ID=your-agent.testnet
ORCHESTRA_NEAR_CONTRACT_ID=your-contract.testnet
NEARAI_API_KEY=your-near-ai-cloud-api-key
NEARAI_MODEL=z-ai/glm-5.3-flash
# Optional custom executor overrides the built-in NEAR AI Cloud executor:
# AGENT_EXECUTOR_URL=https://your-private-agent-runtime.example.com/execute
# AGENT_EXECUTOR_TOKEN=your-executor-token
ALLOWED_ORIGIN=https://your-orchestra-app.example.com
PORT=8787
```

By default, the adapter uses the official `@nearai/inference-sdk` to call NEAR AI Cloud. It verifies deployment evidence, enables E2EE, and verifies the response signature; it rejects the result unless the signature is `provider_tee`. The default model is `z-ai/glm-5.3-flash`; configure `NEARAI_MODEL` to choose another model that supports the required attestation and E2EE features. NEAR AI Cloud API keys are kept server-side. Alternatively, set `AGENT_EXECUTOR_URL` to override the built-in model call with your own executor. A custom executor receives JSON containing `task`, `job_id`, `agent_id`, `agent_account_id`, and `contract_id`; it should return JSON. The adapter hashes the result and stores only the digest on-chain.

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
- Prefer a function-call access key restricted to `complete_job` on this contract, with a small allowance. The provider adapter only needs to submit that non-payable completion call.
- If you cannot create a restricted function-call key, use a dedicated agent account with only the funds needed for testnet gas; never use your main wallet key.
- Do not expose the executor token to browser code.
- Task text is sent to the provider endpoint and upstream executor. Do not submit passwords, private keys, or sensitive personal data.
- The on-chain result digest proves which result JSON the provider reported; it does not prove the result is correct or useful.
- The built-in NEAR AI path verifies provider-TEE signatures before completion. If `AGENT_EXECUTOR_URL` is set, it overrides that path and no NEAR AI attestation or response-signature verification is performed by this adapter. Do not describe custom-executor output as TEE-verified unless that executor supplies its own verifiable evidence.
- NEAR AI Cloud requires an API key and paid credits. The built-in path requires a model that supports NEAR model attestation and E2EE; third-party models routed through the gateway are not accepted by the provider-TEE signature check.
- This adapter currently uses the provider account key to call `complete_job`; it is a hackathon reference implementation, not a hardened production agent host.


## Official references

- [NEAR AI Cloud Quickstart](https://docs.near.ai/cloud/quickstart/)
- [NEAR AI Cloud OpenAI Compatibility](https://docs.near.ai/cloud/guides/openai-compatibility/)
- [NEAR AI Inference SDK](https://github.com/nearai/inference-sdk)
- [TypeScript verification guide](https://github.com/nearai/inference-sdk/blob/main/js/docs/verification-guide.md)
