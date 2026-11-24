# Sentinel Expense & Reimbursement Cloud

> **An enterprise-grade, full-stack financial reimbursement platform engineered with data-scoped authorization depth, atomic concurrency controls, and a modern financial SaaS experience.**

[![Spring Boot 3](https://img.shields.io/badge/Spring%20Boot-3.4-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com)
[![JWT Auth](https://img.shields.io/badge/Security-JWT%20%2B%20HttpOnly%20Rotation-black?logo=jsonwebtokens)](https://jwt.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

* **Live Demo:** [https://expense-frontend.netlify.app](https://expense-frontend.netlify.app)
* *Note: Backend is hosted on Render's free tier. The first request may take ~30–45 seconds if waking from cold standby.*

---

## 🎯 Executive Summary & Purpose

Most portfolio expense trackers are basic CRUD clones that protect endpoints with simple role checks:
```java
if (user.getRole() == Role.ADMIN) // Insufficient: checks WHO you are, not WHAT you own
```
This leaves applications vulnerable to **Insecure Direct Object References (IDOR)**: a manager could approve claims from employees in unrelated departments, or two finance officers could process the same claim simultaneously.

**Sentinel Expense** was built to solve these real-world enterprise engineering challenges:
1. **Data-Scoped Authorization:** A user having the `MANAGER` role is not enough. The backend independently verifies that the claim owner directly reports to that specific manager on every request.
2. **Race-Condition-Proof Concurrency:** Prevents double-take race conditions in the finance queue using **atomic conditional SQL queries** combined with **JPA optimistic locking (`@Version`)**.
3. **Zero-Knowledge Receipt Streaming:** Sensitive financial receipts are never exposed through public static URLs or public S3 buckets; they are streamed as authenticated binary blobs via Spring Security.
4. **Interactive HR / Recruiter Fast-Track:** Features a built-in 1-click persona switcher (Employee, Manager, Finance Admin) so non-technical evaluators can experience the full multi-tier workflow in under 30 seconds.

---

## ⚡ Interactive Recruiter / Reviewer Fast-Track

To experience the multi-tier authorization hierarchy without typing passwords or managing accounts, use the **1-Click Persona Switcher** directly in the UI:

| Persona | Name | Role | Core Capability & Workflow |
| :--- | :--- | :--- | :--- |
| **👤 Employee** | Alex Rivera | `EMPLOYEE` | Creates drafts, attaches receipts, submits claims to direct manager. |
| **👔 Manager** | Sarah Chen | `MANAGER` | Data-scoped access: only inspects and decides direct reporting team claims. |
| **💳 Finance Admin** | Marcus Vance | `FINANCE_ADMIN` | Takes claims from shared queue via atomic lock, audits receipts, reimburses funds. |

---

## 🏗️ Architecture & Data Flow

```text
┌──────────────────────┐        HTTPS / JSON       ┌────────────────────────┐        JDBC (HikariCP)     ┌──────────────────────┐
│                      │ ────────────────────────► │                        │ ─────────────────────────► │                      │
│   React 19 SPA       │                           │  Spring Boot 3 API     │                            │     MySQL DB         │
│  (Tailwind CSS v4)   │ ◄──────────────────────── │   (Modular Monolith)   │ ◄───────────────────────── │     (Aiven Cloud)    │
│                      │      JWT In-Memory +      └────────────────────────┘                            └──────────────────────┘
└──────────────────────┘    HttpOnly Refresh Cookie            │
                                                               ▼
                                                    Private Receipt Vault
                                                 (Streamed Authenticated Blobs)
```

---

## 🔐 Core Engineering Pillars

### 1. Data-Scoped Authorization Depth (IDOR Elimination)
Every write and read endpoint enforces two distinct security barriers:
1. **Method Security (RBAC):** `@PreAuthorize("hasRole('MANAGER')")` checks user functional permissions.
2. **Data-Scoping Barrier:** The service layer queries the organizational tree to guarantee entity ownership:

```java
// ManagerClaimService.java: Prevents cross-department unauthorized approvals
private ExpenseClaim getClaimIfDirectReport(User manager, Long claimId) {
    ExpenseClaim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

    User employee = claim.getEmployee();

    if (employee.getManager() == null || !employee.getManager().getId().equals(manager.getId())) {
        throw new AccessDeniedException("403 Forbidden: You are not authorized to manage this claim.");
    }
    return claim;
}
```

### 2. Concurrency Safety: Atomic Conditional SQL & Optimistic Locking
When two finance administrators attempt to grab the same unassigned claim from the shared queue at the exact same millisecond:

```java
// ExpenseClaimRepository.java: Executed directly at the database engine level
@Modifying
@Query("""
    UPDATE ExpenseClaim c 
    SET c.status = 'FINANCE_PROCESSING', 
        c.assignedFinance = :financeAdmin 
    WHERE c.id = :claimId 
      AND c.status = 'FINANCE_REVIEW' 
      AND c.assignedFinance IS NULL
""")
int takeClaimAtomic(@Param("claimId") Long claimId, @Param("financeAdmin") User financeAdmin);
```

* **Winner:** Database returns row count = `1`. Claim transitions to `FINANCE_PROCESSING`.
* **Loser:** Database returns row count = `0`. Service layer catches this and returns a clean **HTTP 409 Conflict**.
* Subsequent updates are guarded by **JPA `@Version` Optimistic Locking** to stop stale edits.

### 3. Private Binary Document Vault
Financial receipts contain sensitive banking and tax information:
* Filenames are discarded and replaced with randomized UUIDs to defeat directory traversal attacks (`../`).
* MIME types are strictly verified (`image/jpeg`, `image/png`, `application/pdf`).
* Documents are streamed via authenticated endpoints with `inline` `Content-Disposition`, rendered ephemerally in React via `URL.createObjectURL`, and revoked upon modal close.

### 4. Deterministic State Machine Engine
Controllers never update statuses directly. The business domain validates transitions:

```text
               ┌───────────────────────┐
               │         DRAFT         │ ◄──────────────────┐
               └───────────────────────┘                    │
                           │ submit                         │ edit & resubmit
                           ▼                                │
                 MANAGER_REVIEW ─────────(reject)──────► REJECTED
                           │ approve                        ▲
                           ▼                                │
                 FINANCE_REVIEW ─────────(reject)───────────┤
                           │ take (atomic SQL)              │
                           ▼                                │
               FINANCE_PROCESSING ───────(reject)───────────┘
                           │ approve
                           ▼
                       APPROVED
                           │ reimburse
                           ▼
                      REIMBURSED
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 17, Spring Boot 3.4, Spring Security, Spring Data JPA / Hibernate, HikariCP |
| **Frontend** | React 19, Tailwind CSS v4, Lucide Icons, Axios, Vite |
| **Database** | MySQL 8.0, Aiven Cloud Managed DB |
| **Security** | JJWT (HMAC-SHA256), BCrypt, SHA-256 Refresh Hashing, HttpOnly SameSite=None Cookies |
| **Testing** | JUnit 5, Mockito, AssertJ, RestAssured, Spring Boot Test, H2 In-Memory |
| **DevOps** | Multi-stage Docker, Alpine JRE, Non-root user containerization |

---

## 📡 API Specification

### Authentication
* `POST /auth/register` — Public registration (defaults to `EMPLOYEE`).
* `POST /auth/login` — Issues access token in-memory and HttpOnly refresh cookie.
* `POST /auth/refresh` — Rotates refresh token and issues new access token.
* `POST /auth/logout` — Revokes stored token hash and clears cookie.

### Employee Self-Service
* `POST /claims` — Create a draft expense claim.
* `PUT /claims/{id}` — Edit an existing claim (only valid in `DRAFT` or `REJECTED`).
* `POST /claims/{id}/submit` — Submit claim for manager/finance auto-routing.
* `GET /claims/mine` — Retrieve personal claims ledger.
* `POST /claims/{id}/receipt` — Upload multipart invoice/receipt.
* `GET /claims/{id}/receipt` — Securely stream binary receipt.

### Manager Approvals
* `GET /claims/team` — List pending claims from direct reports only.
* `PUT /claims/{id}/manager-approve` — Approve claim and route to Finance.
* `PUT /claims/{id}/manager-reject` — Reject claim with mandatory policy notes.

### Finance Treasury & Governance
* `GET /claims/queue?status=...` — Paginated FIFO audit queue.
* `POST /claims/{id}/take` — Atomically claim an item from the shared queue.
* `PUT /claims/{id}/finance-approve` — Final audit approval.
* `PUT /claims/{id}/finance-reject` — Final audit rejection.
* `PUT /claims/{id}/reimburse` — Mark claim as settled and disburse funds.
* `PUT /admin/users/{id}/manager` — Reassign direct reporting tree.
* `PUT /admin/users/{id}/role` — Reassign system authorization roles.

---

## 🚀 Local Development Setup

### 1. Prerequisites
* **Java 17+**
* **Node.js 18+** & **npm**
* **MySQL 8.0**

### 2. Backend Configuration
```bash
cd backend
```
Create a database in MySQL:
```sql
CREATE DATABASE expense_system;
```
Configure `src/main/resources/application.properties` (or set environment variables):
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/expense_system
spring.datasource.username=your_user
spring.datasource.password=your_password
jwt.secret=your_super_secret_signing_key_at_least_256_bits_long
app.storage.receipt-dir=./receipts
```
Run the Spring Boot application:
```bash
./mvnw spring-boot:run
```
Backend starts on `http://localhost:8080`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend starts on `http://localhost:5173`.

---

## 🧪 Testing Suite

Run all unit, integration, and security tests:
```bash
cd backend
./mvnw test
```
* **Concurrency Unit Tests:** Simulates zero-row affected return from `takeClaimAtomic` to verify conflict handling.
* **Security & Authorization Tests:** Verifies that horizontal privilege escalation (cross-manager access) returns HTTP 403.
* **Receipt Vault Security Tests:** Asserts non-authorized users cannot download receipt resources.

---

## 👤 Author & Contact

**Deevanooru Manikantan**
* **GitHub:** [@Manikantan-96](https://github.com/Manikantan-96)
* **LinkedIn:** [linkedin.com/in/manikantan-deevanooru](https://linkedin.com/in/manikantan-deevanooru)
