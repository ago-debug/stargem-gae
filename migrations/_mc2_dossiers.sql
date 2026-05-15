CREATE TABLE dossiers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  member_id INT NOT NULL,
  dossier_type ENUM('nuovo_iscritto','rinnovo','trial_to_member','modifica_dati','iscrizione_corso','acquisto_carnet','acquisto_eventi','altro') NOT NULL,
  status ENUM('bozza','in_compilazione','in_pagamento','completato','annullato') NOT NULL DEFAULT 'bozza',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  payment_group_id VARCHAR(36) NULL,  -- ref MC3
  tenant_id VARCHAR(50) NOT NULL DEFAULT '1',  -- Regola 13
  extra_data JSON NULL,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  INDEX idx_member_status (member_id, status),
  INDEX idx_status (status),
  INDEX idx_tenant (tenant_id)
);

CREATE TABLE dossier_steps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dossier_id INT NOT NULL,
  step_name ENUM('anagrafica','tutori','certificato_medico','documenti','pagamento','tesseramento','iscrizione_attivita') NOT NULL,
  status ENUM('pending','completed','blocked','skipped') NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP NULL,
  blocking_reason TEXT NULL,
  completed_by INT NULL,
  tenant_id VARCHAR(50) NOT NULL DEFAULT '1',
  FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE,
  INDEX idx_dossier_status (dossier_id, status)
);

CREATE TABLE dossier_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dossier_id INT NOT NULL,
  action ENUM('created','step_completed','step_blocked','status_changed','annullato','completed') NOT NULL,
  performed_by INT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSON NULL,
  tenant_id VARCHAR(50) NOT NULL DEFAULT '1',
  FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE,
  INDEX idx_dossier_date (dossier_id, performed_at)
);
