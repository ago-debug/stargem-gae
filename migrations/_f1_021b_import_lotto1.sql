ALTER TABLE members
ADD COLUMN legacy_athena_id VARCHAR(50) NULL,
ADD COLUMN legacy_master_id VARCHAR(50) NULL,
ADD COLUMN tutor1_first_name VARCHAR(100) NULL,
ADD COLUMN tutor1_last_name VARCHAR(100) NULL,
ADD COLUMN tutor1_fiscal_code VARCHAR(20) NULL,
ADD COLUMN imported_lotto VARCHAR(50) NULL,
ADD COLUMN imported_source_row_index INT NULL,
ADD COLUMN imported_by VARCHAR(50) NULL,
ADD COLUMN imported_at TIMESTAMP NULL,
ADD COLUMN data_quality_flag JSON NULL,
ADD COLUMN extra_data JSON NULL;

CREATE TABLE import_batches (
  batch_id VARCHAR(36) PRIMARY KEY,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_chunks INT NOT NULL,
  completed_chunks INT DEFAULT 0,
  records_imported INT DEFAULT 0,
  records_skipped INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  errors_log JSON NULL
);
