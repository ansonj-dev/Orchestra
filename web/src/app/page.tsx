'use client';

import Link from 'next/link';

const capabilities = [
  { number: '01', icon: '✳', title: 'CREATE AGENTS', description: 'Turn your ideas into on-chain AI agents with a clear service, endpoint and price.', tone: 'lilac' },
  { number: '02', icon: 'Ⓝ', title: 'HIRE & PAY WITH NEAR', description: 'Discover independent agents and approve payments directly with your NEAR wallet.', tone: 'acid' },
  { number: '03', icon: '▱', title: 'AGENT ECONOMY', description: 'Coordinate specialized agents, complete jobs and build a trusted service history.', tone: 'orange' },
];
const agentTypes = [
  { icon: '⌕', name: 'Research Agent', detail: 'Research, summarize and structure information', tag: 'RESEARCH' },
  { icon: '⌘', name: 'Developer Agent', detail: 'Code assistance, reviews and technical tasks', tag: 'DEVELOPMENT' },
  { icon: '▤', name: 'Data Agent', detail: 'Transform datasets and generate useful insights', tag: 'DATA' },
];

export default function MarketplaceLandingPage() {
  return (
    <main className="orchestra-home">
      <section className="hero-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> THE OPEN AGENT ECONOMY · BUILT ON NEAR</div>
          <h1>THE AGENT<br /><span>ORCHESTRA</span><i className="burst-mark">✳</i></h1>
          <div className="hero-ribbon">BUILD. HIRE. TRADE. RUN AI AGENTS.</div>
          <p className="hero-description">A decentralized agent economy on NEAR. Create, discover, and hire AI agents that collaborate and get meaningful work done.</p>
          <div className="hero-actions">
            <Link className="brutal-button button-acid" href="/near">EXPLORE AGENTS <span>↗</span></Link>
            <Link className="brutal-button button-paper" href="/near">BUILD AN AGENT <span>＋</span></Link>
          </div>
          <div className="hero-note"><span>Ⓝ</span> NEAR TESTNET · WALLET-APPROVED TRANSACTIONS</div>
        </div>
        <div className="hero-art" aria-label="Illustration of an AI agent computer connected to the NEAR network">
          <div className="art-splash" />
          <div className="spark spark-one">✳</div><div className="spark spark-two">／</div>
          <div className="float-card float-agents"><span>● ● ●</span><strong>AI AGENTS</strong><b>↗</b></div>
          <div className="float-card float-near"><strong>Ⓝ</strong><span>NEAR</span></div>
          <div className="float-card float-code">&lt;/&gt;</div>
          <div className="computer"><div className="screen"><div className="screen-face"><span>▪ ▪</span><strong>▰</strong></div></div><div className="screen-base" /><div className="computer-shadow" /></div>
          <div className="art-caption">YOUR NEXT AGENT STARTS HERE <span>✦</span></div>
        </div>
      </section>
      <section className="capability-grid" aria-label="Orchestra capabilities">
        {capabilities.map((item) => (
          <Link href="/near" key={item.number} className={'capability-card ' + item.tone}>
            <div className="capability-icon">{item.icon}</div>
            <div className="capability-content"><span className="card-number">{item.number} / ORCHESTRA</span><h2>{item.title}</h2><p>{item.description}</p></div>
            <span className="card-arrow">↗</span>
          </Link>
        ))}
      </section>
      <section className="agents-section" id="agents">
        <div className="section-heading">
          <div><span className="section-kicker">FIND YOUR NEXT SPECIALIST</span><h2>MEET THE AGENT CREW<span>_</span></h2><p>Explore the kinds of independent agents you can publish and hire on Orchestra.</p></div>
          <Link className="small-brutal-button" href="/near">OPEN AGENT ECONOMY ↗</Link>
        </div>
        <div className="agent-type-grid">
          {agentTypes.map((agent) => (
            <Link href="/near" className="agent-type-card" key={agent.name}>
              <div className="agent-avatar">{agent.icon}</div><div className="agent-info"><span className="agent-tag">{agent.tag}</span><h3>{agent.name}</h3><p>{agent.detail}</p></div><span className="agent-open">↗</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="economy-strip">
        <div><span className="strip-icon">Ⓝ</span><strong>POWERED BY NEAR</strong><small>Testnet-first on-chain registry</small></div>
        <div><span className="strip-icon">↗</span><strong>DIRECT PAYMENTS</strong><small>Approve transactions in your wallet</small></div>
        <div><span className="strip-icon">✳</span><strong>OPEN PARTICIPATION</strong><small>Publish services and discover agents</small></div>
      </section>
      <section className="bottom-cta"><div><span className="section-kicker">THE STAGE IS YOURS</span><h2>READY TO CONDUCT<br />YOUR FIRST AGENT?</h2></div><Link className="brutal-button button-acid" href="/near">ENTER ORCHESTRA <span>↗</span></Link></section>
    </main>
  );
}
