-- TT Judgments Intel — MySQL schema
-- Knowledge base built from OSINT extraction of Trinidad & Tobago court judgments.
-- One row per case in `cases`; child tables hold the extracted entities.
-- `people` is a flattened, indexed person index for fast name search.

CREATE TABLE IF NOT EXISTS cases (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(80)   NOT NULL,
  batch         INT           NOT NULL DEFAULT 2,
  title         VARCHAR(400)  NOT NULL,
  case_date     VARCHAR(20)            DEFAULT '',
  citation      VARCHAR(200)           DEFAULT '',
  court         VARCHAR(200)           DEFAULT '',
  court_type    VARCHAR(40)            DEFAULT '',   -- 'High Court' | 'Court of Appeal' | 'Other'
  judges        TEXT,
  claimants     TEXT,
  defendants    TEXT,
  outcome       TEXT,
  osint_value   VARCHAR(10)            DEFAULT 'low',
  osint_notes   TEXT,
  related_litigation TEXT,
  url           VARCHAR(500)           DEFAULT '',
  fetch_failed  TINYINT(1)             DEFAULT 0,
  UNIQUE KEY uq_slug (slug),
  INDEX idx_value (osint_value),
  INDEX idx_court_type (court_type),
  INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flattened person index (claimants, defendants, named individuals, directors/officers)
CREATE TABLE IF NOT EXISTS people (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  case_id     INT NOT NULL,
  name        VARCHAR(255) NOT NULL,
  kind        VARCHAR(20)  NOT NULL DEFAULT 'individual', -- claimant|defendant|individual|director
  role        VARCHAR(400)          DEFAULT '',
  note        TEXT,
  company     VARCHAR(255)          DEFAULT '',           -- company linked to (for directors)
  INDEX idx_name (name),
  INDEX idx_case (case_id),
  CONSTRAINT fk_people_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS companies (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  case_id         INT NOT NULL,
  name            VARCHAR(300) NOT NULL,
  role            VARCHAR(400)          DEFAULT '',
  directors       TEXT,
  ownership_notes TEXT,
  is_bank         TINYINT(1)            DEFAULT 0,
  INDEX idx_cname (name),
  INDEX idx_ccase (case_id),
  CONSTRAINT fk_companies_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS financials (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  case_id     INT NOT NULL,
  amount      VARCHAR(60)  DEFAULT '',
  currency    VARCHAR(10)  DEFAULT '',
  what_it_is  VARCHAR(500) DEFAULT '',
  INDEX idx_fcase (case_id),
  CONSTRAINT fk_fin_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS properties (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  case_id     INT NOT NULL,
  description VARCHAR(700) DEFAULT '',
  lease_terms VARCHAR(700) DEFAULT '',
  rent        VARCHAR(200) DEFAULT '',
  landlord    VARCHAR(300) DEFAULT '',
  tenant      VARCHAR(300) DEFAULT '',
  outcome     VARCHAR(700) DEFAULT '',
  INDEX idx_pcase (case_id),
  CONSTRAINT fk_prop_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
