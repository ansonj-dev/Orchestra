use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::Vector,
    env,
    json_types::U128,
    near, AccountId, NearToken, PanicOnDefault, Promise,
};
use near_sdk::store::LookupMap;
use near_sdk::BorshStorageKey;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::require;

#[derive(BorshSerialize, BorshStorageKey)]
enum StorageKey { Agents, AgentIds, Jobs }

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Agent {
    pub agent_id: String,
    pub owner: AccountId,
    pub name: String,
    pub description: String,
    pub price_yocto: U128,
    pub active: bool,
    pub registered_at: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Job {
    pub id: u64,
    pub agent_id: String,
    pub buyer: AccountId,
    pub provider: AccountId,
    pub task_hash: String,
    pub price_yocto: U128,
    pub status: String,
    pub created_at: u64,
    pub completed_at: Option<u64>,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct OrchestraContract {
    owner: AccountId,
    agents: LookupMap<String, Agent>,
    agent_ids: Vector<String>,
    jobs: Vector<Job>,
}

#[near]
impl OrchestraContract {
    #[init]
    pub fn new(owner: Option<AccountId>) -> Self {
        Self {
            owner: owner.unwrap_or_else(env::predecessor_account_id),
            agents: LookupMap::new(StorageKey::Agents),
            agent_ids: Vector::new(StorageKey::AgentIds),
            jobs: Vector::new(StorageKey::Jobs),
        }
    }

    /// Register or update the caller's agent listing. The caller owns the listing.
    pub fn register_agent(&mut self, agent_id: String, name: String, description: String, price_yocto: U128) {
        let caller = env::predecessor_account_id();
        let agent_id = Self::validate_agent_id(agent_id);
        require!(!name.trim().is_empty() && name.len() <= 80, "Invalid agent name");
        require!(description.len() <= 500, "Description too long");
        require!(price_yocto.0 > 0, "Price must be greater than zero");

        if let Some(existing) = self.agents.get(&agent_id) {
            require!(existing.owner == caller, "Only the listing owner can update it");
            let registered_at = existing.registered_at;
            self.agents.insert(agent_id.clone(), Agent {
                agent_id, owner: caller, name, description, price_yocto,
                active: true, registered_at,
            });
        } else {
            let agent = Agent {
                agent_id: agent_id.clone(), owner: caller, name, description,
                price_yocto, active: true, registered_at: env::block_timestamp(),
            };
            self.agent_ids.push(&agent_id);
            self.agents.insert(agent_id, agent);
        }
    }

    /// Hire an agent. The listed price is transferred directly to the provider.
    /// Only a task hash is stored on-chain; never publish private task data.
    #[payable]
    pub fn hire_agent(&mut self, agent_id: String, task_hash: String) -> Job {
        let agent_id = Self::validate_agent_id(agent_id);
        let agent = self.agents.get(&agent_id).expect("Agent not found").clone();
        require!(agent.active, "Agent listing is inactive");
        require!(agent.owner != env::predecessor_account_id(), "Cannot hire your own agent");
        require!(task_hash.len() == 64 && task_hash.chars().all(|c| c.is_ascii_hexdigit()), "task_hash must be a SHA-256 hex digest");

        let attached = env::attached_deposit().as_yoctonear();
        let price = agent.price_yocto.0;
        require!(attached >= price, "Attached deposit is below the listed price");

        let buyer = env::predecessor_account_id();
        let job = Job {
            id: self.jobs.len(), agent_id, buyer, provider: agent.owner.clone(),
            task_hash, price_yocto: U128(price), status: "PAID".to_string(),
            created_at: env::block_timestamp(), completed_at: None,
        };
        self.jobs.push(&job);

        Promise::new(agent.owner).transfer(NearToken::from_yoctonear(price));
        if attached > price {
            Promise::new(env::predecessor_account_id())
                .transfer(NearToken::from_yoctonear(attached - price));
        }
        job
    }

    /// Provider assertion only; this does not independently verify off-chain work.
    pub fn complete_job(&mut self, job_id: u64) {
        let mut job = self.jobs.get(job_id).expect("Job not found");
        require!(job.provider == env::predecessor_account_id(), "Only the provider can complete this job");
        require!(job.status == "PAID", "Job is not awaiting completion");
        job.status = "COMPLETED".to_string();
        job.completed_at = Some(env::block_timestamp());
        self.jobs.replace(job_id, &job);
    }

    pub fn get_agent(&self, agent_id: String) -> Option<Agent> {
        self.agents.get(&agent_id).cloned()
    }

    pub fn get_agents(&self, from_index: u32, limit: u32) -> Vec<Agent> {
        let start = from_index as u64;
        let end = std::cmp::min(self.agent_ids.len(), start.saturating_add(limit.min(50) as u64));
        (start..end)
            .filter_map(|index| self.agent_ids.get(index))
            .filter_map(|id| self.agents.get(&id).cloned())
            .collect()
    }

    pub fn get_jobs(&self, from_index: u32, limit: u32) -> Vec<Job> {
        let start = from_index as u64;
        let end = std::cmp::min(self.jobs.len(), start.saturating_add(limit.min(50) as u64));
        (start..end).filter_map(|index| self.jobs.get(index)).collect()
    }

    pub fn get_owner(&self) -> AccountId { self.owner.clone() }

    fn validate_agent_id(agent_id: String) -> String {
        let normalized = agent_id.trim().to_ascii_lowercase();
        require!(!normalized.is_empty() && normalized.len() <= 48, "Invalid agent id length");
        require!(normalized.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-' || c == '_'), "Agent id contains invalid characters");
        normalized
    }
}
