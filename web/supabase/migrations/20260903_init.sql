-- Orchestra.WebMCP Database Schema & Atomic Microbilling RPC
-- Migration: 20260903_init.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Tracks User & Developer Wallets)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'developer', 'admin')),
  credits_balance NUMERIC(10, 4) DEFAULT 100.0000, -- Starts with 100.00 hackathon credits
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agent Tools Table (Marketplace Catalog)
CREATE TABLE IF NOT EXISTS agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  tool_name TEXT UNIQUE NOT NULL, -- e.g., 'shopify_checkout_fast'
  description TEXT NOT NULL,
  category TEXT DEFAULT 'Utility',
  cost_per_execution NUMERIC(8, 4) DEFAULT 0.1000,
  reliability_score NUMERIC(5, 2) DEFAULT 98.50, -- Computed by synthetic evals engine
  author_name TEXT DEFAULT 'Verified Partner',
  input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  javascript_code TEXT, -- Executable sandbox WebMCP implementation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tool Rentals / Activations Table (Which tools a user has rented)
CREATE TABLE IF NOT EXISTS tool_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES agent_tools(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  hard_cap_credits NUMERIC(8, 2) DEFAULT 10.00, -- Circuit breaker spend limit
  total_spent NUMERIC(10, 4) DEFAULT 0.0000,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tool_id)
);

-- 4. Execution Transactions & Audit Ledger
CREATE TABLE IF NOT EXISTS execution_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  developer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  cost NUMERIC(8, 4) NOT NULL,
  caller_client TEXT DEFAULT 'browser-webmcp', -- 'cursor', 'claude-code', 'browser-webmcp'
  status TEXT DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'INSUFFICIENT_FUNDS', 'BLOCKED', 'ERROR')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Safe Atomic Micro-Billing Algorithm (RPC)
CREATE OR REPLACE FUNCTION execute_micro_billing(
  buyer_id UUID,
  developer_id UUID,
  amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
  current_balance NUMERIC;
  new_balance NUMERIC;
BEGIN
  -- Check buyer balance with row lock
  SELECT credits_balance INTO current_balance
  FROM profiles
  WHERE id = buyer_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found for buyer ID: %', buyer_id;
  END IF;

  -- Circuit breaker validation
  IF current_balance < amount THEN
    RAISE EXCEPTION 'Orchestra Marketplace Error: Wallet depleted (%.4f CR available, %.4f CR required). Execution restricted.', current_balance, amount;
  END IF;

  -- Deduct ledger balance from renting user
  UPDATE profiles 
  SET credits_balance = credits_balance - amount,
      updated_at = NOW()
  WHERE id = buyer_id
  RETURNING credits_balance INTO new_balance;

  -- Award capital credits to tool creator (if specified and different)
  IF developer_id IS NOT NULL AND developer_id <> buyer_id THEN
    UPDATE profiles 
    SET credits_balance = credits_balance + amount,
        updated_at = NOW()
    WHERE id = developer_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', current_balance,
    'new_balance', new_balance,
    'deducted', amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
