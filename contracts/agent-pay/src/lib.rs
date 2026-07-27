#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contractmeta, contracttype, symbol_short,
    token, Address, BytesN, Env, MuxedAddress, String, Symbol, Vec,
};

const INSTANCE_TTL_THRESHOLD: u32 = 10_000;
const INSTANCE_TTL_BUMP: u32 = 518_400;
const MAX_PAGE_SIZE: u32 = 50;

contractmeta!(key = "name", val = "AgentRail Escrow");
contractmeta!(key = "version", val = "0.2.0");

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
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProtocolStats {
    pub agent_count: u64,
    pub job_count: u64,
    pub token: Address,
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
        bump_ttl(&env);
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        read_admin(&env)
    }

    pub fn token(env: Env) -> Result<Address, Error> {
        read_token(&env)
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

        let agent = read_agent(&env, agent_id)?;
        if !agent.active {
            return Err(Error::AgentInactive);
        }
        if amount < agent.price || amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if deadline_ledger <= env.ledger().sequence() {
            return Err(Error::InvalidDeadline);
        }

        let token_id = read_token(&env)?;
        let escrow = env.current_contract_address();
        token::Client::new(&env, &token_id).transfer(&payer, &MuxedAddress::from(&escrow), &amount);

        let id = next_u64(&env, DataKey::NextJobId)?;
        let job = Job {
            id,
            agent_id,
            payer,
            agent_owner: agent.owner,
            brief_hash,
            deliverable_hash: BytesN::from_array(&env, &[0; 32]),
            amount,
            deadline_ledger,
            status: JobStatus::Funded,
            rating: 0,
            created_ledger: env.ledger().sequence(),
            delivered_ledger: 0,
            closed_ledger: 0,
        };

        env.storage().instance().set(&DataKey::Job(id), &job);
        let mut ids = read_job_ids(&env)?;
        ids.push_back(id);
        env.storage().instance().set(&DataKey::JobIds, &ids);
        bump_ttl(&env);
        JobEvent {
            action: symbol_short!("fund"),
            job_id: id,
        }
        .publish(&env);

        Ok(id)
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
        if job.payer != payer {
            return Err(Error::Unauthorized);
        }
        if job.status != JobStatus::Delivered {
            return Err(Error::InvalidStatus);
        }

        let token_id = read_token(&env)?;
        let escrow = env.current_contract_address();
        token::Client::new(&env, &token_id).transfer(
            &escrow,
            &MuxedAddress::from(&job.agent_owner),
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

    pub fn dispute_job(env: Env, payer: Address, job_id: u64) -> Result<Job, Error> {
        ensure_initialized(&env)?;
        payer.require_auth();

        let mut job = read_job(&env, job_id)?;
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
        if job.payer != payer {
            return Err(Error::Unauthorized);
        }
        if job.status != JobStatus::Funded {
            return Err(Error::InvalidStatus);
        }
        if env.ledger().sequence() <= job.deadline_ledger {
            return Err(Error::DeadlineNotReached);
        }

        let token_id = read_token(&env)?;
        let escrow = env.current_contract_address();
        token::Client::new(&env, &token_id).transfer(
            &escrow,
            &MuxedAddress::from(&job.payer),
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
        if job.status != JobStatus::Disputed {
            return Err(Error::InvalidStatus);
        }

        let token_id = read_token(&env)?;
        let escrow = env.current_contract_address();
        let destination = if release_to_agent {
            job.agent_owner.clone()
        } else {
            job.payer.clone()
        };

        token::Client::new(&env, &token_id).transfer(
            &escrow,
            &MuxedAddress::from(&destination),
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
