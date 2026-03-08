-- CreateTable
CREATE TABLE "account_balance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "account_id" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL NOT NULL DEFAULT 0.0,
    "frozen_balance" DECIMAL NOT NULL DEFAULT 0.0,
    "total_balance" DECIMAL NOT NULL DEFAULT 0.0,
    "min_balance" DECIMAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "allow_negative" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transaction_journal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transaction_no" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "request_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "before_balance" DECIMAL NOT NULL,
    "after_balance" DECIMAL NOT NULL,
    "opposite_account" TEXT,
    "opposite_account_type" TEXT,
    "business_ref_no" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error_code" TEXT,
    "error_message" TEXT,
    "lock_type" TEXT NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "conflict_detected" BOOLEAN NOT NULL DEFAULT false,
    "transaction_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "accounting_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "client_info" JSONB,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciled_at" DATETIME
);

-- CreateTable
CREATE TABLE "balance_snapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "account_id" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "before_balance" DECIMAL NOT NULL,
    "after_balance" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "accounting_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB
);

-- CreateTable
CREATE TABLE "idempotency_record" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idempotency_key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "response_data" JSONB,
    "error_info" JSONB,
    "metadata" JSONB,
    "transaction_no" TEXT,
    "expired_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "idx_account_balance_account" ON "account_balance"("account_id", "account_type", "currency");

-- CreateIndex
CREATE INDEX "idx_account_balance_status" ON "account_balance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "account_balance_account_id_account_type_currency_key" ON "account_balance"("account_id", "account_type", "currency");

-- CreateIndex
CREATE INDEX "idx_journal_account_date" ON "transaction_journal"("account_id", "accounting_date", "created_at");

-- CreateIndex
CREATE INDEX "idx_journal_account_type_currency_time" ON "transaction_journal"("account_id", "account_type", "currency", "transaction_time");

-- CreateIndex
CREATE INDEX "idx_journal_idempotency" ON "transaction_journal"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_journal_status" ON "transaction_journal"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_journal_conflict" ON "transaction_journal"("conflict_detected", "created_at");

-- CreateIndex
CREATE INDEX "idx_journal_reconciliation" ON "transaction_journal"("reconciled", "accounting_date");

-- CreateIndex
CREATE INDEX "idx_journal_business_ref" ON "transaction_journal"("business_ref_no");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_journal_transaction_no_key" ON "transaction_journal"("transaction_no");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_journal_account_id_account_type_currency_idempotency_key_key" ON "transaction_journal"("account_id", "account_type", "currency", "idempotency_key");

-- CreateIndex
CREATE INDEX "idx_snapshot_account_date" ON "balance_snapshot"("account_id", "accounting_date", "created_at");

-- CreateIndex
CREATE INDEX "idx_snapshot_account_type_currency_date" ON "balance_snapshot"("account_id", "account_type", "currency", "accounting_date");

-- CreateIndex
CREATE INDEX "idx_snapshot_request" ON "balance_snapshot"("request_id");

-- CreateIndex
CREATE INDEX "idx_snapshot_status" ON "balance_snapshot"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "balance_snapshot_account_id_account_type_currency_request_id_key" ON "balance_snapshot"("account_id", "account_type", "currency", "request_id");

-- CreateIndex
CREATE INDEX "idx_idempotency_expired" ON "idempotency_record"("expired_at");

-- CreateIndex
CREATE INDEX "idx_idempotency_cleanup" ON "idempotency_record"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_record_idempotency_key_request_hash_key" ON "idempotency_record"("idempotency_key", "request_hash");
