# Security
Given that this is a clinical application, we strive to be as close to HIPPA-compliant as possible. Unfortunately, there is no universal guide to this; in its place, I have used the [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-4/) for reference. Many systems are implemented from scratch such as pre-signed urls, password hashing and user authentication to enable flexibility should we require an audit some day.

## Database
All queries related to user data are excuted using [row-level security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html). Passwords are hashed using [pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html) and are never stored unencrypted. Queries are executed by [Drizzle](https://orm.drizzle.team/) uses prepared statements to deter SQL injection. 

### Tenant and Unit Systems
As we flush out the hospital (tenant) and unit (team) systems, we can incorporate more features of RLS to enable strict tenant and unit-only row filtering.

## Networking
All traffic outside the cluster (e.g. through the web app) is always served over HTTPS provided by cert-manager. Service to service connections take place only within the cluster and our encrypted at the pod level using [Istio](https://istio.io/). 

## KMS Usage
Barbican Key Manager Service is used to store any long-lived user secrets. Currently, it holds user OTPs and password reset tokens. Previously, video encryption keys were stored in Vault, then moved to Barbican, and finally discontinued after integrating directly with Swift which provides server-side encryption at rest. Encryption keys typically adhere to AES256 as specified in the NIST guidelines.

**Note:** Security is everyone's responsibility. **If you see something, say something.**