import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { Near } from 'near-kit';

const required = [
  'NEAR_AGENT_PRIVATE_KEY',
  'NEAR_AGENT_ACCOUNT_ID',
  'ORCHESTRA_NEAR_CONTRACT_ID',
];
for (const key of required) {
  if (!process.env[key]) throw new Error('Missing required environment variable: ' + key);
}

const accountId = process.env.NEAR_AGENT_ACCOUNT_ID;
const contractId = process.env.ORCHESTRA_NEAR_CONTRACT_ID;
const executorUrl = process.env.AGENT_EXECUTOR_URL ? new URL(process.env.AGENT_EXECUTOR_URL) : null;
if (executorUrl && executorUrl.protocol !== 'https:') {
  throw new Error('AGENT_EXECUTOR_URL must use HTTPS.');
}
if (!executorUrl && !process.env.NEARAI_API_KEY) {
  throw new Error('Set NEARAI_API_KEY for the built-in NEAR AI Cloud executor, or configure AGENT_EXECUTOR_URL for a custom executor.');
}
const nearAiBaseUrl = (process.env.NEARAI_BASE_URL || 'https://cloud-api.near.ai/v1').replace(/\/$/, '');
const nearAiModel = process.env.NEARAI_MODEL || 'zai-org/GLM-5.1-FP8';
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
const near = new Near({
  network: 'testnet',
  privateKey: process.env.NEAR_AGENT_PRIVATE_KEY,
  defaultSignerId: accountId,
});

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const activeJobs = new Set();

function send(res, status, payload, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': allowedOrigin === '*' ? '*' : allowedOrigin,
    'Vary': 'Origin',
  });
  res.end(JSON.stringify(payload));
}

async function readJson(req, maxBytes = 16_384) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body, 'utf8') > maxBytes) {
      throw new Error('Request body too large.');
    }
  }
  return JSON.parse(body || '{}');
}

async function handleExecute(req, res) {
  const origin = req.headers.origin || '';
  if (allowedOrigin !== '*' && origin !== allowedOrigin) {
    return send(res, 403, { success: false, error: 'Origin not allowed.' }, origin);
  }

  let input;
  try {
    input = await readJson(req);
  } catch (error) {
    return send(res, 400, { success: false, error: error.message || 'Invalid JSON.' }, origin);
  }

  const jobId = Number(input.job_id);
  const task = input.task;
  const agentId = input.agent_id;
  if (!Number.isSafeInteger(jobId) || jobId < 0 || typeof agentId !== 'string' || !agentId || typeof task !== 'string' || !task.trim() || task.length > 4_000) {
    return send(res, 400, { success: false, error: 'job_id and task are required; task must be 1–4000 characters.' }, origin);
  }

  const taskHash = sha256(task);
  if (input.task_hash !== taskHash) {
    return send(res, 400, { success: false, error: 'Submitted task does not match its SHA-256 digest.' }, origin);
  }

  try {
    const job = await near.view(contractId, 'get_job', { job_id: jobId });
    if (!job) return send(res, 404, { success: false, error: 'On-chain job not found.' }, origin);
    if (job.provider !== accountId) return send(res, 403, { success: false, error: 'This job belongs to a different provider account.' }, origin);
    if (job.agent_id !== agentId) return send(res, 400, { success: false, error: 'Agent identifier does not match the on-chain job.' }, origin);
    if (job.status !== 'PAID') return send(res, 409, { success: false, error: 'Job is not awaiting provider execution.' }, origin);
    if (job.task_hash !== taskHash) return send(res, 400, { success: false, error: 'Task digest does not match the on-chain job.' }, origin);

    if (activeJobs.has(jobId)) {
      return send(res, 409, { success: false, error: 'This job is already being processed by this provider instance.' }, origin);
    }
    activeJobs.add(jobId);
    try {
      // Prefer a provider-owned executor when configured; otherwise use NEAR AI Cloud directly.
      const upstream = executorUrl
        ? await fetch(executorUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(process.env.AGENT_EXECUTOR_TOKEN
                ? { Authorization: 'Bearer ' + process.env.AGENT_EXECUTOR_TOKEN }
                : {}),
            },
            body: JSON.stringify({
              task,
              job_id: jobId,
              agent_id: agentId,
              agent_account_id: accountId,
              contract_id: contractId,
            }),
            signal: AbortSignal.timeout(45_000),
          })
        : await fetch(nearAiBaseUrl + '/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + process.env.NEARAI_API_KEY,
            },
            body: JSON.stringify({
              model: nearAiModel,
              temperature: 0.2,
              max_tokens: 1600,
              messages: [
                {
                  role: 'system',
                  content: 'You are an autonomous specialist agent hired through Orchestra. Complete the buyer task accurately. Be explicit about uncertainty. Do not claim to have performed external actions unless you actually did them. Return a useful, structured answer.',
                },
                {
                  role: 'user',
                  content: task,
                },
              ],
            }),
            signal: AbortSignal.timeout(45_000),
          });

      const upstreamText = await upstream.text();
      if (Buffer.byteLength(upstreamText, 'utf8') > 100_000) {
        return send(res, 502, { success: false, error: 'Agent executor response exceeded 100 KB.' }, origin);
      }
      if (!upstream.ok) {
      console.error('[Orchestra Agent] Executor returned HTTP', upstream.status, 'for job', jobId);
      return send(res, 502, { success: false, error: 'Agent executor failed with HTTP ' + upstream.status + '.' }, origin);
    }

      let result;
      try {
        const payload = JSON.parse(upstreamText);
        if (executorUrl) {
          result = payload;
        } else {
          const output = payload?.choices?.[0]?.message?.content;
          if (typeof output !== 'string' || !output.trim()) {
            throw new Error('NEAR AI Cloud returned no assistant content.');
          }
          result = {
            provider: 'NEAR AI Cloud',
            model: payload.model || nearAiModel,
            output,
            usage: payload.usage || null,
          };
        }
      } catch (error) {
        if (!executorUrl) throw error;
        result = { output: upstreamText };
      }
      const resultHash = sha256(JSON.stringify(result));

      await near.call(contractId, 'complete_job', {
        job_id: jobId,
        result_hash: resultHash,
      }, { gas: '30 Tgas' });

      console.log('[Orchestra Agent] Completed job', jobId, 'with result digest', resultHash);
      return send(res, 200, {
        success: true,
        job_id: jobId,
        result,
        result_hash: resultHash,
        chain_receipt: 'complete_job transaction submitted and finalized',
      }, origin);
    } finally {
      activeJobs.delete(jobId);
    }
  } catch (error) {
    console.error('[Orchestra Agent] Job execution failed:', error instanceof Error ? error.message : 'unknown error');
    return send(res, 500, { success: false, error: 'Agent execution or on-chain completion failed.' }, origin);
  }
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': allowedOrigin === '*' ? '*' : allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
      'Vary': 'Origin',
    });
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { success: true, service: 'orchestra-near-agent-provider', account_id: accountId, network: 'testnet' }, origin);
  }

  if (req.method === 'POST' && req.url === '/v1/execute') {
    return handleExecute(req, res);
  }

  return send(res, 404, { success: false, error: 'Route not found.' }, origin);
});

const port = Number(process.env.PORT || 8787);
server.listen(port, () => console.log('[Orchestra Agent] Provider endpoint listening on port', port));
