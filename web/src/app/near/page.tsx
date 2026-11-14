'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';

type Job = {
  id: number;
  agent_id: string;
  buyer: string;
  provider: string;
  task_hash: string;
  result_hash: string | null;
  price_yocto: string;
  status: string;
  created_at: number;
  completed_at: number | null;
  rated: boolean;
};

type Agent = {
  agent_id: string;
  owner: string;
  name: string;
  description: string;
  endpoint_url: string;
  price_yocto: string;
  active: boolean;
  registered_at: number;
  rating_sum: number;
  rating_count: number;
  completed_jobs: number;
  total_earned_yocto: string;
};

const CONTRACT_ID = process.env.NEXT_PUBLIC_ORCHESTRA_NEAR_CONTRACT_ID || '';
const EXPLORER = 'https://testnet.nearblocks.io';

function yoctoToNear(value: string) {
  const amount = BigInt(value || '0');
  const whole = amount / 10n ** 24n;
  const fraction = (amount % (10n ** 24n)).toString().padStart(24, '0').slice(0, 4);
  return whole.toString() + '.' + fraction;
}

function nearToYocto(value: string) {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,24})?$/.test(normalized)) {
    throw new Error('Enter a valid NEAR amount with up to 24 decimals.');
  }
  const parts = normalized.split('.');
  const fraction = parts[1] || '';
  return (BigInt(parts[0]) * 10n ** 24n + BigInt((fraction + '0'.repeat(24)).slice(0, 24))).toString();
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export default function NearEconomyPage() {
  const [connector, setConnector] = useState<any>(null);
  const [near, setNear] = useState<any>(null);
  const [accountId, setAccountId] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [price, setPrice] = useState('0.01');
  const [task, setTask] = useState('Run a sample research task and return a structured result.');
  const [rating, setRating] = useState('5');
  const [consentToDispatch, setConsentToDispatch] = useState(false);

  const refreshJobs = useCallback(async () => {
    if (!near || !CONTRACT_ID) return;
    try {
      const rows = await near.view(CONTRACT_ID, 'get_jobs', { from_index: 0, limit: 50 });
      setJobs(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read on-chain job history.');
    }
  }, [near]);

  const refreshAgents = useCallback(async () => {
    if (!near || !CONTRACT_ID) return;
    setLoading(true);
    try {
      const rows = await near.view(CONTRACT_ID, 'get_agents', { from_index: 0, limit: 50 });
      setAgents(Array.isArray(rows) ? rows : []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read the on-chain agent registry.');
    } finally {
      setLoading(false);
    }
  }, [near]);

  useEffect(() => {
    let active = true;
    let instance: any;
    (async () => {
      try {
        const [{ Near, fromHotConnect }, { NearConnector }] = await Promise.all([
          import('near-kit'),
          import('@hot-labs/near-connect'),
        ]);
        instance = new NearConnector({ network: 'testnet' });
        instance.on('wallet:signIn', (event: any) => {
          if (!active) return;
          const id = event?.accounts?.[0]?.accountId || event?.accountId || '';
          setAccountId(id);
          setNear(new Near({ network: 'testnet', wallet: fromHotConnect(instance) }));
          setNotice(id ? 'Connected: ' + id : 'NEAR wallet connected.');
          setError('');
        });
        instance.on('wallet:signOut', () => {
          if (!active) return;
          setAccountId('');
          setNear(new Near({ network: 'testnet' }));
          setNotice('Wallet disconnected.');
        });
        let restoredAccountId = '';
        try {
          const wallet = await instance.wallet();
          const accounts = await wallet.getAccounts();
          restoredAccountId = accounts?.[0]?.accountId || '';
        } catch {
          // No existing wallet session; public registry browsing remains available.
        }
        if (active) {
          if (restoredAccountId) {
            setAccountId(restoredAccountId);
            setNear(new Near({ network: 'testnet', wallet: fromHotConnect(instance) }));
          } else {
            setNear(new Near({ network: 'testnet' }));
          }
          setConnector(instance);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not initialize NEAR Connect.');
      }
    })();
    return () => {
      active = false;
      instance = null;
    };
  }, []);

  useEffect(() => { refreshAgents(); refreshJobs(); }, [refreshAgents, refreshJobs]);

  const connect = async () => {
    setBusy(true);
    setError('');
    try {
      await connector?.connect();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wallet connection failed.');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    try {
      await connector?.disconnect();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wallet disconnect failed.');
    }
  };

  const registerAgent = async (event: FormEvent) => {
    event.preventDefault();
    if (!near || !CONTRACT_ID) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const agentId = name.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '');
      if (!agentId) throw new Error('Enter an agent name.');
      await near.call(CONTRACT_ID, 'register_agent', {
        agent_id: agentId,
        name: name.trim(),
        description: description.trim(),
        price_yocto: nearToYocto(price),
        endpoint_url: endpointUrl.trim(),
      });
      setNotice('Agent registration transaction submitted to NEAR testnet.');
      await refreshAgents();
      await refreshJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Agent registration failed.');
    } finally {
      setBusy(false);
    }
  };

  const hireAgent = async (agent: Agent) => {
    if (!near || !CONTRACT_ID) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      // Only the SHA-256 digest is written on-chain. Keep private task details off-chain.
      const taskHash = await sha256(task);
      const created = await near.call(CONTRACT_ID, 'hire_agent', {
        agent_id: agent.agent_id,
        task_hash: taskHash,
      }, { attachedDeposit: yoctoToNear(agent.price_yocto) + ' NEAR' });
      const jobId = Number((created as any)?.id);
      if (agent.endpoint_url && Number.isSafeInteger(jobId)) {
        try {
          const dispatch = await fetch(agent.endpoint_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_id: jobId, agent_id: agent.agent_id, task, task_hash: taskHash, contract_id: CONTRACT_ID }),
          });
          const dispatchResult = await dispatch.json();
          if (!dispatch.ok || !dispatchResult?.success) {
            setNotice('Job #' + jobId + ' was paid on NEAR, but the provider endpoint did not complete dispatch: ' + (dispatchResult?.error || dispatch.statusText));
          } else {
            setNotice('Job #' + jobId + ' paid and dispatched. Provider receipt: ' + (dispatchResult.result_hash || 'submitted'));
          }
        } catch (dispatchError) {
          setNotice('Job #' + jobId + ' was paid on NEAR, but the provider endpoint could not be reached. The on-chain job remains available for retry.');
        }
      } else {
        setNotice('Hire transaction submitted. ' + yoctoToNear(agent.price_yocto) + ' NEAR was paid to the provider. No execution endpoint is configured for this listing.');
      }
      await refreshAgents();
      await refreshJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hire transaction failed.');
    } finally {
      setBusy(false);
    }
  };

  const retryDispatch = async (job: Job) => {
    if (!near || !CONTRACT_ID) return;
    const agent = agents.find(item => item.agent_id === job.agent_id);
    if (!agent?.endpoint_url) {
      setError('The provider listing has no execution endpoint.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const taskHash = await sha256(task);
      if (taskHash !== job.task_hash) {
        throw new Error('The task text does not match this on-chain job. Restore the exact original task before retrying.');
      }
      const response = await fetch(agent.endpoint_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          agent_id: agent.agent_id,
          task,
          task_hash: taskHash,
          contract_id: CONTRACT_ID,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Provider dispatch failed.');
      }
      setNotice('Job #' + job.id + ' was dispatched and completed. Result digest: ' + result.result_hash);
      await refreshJobs();
      await refreshAgents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not retry provider dispatch.');
    } finally {
      setBusy(false);
    }
  };

  const rateJob = async (jobId: number) => {
    if (!near || !CONTRACT_ID) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await near.call(CONTRACT_ID, 'rate_job', { job_id: jobId, rating: Number(rating) });
      setNotice('Your agent rating was submitted to NEAR testnet.');
      await refreshJobs();
      await refreshAgents();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit the agent rating.');
    } finally {
      setBusy(false);
    }
  };


  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-3">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-400">Orchestra × NEAR Protocol</div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Agent Economy, on-chain.</h1>
          <p className="max-w-3xl leading-relaxed text-slate-400">
            Connect a NEAR testnet wallet, publish an agent listing, and hire another agent with a wallet-approved payment.
            The contract records the listing, payment and job status; off-chain work still happens in the Orchestra runtime.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {accountId ? (
              <>
                <span className="rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-300">{accountId}</span>
                <button onClick={disconnect} className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-slate-500">Disconnect</button>
              </>
            ) : (
              <button onClick={connect} disabled={!connector || busy} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">
                {busy ? 'Connecting…' : 'Connect NEAR wallet'}
              </button>
            )}
            <span className="rounded-xl border border-slate-800 px-4 py-2 text-sm text-slate-400">Network: NEAR Testnet</span>
            {CONTRACT_ID && <a className="rounded-xl border border-slate-800 px-4 py-2 text-sm text-cyan-300 hover:border-cyan-700" href={EXPLORER + '/address/' + CONTRACT_ID} target="_blank" rel="noreferrer">View contract</a>}
          </div>
        </header>

        {!CONTRACT_ID && (
          <section className="rounded-2xl border border-amber-800/70 bg-amber-950/30 p-5 text-amber-200">
            <h2 className="font-bold">Contract deployment required</h2>
            <p className="mt-2 text-sm text-amber-100/80">
              Contract source is included in this repository, but it has not been deployed. Deploy it to a testnet account,
              then set NEXT_PUBLIC_ORCHESTRA_NEAR_CONTRACT_ID in the web service environment.
            </p>
          </section>
        )}

        {notice && <div role="status" className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm text-emerald-200">{notice}</div>}
        {error && <div role="alert" className="rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</div>}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={registerAgent} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div>
              <div className="font-mono text-xs text-emerald-400">PROVIDER</div>
              <h2 className="mt-1 text-xl font-bold">Register an agent</h2>
              <p className="mt-1 text-sm text-slate-400">Publish a service under your connected NEAR account.</p>
            </div>
            <input required maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="Agent name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
            <textarea required maxLength={500} value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this agent do?" rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
            <label className="block text-sm text-slate-400">HTTPS agent execution endpoint
              <input value={endpointUrl} onChange={e => setEndpointUrl(e.target.value)} type="url" required maxLength={300} placeholder="https://your-agent.example.com/v1/execute" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" />
              <span className="mt-1 block text-xs text-slate-500">Optional. When configured, hiring sends the task to this provider-owned endpoint.</span>
            </label>
            <label className="block text-sm text-slate-400">Price per job (NEAR)
              <input required value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500" />
            </label>
            <button disabled={!accountId || !CONTRACT_ID || busy} className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-40">{busy ? 'Please wait…' : 'Register on NEAR'}</button>
          </form>

          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div>
              <div className="font-mono text-xs text-cyan-400">BUYER</div>
              <h2 className="mt-1 text-xl font-bold">Hire an agent</h2>
              <p className="mt-1 text-sm text-slate-400">Your wallet asks you to approve the listed price plus network gas.</p>
            </div>
            <textarea required maxLength={4000} value={task} onChange={e => setTask(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-500" />
            <p className="text-xs text-slate-500">Only a SHA-256 task hash is stored on-chain. If the provider has an HTTPS endpoint, the full task text is sent directly to that endpoint after your wallet approves payment. Do not include secrets.</p>
            <label className="flex items-start gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={consentToDispatch} onChange={e => setConsentToDispatch(e.target.checked)} className="mt-0.5 accent-cyan-500" />
              I understand that the task text will be sent to the selected provider's endpoint for execution.
            </label>
            <div className="text-sm text-slate-400">On-chain listings: <strong className="text-white">{agents.length}</strong></div>
            <button onClick={refreshAgents} disabled={!near || loading} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40">{loading ? 'Refreshing…' : 'Refresh listings'}</button>
            <div className="space-y-3">
              {agents.length === 0 && <p className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-500">{CONTRACT_ID ? 'No listings found yet, or the contract is not deployed/initialized.' : 'Configure the contract ID to load listings.'}</p>}
              {agents.map(agent => (
                <article key={agent.agent_id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white">{agent.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{agent.description}</p>
                      <p className="mt-2 text-xs text-slate-500">Provider: {agent.owner}</p>
                      <p className="mt-1 text-xs text-cyan-300 break-all">{agent.endpoint_url}</p>
                      <p className="mt-1 text-xs text-amber-300">
                        {agent.rating_count > 0 ? '★ ' + (agent.rating_sum / agent.rating_count).toFixed(1) + ' / 5 · ' + agent.rating_count + ' ratings' : 'New agent · no ratings yet'}
                        {' · '}{agent.completed_jobs} completed jobs
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Provider earnings: {yoctoToNear(agent.total_earned_yocto)} NEAR
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-300">{yoctoToNear(agent.price_yocto)} NEAR</div>
                      <button onClick={() => hireAgent(agent)} disabled={!accountId || !CONTRACT_ID || busy || !agent.active || !agent.endpoint_url || agent.owner === accountId || !consentToDispatch} className="mt-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-40">Hire</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-xs text-violet-400">ON-CHAIN ACTIVITY</div>
              <h2 className="mt-1 text-xl font-bold">Agent jobs</h2>
              <p className="mt-1 text-sm text-slate-400">Public job receipts and provider-reported completion status.</p>
            </div>
            <button onClick={refreshJobs} disabled={!near || busy} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40">Refresh jobs</button>
          </div>
          {jobs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-500">No jobs recorded by this contract yet.</p>
          ) : (
            <div className="space-y-2">
              {jobs.map(job => (
                <article key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-slate-500">JOB #{job.id} · {job.agent_id}</div>
                    <div className="mt-1 text-sm text-slate-300">Buyer: {job.buyer} · Provider: {job.provider}</div>
                    <div className="mt-1 break-all text-xs text-slate-500">Task digest: {job.task_hash}</div>
                    {job.result_hash && <div className="mt-1 break-all text-xs text-emerald-300">Result digest: {job.result_hash}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={job.status === 'COMPLETED' ? 'text-xs font-bold text-emerald-300' : 'text-xs font-bold text-amber-300'}>{job.status}</span>
                    {accountId === job.provider && job.status === 'PAID' && (
                      <span className="text-xs text-slate-500">Awaiting provider endpoint execution</span>
                    )}
                    {accountId === job.buyer && job.status === 'PAID' && agents.some(agent => agent.agent_id === job.agent_id && !!agent.endpoint_url) && (
                      <button onClick={() => retryDispatch(job)} disabled={busy || !consentToDispatch} className="rounded-lg border border-cyan-800 px-3 py-2 text-xs font-bold text-cyan-300 disabled:opacity-40">Retry dispatch</button>
                    )}
                    {accountId === job.buyer && job.status === 'COMPLETED' && !job.rated && (
                      <div className="flex items-center gap-2">
                        <select value={rating} onChange={e => setRating(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white">
                          <option value="5">5 ★</option>
                          <option value="4">4 ★</option>
                          <option value="3">3 ★</option>
                          <option value="2">2 ★</option>
                          <option value="1">1 ★</option>
                        </select>
                        <button onClick={() => rateJob(job.id)} disabled={busy} className="rounded-lg border border-amber-700 px-3 py-2 text-xs font-bold text-amber-300 disabled:opacity-40">Rate</button>
                      </div>
                    )}
                    {job.rated && <span className="text-xs text-slate-500">Rated</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 p-5 text-sm text-slate-400">
          <strong className="text-white">Trust boundary:</strong> NEAR records agent ownership, buyer, task hash, payment and provider completion status.
          The provider adapter verifies the job and task digest, executes the provider's own runtime, and submits a result digest.
          Buyers can leave one immutable 1–5 rating per completed job. Result digests and ratings are attestations, not independent proof that work is correct.
        </section>
      </div>
    </main>
  );
}
