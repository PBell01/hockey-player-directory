Hockey Staff Access Brief
1. Problem summary

Hockey operations staff use the same application to support daily work. However, not every staff member should see the same information.

The coaching, scouting, and medical teams have different responsibilities. Scouting notes contain competitive information. Sports-science and medical-related data contain sensitive player performance and health-related information.

Access must be based on each staff member's authorized role. A user must not gain access to restricted data simply because it is stored in a shared table or because they can call the API directly.

This document defines the access requirements for Sprint 4. It describes what information must be protected, who may access it, and what must never leak across roles. It does not implement authentication or database policies.

2. Sensitive data (what we protect)
Data	Why it is sensitive	Example misuse if leaked
Scouting notes	They contain competitive intelligence about players, prospects, and opponents.	A coach or medical staff member reads private draft evaluations or opponent weaknesses without authorization.
Sports-science / medical-related measures	They may contain personal performance, physical condition, and health-related information.	A scout accesses private medical information or a coach uses information outside their authorized access.

Player directory information, such as a display name needed for navigation, may be shared when required by the application. Access to a player's name does not grant access to their private notes or sensitive measures.

3. Staff groups and primary goals
Staff group	Primary goal in the app	May see	Must not see
Coaching	Plan practices, prepare for games, and manage coaching operations.	Coaching-related operational information and shared directory information permitted for their work.	Scouting note details restricted to scouting and sports-science or medical-related rows outside their authorized scope.
Scouting	Record and review player evaluations and competitive intelligence.	Scouting notes for their authorized assignments and shared directory information needed for their work.	Sports-science or medical-related rows and private information restricted to other roles.
Medical	Track and review sports-science and medical-related information for player care.	Sports-science or medical-related rows within their authorized care scope and shared directory information needed for their work.	Scouting notes and coaching-only information outside their authorized scope.

A staff member's role determines which protected information they may access. Being an employee or knowing a player's identity does not automatically grant access to all of that player's information.

4. What must never leak across roles

The following are mandatory access rules:

A coaching account must not read scouting-note rows restricted to scouting work.
A scouting account must not read sports-science or medical-related rows.
A medical account must not read scouting notes restricted to scouting work.
No staff member may read, modify, or delete protected data outside their authorized role and scope.
Shared directory information may be available when necessary, but access to directory information must not grant access to private note contents or sports-science measures.
These rules must apply to both read and write operations. Hiding information on a screen must not allow unauthorized access through another application path.
Access must be denied by default when a user's identity or authorization cannot be verified.

These rules apply regardless of which screen, API request, or supported data-access path a staff member uses.

5. Why "hide it in the UI" is not enough

Hiding a menu item, button, page, or table column only changes what the application displays. It does not necessarily prevent access to the underlying data.

A user may attempt to call the API directly, reuse an available session token, or make a request through a network tool. If the server or database does not enforce access rules, the request may still return restricted rows.

Real protection requires three layers:

Authentication: The system must verify which staff member is signed in.
Server-side session checks: Server functions must verify the user's valid session before performing protected operations. They must not trust the browser alone.
Database authorization: PostgreSQL row-level security (RLS) must restrict which rows a user can access. Database rules must enforce the intended role boundaries on the applicable data-access paths.

All three layers must support the same access requirements. The interface may improve usability by hiding unavailable options, but it must never be the only protection for sensitive data.

6. In scope for this sprint (identity slice)

Sprint 4 identity work must establish the requirements and protections needed for role-based access:

Staff sign-in and sign-out with verified sessions.
Server functions that reject protected operations when there is no valid session.
A written role-to-data access matrix for coaching, scouting, and medical staff.
Row-level security policies that enforce the approved access rules.
A protected scouting data path that demonstrates that unauthorized reads are filtered or denied.
Verification that protected information cannot be accessed merely by bypassing the normal application screens.

This brief defines the required behavior. It does not implement these features.

7. Out of scope (later work)

The following items are outside this sprint's identity scope:

Full HR onboarding and account provisioning for every employee.
Fine-grained editing workflows inside medical charts.
Mobile-native applications.
Third-party data warehouse exports.
Additional staff roles not identified in the current client story.

Any additional requirements must be reviewed and documented before they are added to the access model.

8. Success criteria (how we will know this brief worked)
A new teammate can identify all three staff groups: coaching, scouting, and medical.
A new teammate can identify both main sensitive data types: scouting notes and sports-science or medical-related data.
The staff table clearly states what each group may and must not see.
The never-leak section contains explicit, enforceable cross-role prohibitions.
The document explains that direct API requests may expose restricted rows if access is not enforced outside the UI.
The document identifies authentication, server-side session checks, and database row-level security as required protections.
The scope clearly separates Sprint 4 identity work from later work.
Stakeholders can review and approve the requirements before implementation begins.
Later authentication, role-matrix, and RLS tasks can trace their requirements back to this brief.
No login code, SQL policies, framework setup, or unapproved staff roles are introduced in this requirements document.
9. Open questions for stakeholders
Which exact tables store scouting notes and sports-science or medical-related measures in the current schema?
Can one staff member hold multiple roles, such as coaching and scouting, or must roles be mutually exclusive for the first release?
Who can approve emergency access to medical information outside normal role permissions?
Which shared player directory fields must each staff group be able to access?
Who is responsible for approving role assignments and reviewing access when a staff member changes responsibilities?

These questions must be resolved with stakeholders before the corresponding implementation decisions are finalized.