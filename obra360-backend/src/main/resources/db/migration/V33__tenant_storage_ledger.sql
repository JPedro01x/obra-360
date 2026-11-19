-- No historical files are attributed to a tenant by this migration.
CREATE TABLE storage_usage (
 tenant_id BIGINT PRIMARY KEY,
 used_bytes BIGINT NOT NULL CHECK (used_bytes >= 0),
 limit_bytes BIGINT CHECK (limit_bytes >= 0)
);
CREATE TABLE storage_ledger (
 file_key VARCHAR(64) PRIMARY KEY,
 tenant_id BIGINT NOT NULL,
 size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0)
);
CREATE INDEX ix_storage_ledger_tenant ON storage_ledger(tenant_id);

