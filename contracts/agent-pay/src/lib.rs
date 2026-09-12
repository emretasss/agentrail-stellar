#![no_std]
#![allow(clippy::too_many_arguments)]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contractmeta, contracttype, symbol_short,
    token, Address, BytesN, Env, MuxedAddress, String, Symbol, Vec,
};

const INSTANCE_TTL_THRESHOLD: u32 = 10_000;
const INSTANCE_TTL_BUMP: u32 = 518_400;
const MAX_PAGE_SIZE: u32 = 50;

contractmeta!(key = "name", val = "AgentRail Escrow");
contractmeta!(key = "version", val = "0.6.0");

const MIN_MILESTONES: u32 = 2;
const MAX_MILESTONES: u32 = 8;
const MAX_TOKEN_DECIMALS: u32 = 18;
const MIN_UPGRADE_DELAY_LEDGERS: u32 = 17_280;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    NextAgentId,
    NextJobId,
    AgentIds,
    JobIds,
    Agent(u64),
    Job(u64),
    MilestoneJobIds,
    MilestonePlan(u64),
    AssetIds,
    Asset(Address),
    JobAsset(u64),
    Paused,
    PendingUpgrade,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Agent {
    pub id: u64,
    pub owner: Address,
    pub handle: String,
    pub name: String,
    pub endpoint: String,
    pub category: String,
    pub price: i128,
    pub active: bool,
    pub jobs_completed: u32,
    pub rating_total: u32,
    pub rating_count: u32,
    pub earned: i128,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum JobStatus {
    Funded = 0,
    Delivered = 1,
    Released = 2,
    Refunded = 3,
    Disputed = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Job {
    pub id: u64,
    pub agent_id: u64,
    pub payer: Address,
    pub agent_owner: Address,
    pub brief_hash: BytesN<32>,
    pub deliverable_hash: BytesN<32>,
    pub amount: i128,
    pub deadline_ledger: u32,
    pub status: JobStatus,
    pub rating: u32,
    pub created_ledger: u32,
    pub delivered_ledger: u32,
    pub closed_ledger: u32,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum MilestoneStatus {
    Funded = 0,
    Delivered = 1,
    Released = 2,
    Refunded = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneInput {
    pub brief_hash: BytesN<32>,
    pub amount: i128,
    pub deadline_ledger: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub index: u32,
    pub brief_hash: BytesN<32>,
    pub deliverable_hash: BytesN<32>,
    pub amount: i128,
    pub deadline_ledger: u32,
    pub status: MilestoneStatus,
    pub delivered_ledger: u32,
    pub closed_ledger: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestonePlan {
    pub job_id: u64,
    pub current_index: u32,
    pub released_amount: i128,
    pub milestones: Vec<Milestone>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProtocolStats {
    pub agent_count: u64,
    pub job_count: u64,
    pub token: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SettlementAsset {
    pub token: Address,
    pub code: String,
    pub decimals: u32,
    pub enabled: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct JobSettlement {
    pub job_id: u64,
    pub token: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UpgradeProposal {
    pub wasm_hash: BytesN<32>,
    pub proposed_ledger: u32,
    pub execute_after_ledger: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProtocolGovernance {
    pub paused: bool,
    pub version: u32,
    pub min_upgrade_delay_ledgers: u32,
    pub upgrade_pending: bool,
    pub upgrade_wasm_hash: BytesN<32>,
    pub upgrade_execute_after_ledger: u32,
}

#[contractevent(topics = ["agent"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AgentEvent {
    #[topic]
    pub action: Symbol,
    pub agent_id: u64,
}

#[contractevent(topics = ["job"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct JobEvent {
    #[topic]
    pub action: Symbol,
    pub job_id: u64,
}

#[contractevent(topics = ["milestone"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneEvent {
    #[topic]
    pub action: Symbol,
    pub job_id: u64,
    pub index: u32,
    pub amount: i128,
}

#[contractevent(topics = ["asset"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AssetEvent {
    #[topic]
    pub action: Symbol,
    pub token: Address,
}

#[contractevent(topics = ["govern"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GovernanceEvent {
    #[topic]
    pub action: Symbol,
    pub execute_after_ledger: u32,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    AgentNotFound = 3,
    JobNotFound = 4,
    Unauthorized = 5,
    InvalidAmount = 6,
    InvalidDeadline = 7,
    AgentInactive = 8,
    InvalidStatus = 9,
    DeadlineNotReached = 10,
    InvalidRating = 11,
    InvalidLimit = 12,
    Overflow = 13,
    InvalidMilestoneCount = 14,
    InvalidMilestone = 15,
    MilestoneNotFound = 16,
    MilestoneOutOfOrder = 17,
    InvalidMilestoneRating = 18,
    MilestoneFlowRequired = 19,
    AssetNotSupported = 20,
    InvalidAsset = 21,
    ProtocolPaused = 22,
    UpgradeNotFound = 23,
    UpgradeNotReady = 24,
    InvalidUpgradeDelay = 25,
}

#[contract]
pub struct AgentRailContract;

#[contractimpl]
impl AgentRailContract {
    pub fn __constructor(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::NextAgentId, &1u64);
        env.storage().instance().set(&DataKey::NextJobId, &1u64);
        env.storage()
            .instance()
            .set(&DataKey::AgentIds, &Vec::<u64>::new(&env));
        env.storage()
            .instance()
            .set(&DataKey::JobIds, &Vec::<u64>::new(&env));
        env.storage()
            .instance()
            .set(&DataKey::MilestoneJobIds, &Vec::<u64>::new(&env));
        let default_asset = SettlementAsset {
            token: token.clone(),
            code: String::from_str(&env, "XLM"),
            decimals: 7,
            enabled: true,
        };
        env.storage()
            .instance()
            .set(&DataKey::Asset(token.clone()), &default_asset);
        env.storage()
            .instance()
            .set(&DataKey::AssetIds, &soroban_sdk::vec![&env, token]);
        env.storage().instance().set(&DataKey::Paused, &false);
        bump_ttl(&env);
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        read_admin(&env)
    }

    pub fn token(env: Env) -> Result<Address, Error> {
        read_token(&env)
    }

    pub fn governance(env: Env) -> Result<ProtocolGovernance, Error> {
        ensure_initialized(&env)?;
        let pending: Option<UpgradeProposal> =
            env.storage().instance().get(&DataKey::PendingUpgrade);
        Ok(ProtocolGovernance {
            paused: read_paused(&env),
            version: 6,
            min_upgrade_delay_ledgers: MIN_UPGRADE_DELAY_LEDGERS,
            upgrade_pending: pending.is_some(),
            upgrade_wasm_hash: pending
                .as_ref()
                .map(|proposal| proposal.wasm_hash.clone())
                .unwrap_or(BytesN::from_array(&env, &[0; 32])),
            upgrade_execute_after_ledger: pending
                .map(|proposal| proposal.execute_after_ledger)
                .unwrap_or(0),
        })
    }

    pub fn configure_asset(
        env: Env,
        admin: Address,
        token: Address,
        code: String,
        decimals: u32,
        enabled: bool,
    ) -> Result<SettlementAsset, Error> {
        require_admin(&env, &admin)?;
        if code.is_empty() || decimals > MAX_TOKEN_DECIMALS {
            return Err(Error::InvalidAsset);
        }

        let asset = SettlementAsset {
            token: token.clone(),
            code,
            decimals,
            enabled,
        };
        if !env.storage().instance().has(&DataKey::Asset(token.clone())) {
            let mut ids = read_asset_ids(&env);
            ids.push_back(token.clone());
            env.storage().instance().set(&DataKey::AssetIds, &ids);
        }
        env.storage()
            .instance()
            .set(&DataKey::Asset(token.clone()), &asset);
        bump_ttl(&env);
        AssetEvent {
            action: symbol_short!("config"),
            token,
        }
        .publish(&env);
        Ok(asset)
    }

    pub fn list_assets(env: Env) -> Result<Vec<SettlementAsset>, Error> {
        ensure_initialized(&env)?;
        let mut assets = Vec::<SettlementAsset>::new(&env);
        for token in read_asset_ids(&env).iter() {
            if let Some(asset) = env.storage().instance().get(&DataKey::Asset(token)) {
                assets.push_back(asset);
            }
        }
        Ok(assets)
    }

    pub fn get_job_asset(env: Env, job_id: u64) -> Result<SettlementAsset, Error> {
        read_job(&env, job_id)?;
        read_asset(&env, &read_job_token(&env, job_id)?)
    }

    pub fn list_job_settlements(env: Env) -> Result<Vec<JobSettlement>, Error> {
        let mut settlements = Vec::<JobSettlement>::new(&env);
        for job_id in read_job_ids(&env)?.iter() {
            settlements.push_back(JobSettlement {
                job_id,
                token: read_job_token(&env, job_id)?,
            });
        }
        Ok(settlements)
    }

    pub fn pause(env: Env, admin: Address) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::Paused, &true);
        bump_ttl(&env);
        GovernanceEvent {
            action: symbol_short!("pause"),
            execute_after_ledger: 0,
        }
        .publish(&env);
        Ok(())
    }

    pub fn resume(env: Env, admin: Address) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::Paused, &false);
        bump_ttl(&env);
        GovernanceEvent {
            action: symbol_short!("resume"),
            execute_after_ledger: 0,
        }
        .publish(&env);
        Ok(())
    }

    pub fn propose_upgrade(
        env: Env,
        admin: Address,
        wasm_hash: BytesN<32>,
        execute_after_ledger: u32,
    ) -> Result<UpgradeProposal, Error> {
        require_admin(&env, &admin)?;
        let minimum = env
            .ledger()
            .sequence()
            .checked_add(MIN_UPGRADE_DELAY_LEDGERS)
            .ok_or(Error::Overflow)?;
        if execute_after_ledger < minimum {
            return Err(Error::InvalidUpgradeDelay);
        }
        let proposal = UpgradeProposal {
            wasm_hash,
            proposed_ledger: env.ledger().sequence(),
            execute_after_ledger,
        };
        env.storage()
            .instance()
            .set(&DataKey::PendingUpgrade, &proposal);
        bump_ttl(&env);
        GovernanceEvent {
            action: symbol_short!("propose"),
            execute_after_ledger,
        }
        .publish(&env);
        Ok(proposal)
    }

    pub fn cancel_upgrade(env: Env, admin: Address) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        if !env.storage().instance().has(&DataKey::PendingUpgrade) {
            return Err(Error::UpgradeNotFound);
        }
        env.storage().instance().remove(&DataKey::PendingUpgrade);
        bump_ttl(&env);
        GovernanceEvent {
            action: symbol_short!("cancel"),
            execute_after_ledger: 0,
        }
        .publish(&env);
        Ok(())
    }

    pub fn execute_upgrade(env: Env, admin: Address) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        let proposal: UpgradeProposal = env
            .storage()
            .instance()
            .get(&DataKey::PendingUpgrade)
            .ok_or(Error::UpgradeNotFound)?;
        if env.ledger().sequence() < proposal.execute_after_ledger {
            return Err(Error::UpgradeNotReady);
        }
        env.storage().instance().remove(&DataKey::PendingUpgrade);
        env.deployer()
            .update_current_contract_wasm(proposal.wasm_hash);
        Ok(())
    }

    pub fn stats(env: Env) -> Result<ProtocolStats, Error> {
        let agent_ids = read_agent_ids(&env)?;
        let job_ids = read_job_ids(&env)?;

        Ok(ProtocolStats {
            agent_count: agent_ids.len() as u64,
            job_count: job_ids.len() as u64,
            token: read_token(&env)?,
        })
    }

    pub fn register_agent(
        env: Env,
        owner: Address,
        handle: String,
        name: String,
        endpoint: String,
        category: String,
        price: i128,
    ) -> Result<u64, Error> {
        ensure_initialized(&env)?;
        owner.require_auth();

        if price <= 0 {
            return Err(Error::InvalidAmount);
        }

        let id = next_u64(&env, DataKey::NextAgentId)?;
        let agent = Agent {
            id,
            owner: owner.clone(),
            handle,
            name,
            endpoint,
            category,
            price,
            active: true,
            jobs_completed: 0,
            rating_total: 0,
            rating_count: 0,
            earned: 0,
        };

        env.storage().instance().set(&DataKey::Agent(id), &agent);
        let mut ids = read_agent_ids(&env)?;
        ids.push_back(id);
        env.storage().instance().set(&DataKey::AgentIds, &ids);
        bump_ttl(&env);
        AgentEvent {
            action: symbol_short!("new"),
            agent_id: id,
        }
        .publish(&env);

        Ok(id)
    }

    pub fn update_agent(
        env: Env,
        agent_id: u64,
        owner: Address,
        name: String,
        endpoint: String,
        category: String,
        price: i128,
        active: bool,
    ) -> Result<Agent, Error> {
        ensure_initialized(&env)?;
        owner.require_auth();

        if price <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut agent = read_agent(&env, agent_id)?;
        if agent.owner != owner {
            return Err(Error::Unauthorized);
        }

        agent.name = name;
        agent.endpoint = endpoint;
        agent.category = category;
        agent.price = price;
        agent.active = active;

        env.storage()
            .instance()
            .set(&DataKey::Agent(agent_id), &agent);
        bump_ttl(&env);
        AgentEvent {
            action: symbol_short!("edit"),
            agent_id,
        }
        .publish(&env);

        Ok(agent)
    }

    pub fn create_job(
        env: Env,
        payer: Address,
        agent_id: u64,
        brief_hash: BytesN<32>,
        amount: i128,
        deadline_ledger: u32,
    ) -> Result<u64, Error> {
        ensure_initialized(&env)?;
        payer.require_auth();
        let token_id = read_token(&env)?;
        create_job_for_asset(
            &env,
            payer,
            agent_id,
            brief_hash,
            amount,
            deadline_ledger,
            token_id,
        )
    }

    pub fn create_job_with_asset(
        env: Env,
        payer: Address,
        agent_id: u64,
        brief_hash: BytesN<32>,
        amount: i128,
        deadline_ledger: u32,
        token: Address,
    ) -> Result<u64, Error> {
        ensure_initialized(&env)?;
        payer.require_auth();
        create_job_for_asset(
            &env,
            payer,
            agent_id,
            brief_hash,
            amount,
            deadline_ledger,
            token,
        )
    }

    pub fn create_milestone_job(
        env: Env,
        payer: Address,
        agent_id: u64,
        brief_hash: BytesN<32>,
        inputs: Vec<MilestoneInput>,
    ) -> Result<u64, Error> {
        ensure_initialized(&env)?;
        payer.require_auth();
        let token_id = read_token(&env)?;
        create_milestone_job_for_asset(&env, payer, agent_id, brief_hash, inputs, token_id)
    }

    pub fn create_milestone_job_with_asset(
        env: Env,
        payer: Address,
        agent_id: u64,
        brief_hash: BytesN<32>,
        inputs: Vec<MilestoneInput>,
        token: Address,
    ) -> Result<u64, Error> {
        ensure_initialized(&env)?;
        payer.require_auth();
        create_milestone_job_for_asset(&env, payer, agent_id, brief_hash, inputs, token)
    }

    pub fn deliver_job(
        env: Env,
        agent_owner: Address,
        job_id: u64,
        deliverable_hash: BytesN<32>,
    ) -> Result<Job, Error> {
        ensure_initialized(&env)?;
        agent_owner.require_auth();

        let mut job = read_job(&env, job_id)?;
        ensure_legacy_job(&env, job_id)?;
        if job.agent_owner != agent_owner {
            return Err(Error::Unauthorized);
        }
        if job.status != JobStatus::Funded {
            return Err(Error::InvalidStatus);
        }

        job.deliverable_hash = deliverable_hash;
        job.status = JobStatus::Delivered;
        job.delivered_ledger = env.ledger().sequence();
        env.storage().instance().set(&DataKey::Job(job_id), &job);
        bump_ttl(&env);
        JobEvent {
            action: symbol_short!("done"),
            job_id,
        }
        .publish(&env);

        Ok(job)
    }

    pub fn approve_job(env: Env, payer: Address, job_id: u64, rating: u32) -> Result<Job, Error> {
        ensure_initialized(&env)?;
        payer.require_auth();

        if rating == 0 || rating > 5 {
            return Err(Error::InvalidRating);
        }

        let mut job = read_job(&env, job_id)?;
        ensure_legacy_job(&env, job_id)?;
        if job.payer != payer {
            return Err(Error::Unauthorized);
        }
        if job.status != JobStatus::Delivered {
            return Err(Error::InvalidStatus);
        }

        let token_id = read_job_token(&env, job_id)?;
        let escrow = env.current_contract_address();
        token::Client::new(&env, &token_id).transfer(
            &escrow,
            MuxedAddress::from(&job.agent_owner),
            &job.amount,
        );

        job.status = JobStatus::Released;
        job.rating = rating;
        job.closed_ledger = env.ledger().sequence();
        env.storage().instance().set(&DataKey::Job(job_id), &job);

        let mut agent = read_agent(&env, job.agent_id)?;
        agent.jobs_completed = agent.jobs_completed.checked_add(1).ok_or(Error::Overflow)?;
        agent.rating_total = agent
            .rating_total
            .checked_add(rating)
            .ok_or(Error::Overflow)?;
        agent.rating_count = agent.rating_count.checked_add(1).ok_or(Error::Overflow)?;
        agent.earned = agent
            .earned
            .checked_add(job.amount)
            .ok_or(Error::Overflow)?;
        env.storage()
            .instance()
            .set(&DataKey::Agent(job.agent_id), &agent);

        bump_ttl(&env);
        JobEvent {
            action: symbol_short!("paid"),
            job_id,
        }
        .publish(&env);

        Ok(job)
    }

    pub fn deliver_milestone(
        env: Env,
        agent_owner: Address,
        job_id: u64,
        index: u32,
        deliverable_hash: BytesN<32>,
    ) -> Result<MilestonePlan, Error> {
        ensure_initialized(&env)?;
        agent_owner.require_auth();

        let mut job = read_job(&env, job_id)?;
        if job.agent_owner != agent_owner {
            return Err(Error::Unauthorized);
        }
        if job.status != JobStatus::Funded {
            return Err(Error::InvalidStatus);
        }
        let mut plan = read_milestone_plan(&env, job_id)?;
        if index != plan.current_index {
            return Err(Error::MilestoneOutOfOrder);
        }
        let mut milestone = plan.milestones.get(index).ok_or(Error::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Funded {
            return Err(Error::InvalidStatus);
        }

        milestone.deliverable_hash = deliverable_hash.clone();
        milestone.status = MilestoneStatus::Delivered;
        milestone.delivered_ledger = env.ledger().sequence();
        plan.milestones.set(index, milestone.clone());
        job.deliverable_hash = deliverable_hash;
        job.delivered_ledger = milestone.delivered_ledger;
        env.storage()
            .instance()
            .set(&DataKey::MilestonePlan(job_id), &plan);
        env.storage().instance().set(&DataKey::Job(job_id), &job);
        bump_ttl(&env);
        MilestoneEvent {
            action: symbol_short!("deliver"),
            job_id,
            index,
            amount: milestone.amount,
        }
        .publish(&env);

        Ok(plan)
    }

    pub fn approve_milestone(
        env: Env,
        payer: Address,
        job_id: u64,
        index: u32,
        rating: u32,
    ) -> Result<MilestonePlan, Error> {
        ensure_initialized(&env)?;
        payer.require_auth();

        let mut job = read_job(&env, job_id)?;
        if job.payer != payer {
            return Err(Error::Unauthorized);
        }
        if job.status != JobStatus::Funded {
            return Err(Error::InvalidStatus);
        }
        let mut plan = read_milestone_plan(&env, job_id)?;
        if index != plan.current_index {
            return Err(Error::MilestoneOutOfOrder);
        }
        let mut milestone = plan.milestones.get(index).ok_or(Error::MilestoneNotFound)?;
        if milestone.status != MilestoneStatus::Delivered {
            return Err(Error::InvalidStatus);
        }
        let is_final = index.checked_add(1).ok_or(Error::Overflow)? == plan.milestones.len();
        if (is_final && (rating == 0 || rating > 5)) || (!is_final && rating != 0) {
            return Err(Error::InvalidMilestoneRating);
        }

        let token_id = read_job_token(&env, job_id)?;
        let escrow = env.current_contract_address();
        token::Client::new(&env, &token_id).transfer(
            &escrow,
            MuxedAddress::from(&job.agent_owner),
            &milestone.amount,
        );

        milestone.status = MilestoneStatus::Released;
        milestone.closed_ledger = env.ledger().sequence();
        plan.released_amount = plan
            .released_amount
            .checked_add(milestone.amount)
            .ok_or(Error::Overflow)?;
        plan.current_index = plan.current_index.checked_add(1).ok_or(Error::Overflow)?;
        plan.milestones.set(index, milestone.clone());

        if is_final {
            job.status = JobStatus::Released;
            job.rating = rating;
            job.closed_ledger = milestone.closed_ledger;
            let mut agent = read_agent(&env, job.agent_id)?;
            agent.jobs_completed = agent.jobs_completed.checked_add(1).ok_or(Error::Overflow)?;
            agent.rating_total = agent
                .rating_total
                .checked_add(rating)
                .ok_or(Error::Overflow)?;
            agent.rating_count = agent.rating_count.checked_add(1).ok_or(Error::Overflow)?;
            agent.earned = agent
                .earned
                .checked_add(job.amount)
                .ok_or(Error::Overflow)?;
            env.storage()
                .instance()
                .set(&DataKey::Agent(job.agent_id), &agent);
        }

        env.storage()
            .instance()
            .set(&DataKey::MilestonePlan(job_id), &plan);
        env.storage().instance().set(&DataKey::Job(job_id), &job);
        bump_ttl(&env);
        MilestoneEvent {
            action: symbol_short!("release"),
            job_id,
            index,
            amount: milestone.amount,
        }
        .publish(&env);

        Ok(plan)
    }

    pub fn refund_milestone_job(
        env: Env,
        payer: Address,
        job_id: u64,
    ) -> Result<MilestonePlan, Error> {
        ensure_initialized(&env)?;
        payer.require_auth();

        let mut job = read_job(&env, job_id)?;
        if job.payer != payer {
            return Err(Error::Unauthorized);
        }
        if job.status != JobStatus::Funded {
            return Err(Error::InvalidStatus);
        }
        let mut plan = read_milestone_plan(&env, job_id)?;
        let current = plan
            .milestones
            .get(plan.current_index)
            .ok_or(Error::MilestoneNotFound)?;
        if current.status != MilestoneStatus::Funded {
            return Err(Error::InvalidStatus);
        }
        if env.ledger().sequence() <= current.deadline_ledger {
            return Err(Error::DeadlineNotReached);
        }

        let remainder = job
            .amount
            .checked_sub(plan.released_amount)
            .ok_or(Error::Overflow)?;
        if remainder <= 0 {
            return Err(Error::InvalidAmount);
        }
        let token_id = read_job_token(&env, job_id)?;
        let escrow = env.current_contract_address();
        token::Client::new(&env, &token_id).transfer(
            &escrow,
            MuxedAddress::from(&job.payer),
            &remainder,
        );

        let closed_ledger = env.ledger().sequence();
        let mut cursor = plan.current_index;
        while cursor < plan.milestones.len() {
            let mut milestone = plan
                .milestones
                .get(cursor)
                .ok_or(Error::MilestoneNotFound)?;
            milestone.status = MilestoneStatus::Refunded;
            milestone.closed_ledger = closed_ledger;
            plan.milestones.set(cursor, milestone);
            cursor += 1;
        }
        job.status = JobStatus::Refunded;
        job.closed_ledger = closed_ledger;
        env.storage()
            .instance()
            .set(&DataKey::MilestonePlan(job_id), &plan);
        env.storage().instance().set(&DataKey::Job(job_id), &job);
        bump_ttl(&env);
        MilestoneEvent {
            action: symbol_short!("refund"),
            job_id,
            index: plan.current_index,
            amount: remainder,
        }
        .publish(&env);

        Ok(plan)
    }

    pub fn dispute_job(env: Env, payer: Address, job_id: u64) -> Result<Job, Error> {
        ensure_initialized(&env)?;
        payer.require_auth();

        let mut job = read_job(&env, job_id)?;
        ensure_legacy_job(&env, job_id)?;
        if job.payer != payer {
            return Err(Error::Unauthorized);
        }
        if job.status != JobStatus::Funded && job.status != JobStatus::Delivered {
            return Err(Error::InvalidStatus);
        }

        job.status = JobStatus::Disputed;
        env.storage().instance().set(&DataKey::Job(job_id), &job);
        bump_ttl(&env);
        JobEvent {
            action: symbol_short!("hold"),
            job_id,
        }
        .publish(&env);

        Ok(job)
    }

    pub fn refund_expired(env: Env, payer: Address, job_id: u64) -> Result<Job, Error> {
        ensure_initialized(&env)?;
        payer.require_auth();

        let mut job = read_job(&env, job_id)?;
        ensure_legacy_job(&env, job_id)?;
        if job.payer != payer {
            return Err(Error::Unauthorized);
        }
        if job.status != JobStatus::Funded {
            return Err(Error::InvalidStatus);
        }
        if env.ledger().sequence() <= job.deadline_ledger {
            return Err(Error::DeadlineNotReached);
        }

        let token_id = read_job_token(&env, job_id)?;
        let escrow = env.current_contract_address();
        token::Client::new(&env, &token_id).transfer(
            &escrow,
            MuxedAddress::from(&job.payer),
            &job.amount,
        );

        job.status = JobStatus::Refunded;
        job.closed_ledger = env.ledger().sequence();
        env.storage().instance().set(&DataKey::Job(job_id), &job);
        bump_ttl(&env);
        JobEvent {
            action: symbol_short!("back"),
            job_id,
        }
        .publish(&env);

        Ok(job)
    }

    pub fn resolve_dispute(
        env: Env,
        admin: Address,
        job_id: u64,
        release_to_agent: bool,
    ) -> Result<Job, Error> {
        ensure_initialized(&env)?;
        admin.require_auth();
        if admin != read_admin(&env)? {
            return Err(Error::Unauthorized);
        }

        let mut job = read_job(&env, job_id)?;
        ensure_legacy_job(&env, job_id)?;
        if job.status != JobStatus::Disputed {
            return Err(Error::InvalidStatus);
        }

        let token_id = read_job_token(&env, job_id)?;
        let escrow = env.current_contract_address();
        let destination = if release_to_agent {
            job.agent_owner.clone()
        } else {
            job.payer.clone()
        };

        token::Client::new(&env, &token_id).transfer(
            &escrow,
            MuxedAddress::from(&destination),
            &job.amount,
        );

        job.status = if release_to_agent {
            JobStatus::Released
        } else {
            JobStatus::Refunded
        };
        job.closed_ledger = env.ledger().sequence();
        env.storage().instance().set(&DataKey::Job(job_id), &job);

        if release_to_agent {
            let mut agent = read_agent(&env, job.agent_id)?;
            agent.jobs_completed = agent.jobs_completed.checked_add(1).ok_or(Error::Overflow)?;
            agent.earned = agent
                .earned
                .checked_add(job.amount)
                .ok_or(Error::Overflow)?;
            env.storage()
                .instance()
                .set(&DataKey::Agent(job.agent_id), &agent);
        }

        bump_ttl(&env);
        JobEvent {
            action: symbol_short!("rule"),
            job_id,
        }
        .publish(&env);

        Ok(job)
    }

    pub fn get_agent(env: Env, agent_id: u64) -> Result<Agent, Error> {
        read_agent(&env, agent_id)
    }

    pub fn get_job(env: Env, job_id: u64) -> Result<Job, Error> {
        read_job(&env, job_id)
    }

    pub fn get_milestone_plan(env: Env, job_id: u64) -> Result<MilestonePlan, Error> {
        read_milestone_plan(&env, job_id)
    }

    pub fn list_milestone_plans(env: Env) -> Result<Vec<MilestonePlan>, Error> {
        ensure_initialized(&env)?;
        let ids = read_milestone_job_ids(&env);
        let mut plans = Vec::<MilestonePlan>::new(&env);
        for id in ids.iter() {
            plans.push_back(read_milestone_plan(&env, id)?);
        }
        Ok(plans)
    }

    pub fn list_agents(env: Env) -> Result<Vec<Agent>, Error> {
        let ids = read_agent_ids(&env)?;
        let mut agents = Vec::<Agent>::new(&env);
        for id in ids.iter() {
            agents.push_back(read_agent(&env, id)?);
        }
        Ok(agents)
    }

    pub fn list_agents_page(env: Env, start: u32, limit: u32) -> Result<Vec<Agent>, Error> {
        validate_page(limit)?;
        let ids = read_agent_ids(&env)?;
        let end = core::cmp::min(start.saturating_add(limit), ids.len());
        let mut agents = Vec::<Agent>::new(&env);
        let mut index = start;
        while index < end {
            if let Some(id) = ids.get(index) {
                agents.push_back(read_agent(&env, id)?);
            }
            index += 1;
        }
        Ok(agents)
    }

    pub fn list_jobs(env: Env) -> Result<Vec<Job>, Error> {
        let ids = read_job_ids(&env)?;
        let mut jobs = Vec::<Job>::new(&env);
        for id in ids.iter() {
            jobs.push_back(read_job(&env, id)?);
        }
        Ok(jobs)
    }

    pub fn list_jobs_page(env: Env, start: u32, limit: u32) -> Result<Vec<Job>, Error> {
        validate_page(limit)?;
        let ids = read_job_ids(&env)?;
        let end = core::cmp::min(start.saturating_add(limit), ids.len());
        let mut jobs = Vec::<Job>::new(&env);
        let mut index = start;
        while index < end {
            if let Some(id) = ids.get(index) {
                jobs.push_back(read_job(&env, id)?);
            }
            index += 1;
        }
        Ok(jobs)
    }
}

fn create_job_for_asset(
    env: &Env,
    payer: Address,
    agent_id: u64,
    brief_hash: BytesN<32>,
    amount: i128,
    deadline_ledger: u32,
    token_id: Address,
) -> Result<u64, Error> {
    ensure_funding_active(env)?;
    read_enabled_asset(env, &token_id)?;
    let agent = read_agent(env, agent_id)?;
    if !agent.active {
        return Err(Error::AgentInactive);
    }
    if amount < agent.price || amount <= 0 {
        return Err(Error::InvalidAmount);
    }
    if deadline_ledger <= env.ledger().sequence() {
        return Err(Error::InvalidDeadline);
    }

    let escrow = env.current_contract_address();
    token::Client::new(env, &token_id).transfer(&payer, MuxedAddress::from(&escrow), &amount);
    let id = next_u64(env, DataKey::NextJobId)?;
    let job = Job {
        id,
        agent_id,
        payer,
        agent_owner: agent.owner,
        brief_hash,
        deliverable_hash: BytesN::from_array(env, &[0; 32]),
        amount,
        deadline_ledger,
        status: JobStatus::Funded,
        rating: 0,
        created_ledger: env.ledger().sequence(),
        delivered_ledger: 0,
        closed_ledger: 0,
    };
    env.storage().instance().set(&DataKey::Job(id), &job);
    env.storage()
        .instance()
        .set(&DataKey::JobAsset(id), &token_id);
    let mut ids = read_job_ids(env)?;
    ids.push_back(id);
    env.storage().instance().set(&DataKey::JobIds, &ids);
    bump_ttl(env);
    JobEvent {
        action: symbol_short!("fund"),
        job_id: id,
    }
    .publish(env);
    Ok(id)
}

fn create_milestone_job_for_asset(
    env: &Env,
    payer: Address,
    agent_id: u64,
    brief_hash: BytesN<32>,
    inputs: Vec<MilestoneInput>,
    token_id: Address,
) -> Result<u64, Error> {
    ensure_funding_active(env)?;
    read_enabled_asset(env, &token_id)?;
    let agent = read_agent(env, agent_id)?;
    if !agent.active {
        return Err(Error::AgentInactive);
    }
    if inputs.len() < MIN_MILESTONES || inputs.len() > MAX_MILESTONES {
        return Err(Error::InvalidMilestoneCount);
    }

    let current_ledger = env.ledger().sequence();
    let mut total = 0i128;
    let mut previous_deadline = current_ledger;
    let mut milestones = Vec::<Milestone>::new(env);
    for (index, input) in inputs.iter().enumerate() {
        if input.amount <= 0 || input.deadline_ledger <= previous_deadline {
            return Err(Error::InvalidMilestone);
        }
        total = total.checked_add(input.amount).ok_or(Error::Overflow)?;
        previous_deadline = input.deadline_ledger;
        milestones.push_back(Milestone {
            index: index as u32,
            brief_hash: input.brief_hash,
            deliverable_hash: BytesN::from_array(env, &[0; 32]),
            amount: input.amount,
            deadline_ledger: input.deadline_ledger,
            status: MilestoneStatus::Funded,
            delivered_ledger: 0,
            closed_ledger: 0,
        });
    }
    if total < agent.price {
        return Err(Error::InvalidAmount);
    }

    let escrow = env.current_contract_address();
    token::Client::new(env, &token_id).transfer(&payer, MuxedAddress::from(&escrow), &total);
    let id = next_u64(env, DataKey::NextJobId)?;
    let job = Job {
        id,
        agent_id,
        payer,
        agent_owner: agent.owner,
        brief_hash,
        deliverable_hash: BytesN::from_array(env, &[0; 32]),
        amount: total,
        deadline_ledger: previous_deadline,
        status: JobStatus::Funded,
        rating: 0,
        created_ledger: current_ledger,
        delivered_ledger: 0,
        closed_ledger: 0,
    };
    let plan = MilestonePlan {
        job_id: id,
        current_index: 0,
        released_amount: 0,
        milestones,
    };
    env.storage().instance().set(&DataKey::Job(id), &job);
    env.storage()
        .instance()
        .set(&DataKey::JobAsset(id), &token_id);
    env.storage()
        .instance()
        .set(&DataKey::MilestonePlan(id), &plan);
    let mut job_ids = read_job_ids(env)?;
    job_ids.push_back(id);
    env.storage().instance().set(&DataKey::JobIds, &job_ids);
    let mut milestone_ids = read_milestone_job_ids(env);
    milestone_ids.push_back(id);
    env.storage()
        .instance()
        .set(&DataKey::MilestoneJobIds, &milestone_ids);
    bump_ttl(env);
    JobEvent {
        action: symbol_short!("staged"),
        job_id: id,
    }
    .publish(env);
    Ok(id)
}

fn validate_page(limit: u32) -> Result<(), Error> {
    if limit == 0 || limit > MAX_PAGE_SIZE {
        Err(Error::InvalidLimit)
    } else {
        Ok(())
    }
}

fn ensure_initialized(env: &Env) -> Result<(), Error> {
    if env.storage().instance().has(&DataKey::Admin) {
        Ok(())
    } else {
        Err(Error::NotInitialized)
    }
}

fn read_admin(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)
}

fn read_token(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Token)
        .ok_or(Error::NotInitialized)
}

fn require_admin(env: &Env, admin: &Address) -> Result<(), Error> {
    ensure_initialized(env)?;
    admin.require_auth();
    if *admin != read_admin(env)? {
        Err(Error::Unauthorized)
    } else {
        Ok(())
    }
}

fn read_paused(env: &Env) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false)
}

fn ensure_funding_active(env: &Env) -> Result<(), Error> {
    if read_paused(env) {
        Err(Error::ProtocolPaused)
    } else {
        Ok(())
    }
}

fn read_asset_ids(env: &Env) -> Vec<Address> {
    env.storage()
        .instance()
        .get(&DataKey::AssetIds)
        .unwrap_or(Vec::<Address>::new(env))
}

fn read_asset(env: &Env, token: &Address) -> Result<SettlementAsset, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Asset(token.clone()))
        .ok_or(Error::AssetNotSupported)
}

fn read_enabled_asset(env: &Env, token: &Address) -> Result<SettlementAsset, Error> {
    let asset = read_asset(env, token)?;
    if asset.enabled {
        Ok(asset)
    } else {
        Err(Error::AssetNotSupported)
    }
}

fn read_job_token(env: &Env, job_id: u64) -> Result<Address, Error> {
    Ok(env
        .storage()
        .instance()
        .get(&DataKey::JobAsset(job_id))
        .unwrap_or(read_token(env)?))
}

fn read_agent(env: &Env, id: u64) -> Result<Agent, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Agent(id))
        .ok_or(Error::AgentNotFound)
}

fn read_job(env: &Env, id: u64) -> Result<Job, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Job(id))
        .ok_or(Error::JobNotFound)
}

fn read_milestone_plan(env: &Env, job_id: u64) -> Result<MilestonePlan, Error> {
    env.storage()
        .instance()
        .get(&DataKey::MilestonePlan(job_id))
        .ok_or(Error::MilestoneNotFound)
}

fn ensure_legacy_job(env: &Env, job_id: u64) -> Result<(), Error> {
    if env
        .storage()
        .instance()
        .has(&DataKey::MilestonePlan(job_id))
    {
        Err(Error::MilestoneFlowRequired)
    } else {
        Ok(())
    }
}

fn read_agent_ids(env: &Env) -> Result<Vec<u64>, Error> {
    env.storage()
        .instance()
        .get(&DataKey::AgentIds)
        .ok_or(Error::NotInitialized)
}

fn read_job_ids(env: &Env) -> Result<Vec<u64>, Error> {
    env.storage()
        .instance()
        .get(&DataKey::JobIds)
        .ok_or(Error::NotInitialized)
}

fn read_milestone_job_ids(env: &Env) -> Vec<u64> {
    env.storage()
        .instance()
        .get(&DataKey::MilestoneJobIds)
        .unwrap_or(Vec::<u64>::new(env))
}

fn next_u64(env: &Env, key: DataKey) -> Result<u64, Error> {
    let next: u64 = env
        .storage()
        .instance()
        .get(&key)
        .ok_or(Error::NotInitialized)?;
    let following = next.checked_add(1).ok_or(Error::Overflow)?;
    env.storage().instance().set(&key, &following);
    Ok(next)
}

fn bump_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_BUMP);
}

mod test;
