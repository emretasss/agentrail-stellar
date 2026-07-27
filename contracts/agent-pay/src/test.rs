#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, BytesN, Env, String,
};

struct TestFixture {
    env: Env,
    client: AgentRailContractClient<'static>,
    token: token::Client<'static>,
    admin: Address,
    payer: Address,
    agent_owner: Address,
    contract_id: Address,
}

fn s(env: &Env, value: &str) -> String {
    String::from_str(env, value)
}

fn hash(env: &Env, seed: u8) -> BytesN<32> {
    BytesN::from_array(env, &[seed; 32])
}

fn fixture() -> TestFixture {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_sequence_number(100);

    let admin = Address::generate(&env);
    let payer = Address::generate(&env);
    let agent_owner = Address::generate(&env);

    let asset = env.register_stellar_asset_contract_v2(admin.clone());
    let token_id = asset.address();
    let stellar_asset = token::StellarAssetClient::new(&env, &token_id);
    stellar_asset.mint(&payer, &1_000_000_000);

    let contract_id = env.register(AgentRailContract, (&admin, &token_id));
    let client = AgentRailContractClient::new(&env, &contract_id);
    let token = token::Client::new(&env, &token_id);

    TestFixture {
        env,
        client,
        token,
        admin,
        payer,
        agent_owner,
        contract_id,
    }
}

fn register_default_agent(f: &TestFixture) -> u64 {
    f.client.register_agent(
        &f.agent_owner,
        &s(&f.env, "vision-api"),
        &s(&f.env, "Vision API Agent"),
        &s(&f.env, "https://api.agentrail.dev/vision"),
        &s(&f.env, "computer-vision"),
        &250_000,
    )
}

#[test]
fn registers_agents_and_lists_protocol_stats() {
    let f = fixture();
    let agent_id = register_default_agent(&f);

    let agent = f.client.get_agent(&agent_id);
    assert_eq!(agent.id, 1);
    assert_eq!(agent.owner, f.agent_owner);
    assert_eq!(agent.price, 250_000);
    assert!(agent.active);

    let agents = f.client.list_agents();
    assert_eq!(agents.len(), 1);
    assert_eq!(agents.get(0).unwrap().handle, s(&f.env, "vision-api"));

    let stats = f.client.stats();
    assert_eq!(stats.agent_count, 1);
    assert_eq!(stats.job_count, 0);
}

#[test]
fn locks_delivery_and_releases_escrow_to_agent() {
    let f = fixture();
    let agent_id = register_default_agent(&f);

    let payer_before = f.token.balance(&f.payer);
    let owner_before = f.token.balance(&f.agent_owner);

    let job_id = f
        .client
        .create_job(&f.payer, &agent_id, &hash(&f.env, 7), &300_000, &150);

    assert_eq!(f.token.balance(&f.contract_id), 300_000);
    assert_eq!(f.token.balance(&f.payer), payer_before - 300_000);

    let delivered = f
        .client
        .deliver_job(&f.agent_owner, &job_id, &hash(&f.env, 9));
    assert_eq!(delivered.status, JobStatus::Delivered);
    assert_eq!(delivered.deliverable_hash, hash(&f.env, 9));

    let closed = f.client.approve_job(&f.payer, &job_id, &5);
    assert_eq!(closed.status, JobStatus::Released);
    assert_eq!(closed.rating, 5);
    assert_eq!(f.token.balance(&f.contract_id), 0);
    assert_eq!(f.token.balance(&f.agent_owner), owner_before + 300_000);

    let agent = f.client.get_agent(&agent_id);
    assert_eq!(agent.jobs_completed, 1);
    assert_eq!(agent.rating_total, 5);
    assert_eq!(agent.earned, 300_000);
}

#[test]
fn refunds_expired_jobs_before_delivery() {
    let f = fixture();
    let agent_id = register_default_agent(&f);
    let payer_before = f.token.balance(&f.payer);

    let job_id = f
        .client
        .create_job(&f.payer, &agent_id, &hash(&f.env, 11), &250_000, &130);

    f.env.ledger().set_sequence_number(131);
    let refunded = f.client.refund_expired(&f.payer, &job_id);

    assert_eq!(refunded.status, JobStatus::Refunded);
    assert_eq!(f.token.balance(&f.payer), payer_before);
    assert_eq!(f.token.balance(&f.contract_id), 0);
}

#[test]
fn admin_can_resolve_disputes() {
    let f = fixture();
    let agent_id = register_default_agent(&f);

    let job_id = f
        .client
        .create_job(&f.payer, &agent_id, &hash(&f.env, 13), &250_000, &150);
    let disputed = f.client.dispute_job(&f.payer, &job_id);
    assert_eq!(disputed.status, JobStatus::Disputed);

    let owner_before = f.token.balance(&f.agent_owner);
    let resolved = f.client.resolve_dispute(&f.admin, &job_id, &true);

    assert_eq!(resolved.status, JobStatus::Released);
    assert_eq!(f.token.balance(&f.agent_owner), owner_before + 250_000);
}

#[test]
fn rejects_underpriced_or_late_jobs() {
    let f = fixture();
    let agent_id = register_default_agent(&f);

    let underpriced = f
        .client
        .try_create_job(&f.payer, &agent_id, &hash(&f.env, 21), &10, &150);
    assert_eq!(underpriced, Err(Ok(Error::InvalidAmount)));

    let late = f
        .client
        .try_create_job(&f.payer, &agent_id, &hash(&f.env, 22), &250_000, &100);
    assert_eq!(late, Err(Ok(Error::InvalidDeadline)));
}

#[test]
fn paginates_registry_with_bounded_limits() {
    let f = fixture();
    register_default_agent(&f);
    f.client.register_agent(
        &f.agent_owner,
        &s(&f.env, "second-agent"),
        &s(&f.env, "Second Agent"),
        &s(&f.env, "https://api.agentrail.dev/second"),
        &s(&f.env, "research"),
        &300_000,
    );

    let first_page = f.client.list_agents_page(&0, &1);
    let second_page = f.client.list_agents_page(&1, &1);
    assert_eq!(first_page.len(), 1);
    assert_eq!(first_page.get(0).unwrap().id, 1);
    assert_eq!(second_page.get(0).unwrap().id, 2);
    assert_eq!(
        f.client.try_list_agents_page(&0, &0),
        Err(Ok(Error::InvalidLimit))
    );
    assert_eq!(
        f.client.try_list_agents_page(&0, &51),
        Err(Ok(Error::InvalidLimit))
    );
}

#[test]
fn rejects_zero_star_ratings() {
    let f = fixture();
    let agent_id = register_default_agent(&f);
    let job_id = f
        .client
        .create_job(&f.payer, &agent_id, &hash(&f.env, 30), &250_000, &150);
    f.client
        .deliver_job(&f.agent_owner, &job_id, &hash(&f.env, 31));

    assert_eq!(
        f.client.try_approve_job(&f.payer, &job_id, &0),
        Err(Ok(Error::InvalidRating))
    );
}
