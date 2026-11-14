import { createHash } from 'node:crypto';
import { Near } from 'near-kit';

const required = [
  'NEAR_BUYER_PRIVATE_KEY',
  'NEAR_BUYER_ACCOUNT_ID',
  'ORCHESTRA_NEAR_CONTRACT_ID',
  'TARGET_AGENT_ID',
  'TASK_TEXT',
  'PROVIDER_DISPATCH_TOKEN',
];
for (const key of required) {
  if (!process.env[key]) throw new Error('Missing required environment variable: ' + key);
}

const buyerAccountId = process.env.NEAR_BUYER_ACCOUNT_ID;
const contractId = process.env.ORCHESTRA_NEAR_CONTRACT_ID;
const targetAgentId = process.env.TARGET_AGENT_ID;
const task = process.env.TASK_TEXT;
if (task.length > 4_000) throw new Error('TASK_TEXT must be 4000 characters or fewer.');

const near = new Near({
  network: 'testnet',
  privateKey: process.env.NEAR_BUYER_PRIVATE_KEY,
  defaultSignerId: buyerAccountId,
});

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');

function yoctoToNear(value) {
  const amount = BigInt(value);
  const whole = amount / 10n ** 24n;
  const fraction = (amount % (10n ** 24n)).toString().padStart(24, '0');
  return whole.toString() + '.' + fraction + ' NEAR';
}

async function main() {
  const agent = await near.view(contractId, 'get_agent', { agent_id: targetAgentId });
  if (!agent || !agent.active) throw new Error('Target agent is missing or inactive.');
  if (agent.owner === buyerAccountId) throw new Error('Buyer agent cannot hire its own listing.');
  if (!agent.endpoint_url || !agent.endpoint_url.startsWith('https://')) {
    throw new Error('Target agent has no valid HTTPS execution endpoint.');
  }

  const taskHash = sha256(task);
  console.log('[Orchestra Buyer Agent] Hiring', agent.agent_id, 'from', agent.owner);
  console.log('[Orchestra Buyer Agent] Price:', yoctoToNear(agent.price_yocto));

  // This account signs the payable hire transaction. Use a dedicated low-balance
  // buyer-agent account; never use a personal/main wallet key here.
  const job = await near.call(contractId, 'hire_agent', {
    agent_id: agent.agent_id,
    task_hash: taskHash,
  }, {
    attachedDeposit: yoctoToNear(agent.price_yocto),
    gas: '50 Tgas',
  });

  const jobId = Number(job?.id);
  if (!Number.isSafeInteger(jobId)) {
    throw new Error('NEAR hire transaction returned no readable job ID. Inspect the transaction before retrying to avoid duplicate payment.');
  }

  console.log('[Orchestra Buyer Agent] On-chain job created:', jobId);
  const response = await fetch(agent.endpoint_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.PROVIDER_DISPATCH_TOKEN,
    },
    body: JSON.stringify({
      job_id: jobId,
      agent_id: agent.agent_id,
      task,
      task_hash: taskHash,
      contract_id: contractId,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const result = await response.json();
  if (!response.ok || !result?.success) {
    throw new Error('Job was paid, but provider execution failed: ' + (result?.error || response.statusText) + '. Inspect on-chain job #' + jobId + ' before retrying.');
  }

  console.log(JSON.stringify({
    success: true,
    buyer: buyerAccountId,
    provider: agent.owner,
    agent_id: agent.agent_id,
    job_id: jobId,
    result_hash: result.result_hash,
    result: result.result,
  }, null, 2));
}

main().catch(error => {
  console.error('[Orchestra Buyer Agent] Delegation failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
