# Expense Claim & Approval System

A production-shaped full-stack expense reimbursement platform — React frontend, Spring Boot backend, and MySQL database — built to demonstrate **real authorization depth** and **concurrency safety**, not a CRUD tutorial clone.

**Live Demo:** https://expense-frontend.netlify.app
*Backend runs on Render's free tier — it spins down when idle, so the first request may take ~60 seconds to wake up.*

---

## 🎯 Why This Project Exists

Most portfolio expense, ticket, and task-tracker projects check:

```java
if (user.role == "ADMIN")
```

and stop there.

That's a role check, not authorization.

This project's core thesis is **data-scoped authorization**.

A user having the `MANAGER` role is not enough to approve a claim. The backend independently verifies that the claim's owner reports **directly to that specific manager** on every request, regardless of what the frontend displays or hides.

```java
// The check that matters more than the role annotation above it
if (employee.getManager() == null
        || !employee.getManager().getId().equals(manager.getId())) {
    throw new RuntimeException(
        "403 Forbidden: You are not authorized to manage this claim."
    );
}
```

The second major focus is **real concurrency handling**.

Two Finance Admins can look at the same shared queue simultaneously. The system guarantees that only one of them can take the same claim by using an **atomic conditional database update**, backed by JPA optimistic locking as an additional safety mechanism.

---

## 📂 Project Structure

```text
expense-approval-system/
├── backend/          Spring Boot 3 REST API (Java 17)
├── frontend/         React + Tailwind CSS SPA
└── README.md         Project documentation
```

---

## 🏗️ Architecture

```text
┌─────────────┐      HTTPS       ┌──────────────────┐      JDBC      ┌─────────────┐
│   React     │ ───────────────► │   Spring Boot    │ ─────────────► │   MySQL     │
│  (Netlify)  │ ◄─────────────── │    (Render)      │ ◄───────────── │  (Aiven)    │
└─────────────┘   JSON / JWT     └──────────────────┘                 └─────────────┘
                                           │
                                           ▼
                                   Private file storage
                                      (receipts)
```

This project intentionally uses a **modular monolith**, not microservices.

A single business domain does not need the operational overhead of API gateways, service discovery, distributed tracing, and inter-service communication.

For a distributed-systems-focused project, see [Sentinel – Distributed Saga Orchestrator Microservices](https://github.com/Manikantan-96/Sentinel-Distributed-Saga-Orchestrator-Microservices).

---

## 🔐 Roles & Permission Model

| Action                          | Employee | Manager           | Finance Admin     |
| ------------------------------- | -------- | ----------------- | ----------------- |
| Submit own claim                | ✅        | ✅                 | —                 |
| View own claims                 | ✅        | ✅                 | ✅ (all)           |
| View direct reports' claims     | ❌        | ✅ (own team only) | ✅ (all)           |
| Approve/reject a claim          | ❌        | ✅ (own team only) | ✅ (assigned only) |
| Take a claim from finance queue | ❌        | ❌                 | ✅                 |
| Mark a claim reimbursed         | ❌        | ❌                 | ✅                 |
| Assign managers / change roles  | ❌        | ❌                 | ✅                 |

Every write endpoint is protected by two layers:

1. **Role check** using `@PreAuthorize`
2. **Data-scoping check** in the service layer

Neither layer alone is sufficient.

A user may have the correct role but still be unauthorized to access or modify a particular resource.

---

## 🔄 State Machine

```text
DRAFT
  │
  │ submit
  ▼
MANAGER_REVIEW ──(approve)──► FINANCE_REVIEW ──(take)──► FINANCE_PROCESSING
      │                            │                         │
    reject                       reject                   approve
      │                            │                         │
      └──────────────┐             └──────────┐              ▼
                     ▼                        ▼          APPROVED
                  REJECTED ◄──────────────────┘              │
                     │                                       │ reimburse
                     │ edit + resubmit                       ▼
                     │                                    REIMBURSED
                     │
                     ├──► MANAGER_REVIEW
                     │    (manager exists)
                     │
                     └──► FINANCE_REVIEW
                          (no manager)
```

State transitions are validated explicitly in the service layer. Controllers do not directly set claim statuses.

### Submission routing

When a claim is submitted:

* If the employee has a manager, it enters `MANAGER_REVIEW`.
* If the employee has no manager, it goes directly to `FINANCE_REVIEW`.
* A Manager submitting their own claim can also bypass manager review when there is no manager above them.

When a claim is rejected, it enters `REJECTED`.

The employee can edit the rejected claim and resubmit it. The claim then returns to:

* `MANAGER_REVIEW` when a manager exists
* `FINANCE_REVIEW` when no manager exists

---

## ⚡ Concurrency & Race Condition Handling

### The problem

Two Finance Admins may load the same finance queue and attempt to take claim `#101` at exactly the same time.

A normal read-then-write approach could allow both requests to believe that they successfully acquired the claim.

### The solution

The repository performs an **atomic, conditionally guarded update**:

```java
@Modifying
@Query("""
    UPDATE ExpenseClaim c
    SET c.status = 'FINANCE_PROCESSING',
        c.assignedFinance = :financeAdmin
    WHERE c.id = :claimId
      AND c.status = 'FINANCE_REVIEW'
      AND c.assignedFinance IS NULL
    """)
int takeClaimAtomic(
    @Param("claimId") Long claimId,
    @Param("financeAdmin") User financeAdmin
);
```

Only one concurrent request can satisfy the conditions and update the row.

The successful request gets one affected row.

The losing request gets `0` rows affected, which is mapped to a clean **409 Conflict** response.

The entity also uses JPA `@Version` optimistic locking for subsequent updates, providing an additional safeguard against stale concurrent writes.

---

## 💻 Frontend Highlights

### JWT Handling

* Access token is kept **in memory only**
* Refresh token is stored in an **HttpOnly cookie**
* Axios response interceptor detects `401` responses
* The frontend silently calls the refresh endpoint
* The original request is retried with the new access token

This prevents unnecessary re-login when the short-lived access token expires.

### Receipt Viewing

Receipts are private financial documents.

The frontend retrieves them as an authenticated Blob:

```javascript
responseType: "blob"
```

and creates a temporary object URL using:

```javascript
URL.createObjectURL(...)
```

Receipts are therefore not exposed through public image URLs.

### Role-Aware UI

The frontend conditionally renders actions such as:

* Approve
* Reject
* Take claim
* Reimburse

based on the user's role and the claim's current state.

However, the frontend is **not the security boundary**. The backend independently verifies authorization for every operation.

---

## 🛠️ Tech Stack

### Backend

* Java 17
* Spring Boot 
* Spring Security
* Spring Data JPA / Hibernate
* JWT authentication
* MySQL
* BCrypt
* Bean Validation

### Frontend

* React
* Tailwind CSS
* React Router
* Axios

### Testing

* JUnit 5
* Mockito
* AssertJ
* Spring Boot Test
* RestAssured

### Deployment

* Netlify — Frontend
* Render — Backend
* Aiven — MySQL

---

## 📡 API Reference

### Authentication

```text
POST /auth/register
    Public registration.
    Always creates an EMPLOYEE account.

POST /auth/login
    Authenticates the user.

POST /auth/refresh
    Rotates the refresh token and returns a new access token.

POST /auth/logout
    Logs out the current session.
```

### Claims

```text
POST   /claims
    Create a draft claim.

PUT    /claims/{id}
    Edit a claim in DRAFT or REJECTED state.

POST   /claims/{id}/submit
    Submit the claim for review.

GET    /claims/mine
    Retrieve the authenticated user's claims.

GET    /claims/{id}
    Retrieve a specific claim.

POST   /claims/{id}/receipt
    Upload a receipt using multipart form data.

GET    /claims/{id}/receipt
    Retrieve a receipt only when the caller is authorized.
```

### Manager

Requires `MANAGER` role and direct-report ownership.

```text
GET  /claims/team
    Retrieve claims belonging to the manager's direct reports.

PUT  /claims/{id}/manager-approve
    Approve a claim.

PUT  /claims/{id}/manager-reject
    Reject a claim.
```

### Finance

Requires `FINANCE_ADMIN` role.

```text
GET  /claims/queue
    Retrieve the finance queue.

POST /claims/{id}/take
    Atomically take a claim from the finance queue.

PUT  /claims/{id}/finance-approve
    Approve a claim assigned to the current Finance Admin.

PUT  /claims/{id}/finance-reject
    Reject a claim.

PUT  /claims/{id}/reimburse
    Mark an approved claim as reimbursed.
```

### Admin

Requires `FINANCE_ADMIN` role.

```text
PUT /admin/users/{id}/manager
    Assign or change a user's manager.

PUT /admin/users/{id}/role
    Change a user's role.
```

---

## 🚀 Running Locally

### Clone the repository

```bash
git clone <this-repo-url>
cd expense-approval-system
```

### Backend

```bash
cd backend
```

Create a MySQL database and configure:

`src/main/resources/application.properties`

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/expense_system
spring.datasource.username=<your-username>
spring.datasource.password=<your-password>

jwt.secret=<long-random-string-at-least-256-bits>

app.storage.receipt-dir=./receipts
```

Then start the backend:

```bash
mvn spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

Set:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Then start the frontend:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

CORS is configured for this development origin.

---

## 🧪 Testing

The project uses a layered testing strategy focused on business rules, authorization, concurrency, and security rather than only measuring line coverage.

### Service Layer — Unit Tests

Mockito-based tests cover:

* Token rotation
* State-machine transitions
* Data-scoped authorization
* Finance assignment rules
* File validation
* Business logic in isolation

### API Layer — Integration Tests

Spring Boot tests exercise real HTTP requests through the application context and verify:

* Authentication
* Authorization
* Controller behavior
* Service logic
* End-to-end request processing

### Security-Specific Tests

Receipt access is specifically tested to ensure that only:

* The claim owner
* The owner's direct manager
* A Finance Admin

can retrieve a receipt.

Unauthorized authenticated users receive `403 Forbidden`.

### Repository Tests

Repository behavior is tested against the actual data-access layer, including the atomic `takeClaimAtomic` operation.

### Run the test suite

```bash
cd backend
mvn test
```

---

## 🚫 Deliberately Out of Scope

The following were considered but intentionally left out because they are lower-priority for the current problem domain:

* WebSocket live queue updates
* Kafka event streaming
* Automatic finance-claim lease expiry

The goal is to avoid adding complexity simply to make the architecture look more advanced.

The current project focuses on doing a smaller set of things correctly:

**authorization, workflow/state management, concurrency safety, secure receipt access, and layered testing.**

---

## 👤 Author

**Deevanooru Manikantan**

[LinkedIn](https://linkedin.com/in/manikantan-deevanooru) · [GitHub](https://github.com/Manikantan-96)
