use super::*;
use near_sdk::{testing_env, test_utils::VMContextBuilder, AccountId, NearToken};

fn account(value: &str) -> AccountId {
    value.parse().expect("valid test account")
}

fn set_context(predecessor: AccountId, deposit: u128) {
    let mut context = VMContextBuilder::new();
    context
        .predecessor_account_id(predecessor)
        .attached_deposit(NearToken::from_yoctonear(deposit));
    testing_env!(context.build());
}

#[test]
fn agent_owner_can_register_and_update_listing() {
    let owner = account("provider.testnet");
    set_context(owner.clone(), 0);
    let mut contract = OrchestraContract::new(Some(owner.clone()));

    contract.register_agent(
        "research-agent".to_string(),
        "Research Agent".to_string(),
        "Research and summarization".to_string(),
        U128(10),
        "https://provider.example.com/v1/execute".to_string(),
    );
    contract.register_agent(
        "research-agent".to_string(),
        "Research Agent v2".to_string(),
        "Updated service description".to_string(),
        U128(20),
        "https://provider.example.com/v1/execute".to_string(),
    );

    let agent = contract.get_agent("research-agent".to_string()).unwrap();
    assert_eq!(agent.owner, owner);
    assert_eq!(agent.name, "Research Agent v2");
    assert_eq!(agent.price_yocto, U128(20));
    assert_eq!(agent.rating_count, 0);
}

#[test]
fn buyer_can_rate_completed_job_once_and_agent_reputation_updates() {
    let provider = account("provider.testnet");
    let buyer = account("buyer.testnet");

    set_context(provider.clone(), 0);
    let mut contract = OrchestraContract::new(Some(provider.clone()));
    contract.register_agent(
        "data-agent".to_string(),
        "Data Agent".to_string(),
        "Structured data service".to_string(),
        U128(100),
        "https://provider.example.com/v1/execute".to_string(),
    );

    set_context(buyer.clone(), 100);
    let job = contract.hire_agent("data-agent".to_string(), "a".repeat(64));
    assert_eq!(job.status, "PAID");
    assert_eq!(job.buyer, buyer);

    set_context(provider.clone(), 0);
    contract.complete_job(job.id, "c".repeat(64));

    set_context(buyer.clone(), 0);
    contract.rate_job(job.id, 5);

    let agent = contract.get_agent("data-agent".to_string()).unwrap();
    assert_eq!(agent.completed_jobs, 1);
    assert_eq!(agent.rating_sum, 5);
    assert_eq!(agent.rating_count, 1);
    assert_eq!(agent.total_earned_yocto, U128(100));
    assert_eq!(contract.get_agent_count(), 1);
    assert_eq!(contract.get_job_count(), 1);
    assert_eq!(contract.get_job(job.id).unwrap().result_hash, Some("c".repeat(64)));

    let jobs = contract.get_jobs(0, 10);
    assert!(jobs[0].rated);
    assert_eq!(jobs[0].result_hash, Some("c".repeat(64)));
}

#[test]
#[should_panic(expected = "Only the buyer can rate this job")]
fn third_party_cannot_rate_another_buyers_job() {
    let provider = account("provider.testnet");
    let buyer = account("buyer.testnet");
    let outsider = account("outsider.testnet");

    set_context(provider.clone(), 0);
    let mut contract = OrchestraContract::new(Some(provider.clone()));
    contract.register_agent(
        "translator".to_string(),
        "Translator".to_string(),
        "Translation service".to_string(),
        U128(50),
        "https://provider.example.com/v1/execute".to_string(),
    );

    set_context(buyer, 50);
    let job = contract.hire_agent("translator".to_string(), "b".repeat(64));
    set_context(provider, 0);
    contract.complete_job(job.id, "d".repeat(64));

    set_context(outsider, 0);
    contract.rate_job(job.id, 4);
}

#[test]
#[should_panic(expected = "Agent endpoint must be a non-empty HTTPS URL")]
fn rejects_non_https_provider_endpoints() {
    let owner = account("provider.testnet");
    set_context(owner.clone(), 0);
    let mut contract = OrchestraContract::new(Some(owner));
    contract.register_agent(
        "unsafe-agent".to_string(),
        "Unsafe Agent".to_string(),
        "Should reject insecure endpoint".to_string(),
        U128(10),
        "http://provider.example.com/execute".to_string(),
    );
}

#[test]
fn listing_owner_can_pause_and_reactivate_agent() {
    let owner = account("provider.testnet");
    set_context(owner.clone(), 0);
    let mut contract = OrchestraContract::new(Some(owner.clone()));
    contract.register_agent(
        "weather-agent".to_string(),
        "Weather Agent".to_string(),
        "Weather research".to_string(),
        U128(25),
        "https://provider.example.com/v1/execute".to_string(),
    );

    contract.set_agent_active("weather-agent".to_string(), false);
    assert!(!contract.get_agent("weather-agent".to_string()).unwrap().active);

    contract.set_agent_active("weather-agent".to_string(), true);
    assert!(contract.get_agent("weather-agent".to_string()).unwrap().active);
}

#[test]
#[should_panic(expected = "Only the listing owner can change agent status")]
fn another_account_cannot_pause_agent_listing() {
    let owner = account("provider.testnet");
    let outsider = account("outsider.testnet");
    set_context(owner.clone(), 0);
    let mut contract = OrchestraContract::new(Some(owner));
    contract.register_agent(
        "weather-agent".to_string(),
        "Weather Agent".to_string(),
        "Weather research".to_string(),
        U128(25),
        "https://provider.example.com/v1/execute".to_string(),
    );

    set_context(outsider, 0);
    contract.set_agent_active("weather-agent".to_string(), false);
}

#[test]
#[should_panic(expected = "Agent endpoint must end with /v1/execute")]
fn rejects_provider_endpoint_with_wrong_route() {
    let owner = account("provider.testnet");
    set_context(owner.clone(), 0);
    let mut contract = OrchestraContract::new(Some(owner));
    contract.register_agent(
        "bad-route-agent".to_string(),
        "Bad Route Agent".to_string(),
        "Endpoint path is incorrect".to_string(),
        U128(10),
        "https://provider.example.com/execute".to_string(),
    );
}
