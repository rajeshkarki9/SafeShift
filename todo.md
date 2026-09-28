# Revised SafeShift Login Checklist

- [x] Remove the oversized marketing headline and make the login form the visual focus.
- [x] Centre the login experience across the full available page, without a rigid two-column container.
- [x] Replace the white-backed logo treatment with a transparent version of the supplied SafeShift logo.
- [x] Add email and password inputs with the supplied Employee, Manager, and Administrator credentials.
- [x] Represent the three actor outcomes: training and quiz, progress reports, and content management.
- [x] Verify desktop and mobile layouts and confirm the updated source compiles.
- [x] Replace the current background treatment with a pure-black surface and a restrained dimensional 3D animation.
- [x] Add animated “Welcome to SafeShift” copy while retaining the centred login focus.
- [x] Change the label beneath the logo from “Sign in” to “Login.”
- [x] Reverify the updated login on desktop and mobile.
- [x] Replace the black 3D background with a white base and animated pastel blue, green, and amber gradients.
- [x] Restyle the centred login controls for the new light visual system.
- [x] Verify the refreshed experience on desktop and mobile.
- [x] Intensify the animated SafeShift blue, green, and amber pastel gradient fields.
- [x] Verify stronger gradient visibility without reducing login-form contrast.
- [x] Route Employee login to the learner dashboard, training, quiz, results, and progress flow.
- [x] Route Manager login to a manager dashboard with employee progress, results, and completion views.
- [x] Route Administrator login to an admin dashboard with training-content management.
- [x] Verify each credential enters the correct role-specific destination.
- [x] Add an Employee readiness screen that collects a name before entering the learner dashboard.
- [x] Add Begin and Back to Login actions to the readiness screen.
- [x] Persist employee name and learning progress in shared application data.
- [x] Show saved employee name, progress, results, and completion to Managers.
- [x] Verify the employee onboarding and manager-reporting flow.
- [x] Persist per-topic employee progress, quiz scores, and completion timestamps.
- [x] Replace Manager stage placeholders with the saved progress, result, and completion values.
- [x] Reverify Back to Login, refresh persistence, and all three Manager record views against saved employee data.
- [x] Persist employee training stage, quiz score, progress percentage, and completion time per topic.
- [x] Display the saved topic-level progress, results, and completion records in the Manager views.
- [x] Re-test persistence after browser reload and verify all Manager views against per-topic records.

- [x] Sync the completed SafeShift frontend, role portals, persistence schema, migrations, server procedures, and tests into the desktop source folder.
- [x] Verify the desktop folder contains the latest synced files.

- [x] Fix the local logo asset path so the SafeShift logo loads in VS Code.
- [x] Add a no-database local fallback so employee names and topic progress save during local development.
- [x] Verify the local source builds after the fix.

- [x] Keep the managed preview on its uploaded logo URL while retaining the local public logo path in the desktop source.

- [x] Clear the Employee name field for each new sign-in session.
- [x] Update the same employee-topic record instead of creating duplicate Manager entries.
- [x] Verify sign-out reset and repeated-name Manager reporting behavior.

- [x] Add Manager-only sidebar navigation for Dashboard, Employee Progress, Training Completion, and Profile.
- [x] Add data-derived Manager summary cards for total employees, completed, in progress, and not started.
- [x] Add overall completion, six-topic completion metrics, outstanding training, and recent activity sections.
- [x] Add read-only employee progress table and View Details experience without edit controls.
- [x] Preserve the existing background theme and leave Employee and Administrator dashboards unchanged.
- [x] Verify Manager-only dashboard behavior and source build, including Manager browser navigation and the final desktop build.

- [x] Set the Manager dashboard Total Employees summary card to the confirmed workforce count of 50 while retaining live status metrics.
- [x] Sync and verify the corrected workforce count in the desktop source and Manager preview.

- [x] Add an accessible View password / Hide password toggle to the login page.
- [x] Verify the 50-employee Manager count remains intact after the login update.

- [x] Employee: add reusable six-topic learning journeys with content, scenario, mini-game, challenge, and quiz stages.
- [x] Employee: provide exactly five multiple-choice questions per topic with counter, progress, selection state, navigation, and gated submission.
- [x] Employee: calculate score, percentage, correct/incorrect totals, configurable completion status, and educational feedback.
- [x] Employee: persist quiz questions, attempts, answers, results, timestamps, and topic progress with employee-only access.
- [x] Employee: show previous quiz results and preserve Manager/Administrator dashboards and the existing background theme.
- [x] Verify the Employee quiz system and synchronize the desktop source.

- [x] Use the existing MySQL/TiDB + Drizzle stack rather than migrating the project to PostgreSQL/Prisma.
- [x] Add database-backed quiz catalog and attempt persistence through the existing Drizzle schema and tRPC procedures.

- [x] Replace generic Employee journey labels with real per-topic content, scenario, mini-game, and challenge experiences.
- [x] Add a real configurable pass-threshold completion rule with Completed / Needs Review status.
- [x] Restrict quiz history and submission procedures to the authenticated Employee owner instead of accepting arbitrary public email values.
- [x] Add tests for completion status and employee quiz ownership authorization.
