CREATE DATABASE IF NOT EXISTS cv_studio
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cv_studio;

-- USER
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255),
    last_change DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- PASSWORD RESETS
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_resets_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    INDEX idx_password_resets_user_id (user_id),
    INDEX idx_password_resets_expires_at (expires_at)
);


-- CVS
CREATE TABLE cvs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    position VARCHAR(150),
    summary TEXT,
    email VARCHAR(255),
    phone VARCHAR(30),
    address VARCHAR(255),
    primary_color VARCHAR(20) DEFAULT '#2F7867',
    template VARCHAR(50) DEFAULT 'classic',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cvs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    INDEX idx_cvs_user_id (user_id)
);


-- CV SKILLS
CREATE TABLE cv_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cv_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    CONSTRAINT fk_cv_skills_cv
        FOREIGN KEY (cv_id)
        REFERENCES cvs(id)
        ON DELETE CASCADE,
    INDEX idx_cv_skills_cv_id (cv_id)
);


-- CV EXPERIENCES
CREATE TABLE cv_experiences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cv_id INT NOT NULL,
    position VARCHAR(150),
    start_date DATE,
    end_date DATE,
    company VARCHAR(200),
    description TEXT,
    CONSTRAINT fk_cv_experiences_cv
        FOREIGN KEY (cv_id)
        REFERENCES cvs(id)
        ON DELETE CASCADE,
    INDEX idx_cv_experiences_cv_id (cv_id),
    INDEX idx_cv_experiences_start_date (start_date)
);


-- CV EDUCATIONS
CREATE TABLE cv_educations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cv_id INT NOT NULL,
    degree VARCHAR(200),
    start_date DATE,
    end_date DATE,
    school VARCHAR(200),
    CONSTRAINT fk_cv_educations_cv
        FOREIGN KEY (cv_id)
        REFERENCES cvs(id)
        ON DELETE CASCADE,
    INDEX idx_cv_educations_cv_id (cv_id),
    INDEX idx_cv_educations_start_date (start_date)
);


-- INTERVIEWS
CREATE TABLE interviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    cv_id INT NULL,
    company VARCHAR(200) NOT NULL,
    position VARCHAR(150),
    interview_date DATE NOT NULL,
    start_time TIME NOT NULL,
    interview_type ENUM('online', 'offline')
        NOT NULL DEFAULT 'online',
    interview_link VARCHAR(500),
    location VARCHAR(500),
    note TEXT,
    reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_minutes INT NOT NULL DEFAULT 60,
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_sent_at DATETIME NULL,
    status ENUM(
        'scheduled',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_interviews_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_interviews_cv
        FOREIGN KEY (cv_id)
        REFERENCES cvs(id)
        ON DELETE SET NULL,
    INDEX idx_interviews_user_id (user_id),
    INDEX idx_interviews_cv_id (cv_id),
    INDEX idx_interviews_datetime (
        interview_date,
        start_time
    ),
    INDEX idx_interviews_reminder (
        reminder_enabled,
        reminder_sent,
        status
    )
);