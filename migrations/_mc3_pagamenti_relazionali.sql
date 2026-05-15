CREATE TABLE external_payers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_name VARCHAR(255) NOT NULL,
  fiscal_code VARCHAR(20) NULL,
  vat_number VARCHAR(20) NULL,
  address TEXT NULL,
  notes TEXT NULL,
  tenant_id VARCHAR(50) NOT NULL DEFAULT '1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_fiscal (fiscal_code),
  INDEX idx_vat (vat_number)
);

CREATE TABLE societies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_name VARCHAR(255) NOT NULL,
  fiscal_code VARCHAR(20) NULL,
  vat_number VARCHAR(20) NULL,
  address TEXT NULL,
  is_welfare_provider BOOLEAN DEFAULT FALSE,
  welfare_formula ENUM('sconto','pacchetto_prepagato','tessera_collettiva','voucher_esterno','mix') NULL,
  voucher_provider VARCHAR(100) NULL,
  billing_frequency ENUM('mensile','trimestrale','annuale','on_demand') NULL,
  active BOOLEAN DEFAULT TRUE,
  tenant_id VARCHAR(50) NOT NULL DEFAULT '1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_welfare (is_welfare_provider)
);

ALTER TABLE payments 
  ADD COLUMN payer_id INT NULL,
  ADD COLUMN payer_type ENUM('member','society','external') NULL,
  ADD COLUMN billing_subject_id INT NULL,
  ADD COLUMN billing_subject_type ENUM('member','society','external') NULL,
  ADD COLUMN document_type ENUM('ricevuta_istituzionale','fattura','booking_only','gift_card') DEFAULT 'ricevuta_istituzionale',
  ADD COLUMN payment_group_id VARCHAR(36) NULL,
  ADD COLUMN gift_card_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN balance_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE payments ADD INDEX idx_payment_group (payment_group_id);
ALTER TABLE payments ADD INDEX idx_payer (payer_id, payer_type);

CREATE TABLE payment_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id INT NOT NULL,
  member_id INT NOT NULL,
  activity_type ENUM('corso','tesseramento','lezione_individuale','workshop','campus','affitto','merchandising','altro') NOT NULL,
  activity_id INT NULL,
  amount_attributed DECIMAL(10,2) NOT NULL,
  notes TEXT NULL,
  tenant_id VARCHAR(50) NOT NULL DEFAULT '1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  INDEX idx_payment (payment_id),
  INDEX idx_member (member_id),
  INDEX idx_tenant (tenant_id)
);
