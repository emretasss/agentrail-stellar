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

fn milestone_inputs(f: &TestFixture) -> Vec<MilestoneInput> {
    soroban_sdk::vec![
        &f.env,
        MilestoneInput {
            brief_hash: hash(&f.env, 41),
            amount: 100_000,
            deadline_ledger: 130,
        },
        MilestoneInput {
            brief_hash: hash(&f.env, 42),
            amount: 150_000,
            deadline_ledger: 160,
        },
        MilestoneInput {
            brief_hash: hash(&f.env, 43),
            amount: 200_000,
            deadline_ledger: 190,
        },
    ]
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

#[test]
fn releases_milestone_escrow_in_stages_and_finalizes_reputation() {
    let f = fixture();
    let agent_id = register_default_agent(&f);
    let payer_before = f.token.balance(&f.payer);
    let owner_before = f.token.balance(&f.agent_owner);
    let job_id = f.client.create_milestone_job(
        &f.payer,
        &agent_id,
        &hash(&f.env, 40),
        &milestone_inputs(&f),
    );

    assert_eq!(f.token.balance(&f.contract_id), 450_000);
    assert_eq!(f.token.balance(&f.payer), payer_before - 450_000);

    f.client
        .deliver_milestone(&f.agent_owner, &job_id, &0, &hash(&f.env, 51));
    let first_release = f.client.approve_milestone(&f.payer, &job_id, &0, &0);
    assert_eq!(first_release.current_index, 1);
    assert_eq!(first_release.released_amount, 100_000);
    assert_eq!(f.token.balance(&f.agent_owner), owner_before + 100_000);
    assert_eq!(f.token.balance(&f.contract_id), 350_000);

    f.client
        .deliver_milestone(&f.agent_owner, &job_id, &1, &hash(&f.env, 52));
    f.client.approve_milestone(&f.payer, &job_id, &1, &0);
    f.client
        .deliver_milestone(&f.agent_owner, &job_id, &2, &hash(&f.env, 53));
    let completed = f.client.approve_milestone(&f.payer, &job_id, &2, &5);

    assert_eq!(completed.current_index, 3);
    assert_eq!(completed.released_amount, 450_000);
    assert_eq!(f.client.get_job(&job_id).status, JobStatus::Released);
    assert_eq!(f.token.balance(&f.contract_id), 0);
    assert_eq!(f.token.balance(&f.agent_owner), owner_before + 450_000);
    let agent = f.client.get_agent(&agent_id);
    assert_eq!(agent.jobs_completed, 1);
    assert_eq!(agent.rating_total, 5);
    assert_eq!(agent.earned, 450_000);
}

#[test]
fn enforces_sequential_milestone_delivery_and_rating_rules() {
    let f = fixture();
    let agent_id = register_default_agent(&f);
    let job_id = f.client.create_milestone_job(
        &f.payer,
        &agent_id,
        &hash(&f.env, 60),
        &milestone_inputs(&f),
    );

    assert_eq!(
        f.client
            .try_deliver_milestone(&f.agent_owner, &job_id, &1, &hash(&f.env, 61)),
        Err(Ok(Error::MilestoneOutOfOrder))
    );
    f.client
        .deliver_milestone(&f.agent_owner, &job_id, &0, &hash(&f.env, 62));
    f.env.ledger().set_sequence_number(131);
    assert_eq!(
        f.client.try_refund_milestone_job(&f.payer, &job_id),
        Err(Ok(Error::InvalidStatus))
    );
    assert_eq!(
        f.client.try_approve_milestone(&f.payer, &job_id, &0, &5),
        Err(Ok(Error::InvalidMilestoneRating))
    );
}

#[test]
fn refunds_only_unreleased_milestone_balance_after_current_deadline() {
    let f = fixture();
    let agent_id = register_default_agent(&f);
    let payer_before = f.token.balance(&f.payer);
    let job_id = f.client.create_milestone_job(
        &f.payer,
        &agent_id,
        &hash(&f.env, 70),
        &milestone_inputs(&f),
    );
    f.client
        .deliver_milestone(&f.agent_owner, &job_id, &0, &hash(&f.env, 71));
    f.client.approve_milestone(&f.payer, &job_id, &0, &0);

    assert_eq!(
        f.client.try_refund_milestone_job(&f.payer, &job_id),
        Err(Ok(Error::DeadlineNotReached))
    );
    f.env.ledger().set_sequence_number(161);
    let refunded = f.client.refund_milestone_job(&f.payer, &job_id);

    assert_eq!(refunded.released_amount, 100_000);
    assert_eq!(
        refunded.milestones.get(1).unwrap().status,
        MilestoneStatus::Refunded
    );
    assert_eq!(
        refunded.milestones.get(2).unwrap().status,
        MilestoneStatus::Refunded
    );
    assert_eq!(f.client.get_job(&job_id).status, JobStatus::Refunded);
    assert_eq!(f.token.balance(&f.contract_id), 0);
    assert_eq!(f.token.balance(&f.payer), payer_before - 100_000);
}

#[test]
fn rejects_invalid_milestone_plans_and_legacy_entrypoints() {
    let f = fixture();
    let agent_id = register_default_agent(&f);
    let too_short = soroban_sdk::vec![
        &f.env,
        MilestoneInput {
            brief_hash: hash(&f.env, 80),
            amount: 250_000,
            deadline_ledger: 130,
        }
    ];
    assert_eq!(
        f.client
            .try_create_milestone_job(&f.payer, &agent_id, &hash(&f.env, 81), &too_short,),
        Err(Ok(Error::InvalidMilestoneCount))
    );

    let job_id = f.client.create_milestone_job(
        &f.payer,
        &agent_id,
        &hash(&f.env, 82),
        &milestone_inputs(&f),
    );
    assert_eq!(
        f.client
            .try_deliver_job(&f.agent_owner, &job_id, &hash(&f.env, 83)),
        Err(Ok(Error::MilestoneFlowRequired))
    );
    assert_eq!(f.client.list_milestone_plans().len(), 1);
}

#[test]
fn routes_escrow_through_an_allowlisted_stellar_asset_contract() {
    let f = fixture();
    let agent_id = register_default_agent(&f);
    let stable_asset = f.env.register_stellar_asset_contract_v2(f.admin.clone());
    let stable_id = stable_asset.address();
    let stable_admin = token::StellarAssetClient::new(&f.env, &stable_id);
    let stable_token = token::Client::new(&f.env, &stable_id);
    stable_admin.mint(&f.payer, &2_000_000);

    let configured = f
        .client
        .configure_asset(&f.admin, &stable_id, &s(&f.env, "USDC"), &7, &true);
    assert_eq!(configured.code, s(&f.env, "USDC"));
    assert_eq!(f.client.list_assets().len(), 2);

    let job_id = f.client.create_job_with_asset(
        &f.payer,
        &agent_id,
        &hash(&f.env, 90),
        &400_000,
        &150,
        &stable_id,
    );
    assert_eq!(stable_token.balance(&f.contract_id), 400_000);
    assert_eq!(f.token.balance(&f.contract_id), 0);
    assert_eq!(f.client.get_job_asset(&job_id).token, stable_id);

    f.client
        .deliver_job(&f.agent_owner, &job_id, &hash(&f.env, 91));
    f.client.approve_job(&f.payer, &job_id, &5);
    assert_eq!(stable_token.balance(&f.agent_owner), 400_000);
    assert_eq!(stable_token.balance(&f.contract_id), 0);
}

#[test]
fn rejects_disabled_or_unknown_settlement_assets() {
    let f = fixture();
    let agent_id = register_default_agent(&f);
    let asset = f.env.register_stellar_asset_contract_v2(f.admin.clone());
    let token_id = asset.address();
    f.client
        .configure_asset(&f.admin, &token_id, &s(&f.env, "PAUSED"), &7, &false);

    assert_eq!(
        f.client.try_create_job_with_asset(
            &f.payer,
            &agent_id,
            &hash(&f.env, 92),
            &250_000,
            &150,
            &token_id,
        ),
        Err(Ok(Error::AssetNotSupported))
    );
}

#[test]
fn emergency_pause_blocks_new_funding_but_preserves_safe_exit_paths() {
    let f = fixture();
    let agent_id = register_default_agent(&f);
    let funded_job = f
        .client
        .create_job(&f.payer, &agent_id, &hash(&f.env, 93), &250_000, &150);

    f.client.pause(&f.admin);
    assert!(f.client.governance().paused);
    assert_eq!(
        f.client
            .try_create_job(&f.payer, &agent_id, &hash(&f.env, 94), &250_000, &160),
        Err(Ok(Error::ProtocolPaused))
    );

    f.client
        .deliver_job(&f.agent_owner, &funded_job, &hash(&f.env, 95));
    assert_eq!(
        f.client.approve_job(&f.payer, &funded_job, &5).status,
        JobStatus::Released
    );

    f.client.resume(&f.admin);
    assert!(!f.client.governance().paused);
    assert_eq!(
        f.client
            .create_job(&f.payer, &agent_id, &hash(&f.env, 96), &250_000, &170),
        2
    );
}

#[test]
fn enforces_a_visible_timelock_before_contract_upgrades() {
    let f = fixture();
    let wasm_hash = hash(&f.env, 97);
    assert_eq!(
        f.client.try_propose_upgrade(&f.admin, &wasm_hash, &17_379),
        Err(Ok(Error::InvalidUpgradeDelay))
    );

    let proposal = f.client.propose_upgrade(&f.admin, &wasm_hash, &17_380);
    let governance = f.client.governance();
    assert!(governance.upgrade_pending);
    assert_eq!(governance.upgrade_wasm_hash, wasm_hash);
    assert_eq!(proposal.execute_after_ledger, 17_380);
    assert_eq!(
        f.client.try_execute_upgrade(&f.admin),
        Err(Ok(Error::UpgradeNotReady))
    );

    f.client.cancel_upgrade(&f.admin);
    assert!(!f.client.governance().upgrade_pending);
    assert_eq!(
        f.client.try_cancel_upgrade(&f.admin),
        Err(Ok(Error::UpgradeNotFound))
    );
}
