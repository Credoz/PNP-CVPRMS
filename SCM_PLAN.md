<!--
Software Configuration Management Plan
PNP-CVPRMS
-->

# Software Configuration Management (SCM) Plan

## 1. Header

| Field | Value |
| --- | --- |
| Project name | PNP-CVPRMS - Computerized Violation Processing and Records Management System for PNP Checkpoints |
| GitHub URL | https://github.com/Credoz/PNP-CVPRMS |
| Version | v1.0.0 |
| Date | 2026-09-20 |
| Team members | Casey Freud, Angelo, Antonio, Augusto, Manuel, Benjie, Emmanuel John, Genuflect, Ranier |

## 2. Purpose and Scope

This Software Configuration Management Plan establishes the governance, identification, control, accounting, and traceability practices for the PNP-CVPRMS repository. It provides a common process for maintaining an accurate, reviewable, and reproducible version of the project throughout development, testing, release, and maintenance.

The plan applies to the complete Node.js application and its supporting project materials, including the Express server, REST API routes, SQLite persistence layer, inline database schema and migrations, vanilla JavaScript and HTML user interface, npm dependencies, documentation, database files, configuration files, and automated tests. It covers changes made locally and changes submitted through the GitHub repository, including pull requests, merges, releases, and defect corrections.

The controlled development environment uses Node.js, npm, the Express framework, the SQLite3 package, SQLite database files, and the built-in Node.js test runner. Changes to source code, data structures, dependencies, documentation, scripts, or tests are configuration changes and are subject to the controls in this plan.

## 3. Configuration Items (CIs)

The following configuration item classes are controlled by this plan:

| CI class | Definition and examples |
| --- | --- |
| Source Code | Application logic, backend modules, API handlers, validation, business rules, and exported functions. The current implementation is primarily in `Main/server.js`. |
| Documentation | Project requirements, architecture and analysis documents, data dictionary, diagrams, pseudo-code, structured English, README files, and this SCM plan. |
| Dependencies/Environment | Node.js and npm requirements, `Main/package.json`, `Main/package-lock.json`, installed package definitions, and the Express and SQLite3 runtime dependencies. Generated `node_modules/` content is reproducible from the lockfile and is not committed as source. |
| Data/Schema | SQLite database files and the database definition, initialization, and migration logic. The current `violations` table schema is defined inline in `Main/server.js`; the local database is `Main/pnp_checkpoint.db`. |
| Build/Config/Test Scripts | npm lifecycle commands, repository ignore rules, test files, and other scripts or configuration used to install, run, validate, or package the application. The current test command is `node --test`. |

Each CI must be identified by its repository path, assigned an owner, associated with a version and lifecycle status, and changed through the flow defined in Section 7. Generated or machine-local files remain subject to identification even when they are excluded from version control.

## 4. Baseline Definition

Baseline `v1.0.0` is the approved reference point for PNP-CVPRMS. It consists of the configuration items listed in Section 8 at version `1.0.0` and with status `Baseline`.

The `v1.0.0` baseline is established only after the application passes the repository's built-in Node.js test runner from the application directory:

```text
cd Main
node --test
```

The baseline acceptance record must identify the commit or tag containing the approved items, the date of validation, the person performing the validation, and the test result. A change to a baselined CI requires a new change request and must not silently alter the baseline. Approved post-baseline changes are tracked as ongoing work until they are validated and incorporated into a subsequent release or baseline.

## 5. Versioning Convention

The project uses Semantic Versioning in the form `MAJOR.MINOR.PATCH`:

* **MAJOR** is incremented for incompatible changes to application behavior, data contracts, API contracts, deployment expectations, or other controlled interfaces.
* **MINOR** is incremented for backward-compatible functionality, features, or capabilities.
* **PATCH** is incremented for backward-compatible defect fixes, documentation corrections, security fixes, and small maintenance changes.

The current project baseline is `v1.0.0`. Release tags use the leading `v`; CI version values and configuration item versions use the corresponding numeric value `1.0.0` where a numeric value is required. A version may be assigned only after the change has been reviewed, validated, approved, and merged into the repository.

## 6. Status Accounting

Every controlled configuration item has one of the following lifecycle states:

| Status | Definition |
| --- | --- |
| Baseline | The item is included in an approved reference configuration, has passed the required validation, and may be used as the controlled reference for development and release. |
| Ongoing / Under Change | The item is being created, modified, reviewed, or validated under an approved change request and is not yet part of an approved replacement baseline. |
| Suspended | Work or release of the item is temporarily paused because of an unresolved defect, dependency, decision, resource, or approval issue. The current version and reason for suspension must remain recorded. |
| Superseded | The item has been replaced by a newer approved version or configuration. The superseded item remains traceable through repository history and change records. |

Status changes are recorded with the responsible owner, date, change request, validation result, and approving authority. An item marked `Baseline` cannot be edited directly without entering the change flow.

## 7. Traceability & Change Flow

All changes to controlled configuration items follow this sequence:

1. **Change Request:** Record the requested change, affected CI paths, requester, priority, and acceptance criteria.
2. **Reason for Change:** Document the business, technical, defect, security, compliance, or maintenance reason and identify the expected impact, dependencies, and risks.
3. **Development & Test Validation:** Implement the change on an appropriately named branch or work stream. Update affected documentation and tests, then run the relevant checks. For the application baseline, the required validation is `cd Main` followed by `node --test`.
4. **PR Review:** Submit a pull request that links the change request, explains the implementation, identifies affected CIs, and includes test evidence. At least one appropriate team member reviews source, data, dependency, documentation, and test impacts as applicable.
5. **Approval & Merge:** An authorized project maintainer approves the pull request after review findings are resolved. The change is merged into the repository, its CI status and version are updated, and the resulting commit is available for traceability. Release or baseline changes are tagged using the applicable Semantic Version.

No change is considered complete until its request, reason, implementation, validation result, review, approval, merge commit, and resulting CI status can be traced together. Changes affecting the SQLite schema must also document migration, compatibility, and database backup or reset considerations.

## 8. Configuration Management Plan Table

The table below is the controlled inventory for baseline `1.0.0`. Paths are relative to the repository root. Where a logical CI is implemented inside a shared file, the Name column identifies the relevant responsibility. The database file is a local SQLite artifact and is ignored by the application `.gitignore`; it is still listed because it exists in the workspace and participates in local operation and schema validation.

| Name | Category | File Path | Owner | Version | Status |
| --- | --- | --- | --- | --- | --- |
| Backend application and business logic | Source Code | `Main/server.js` | Casey Freud | 1.0.0 | Baseline |
| REST API routes and handlers | Source Code | `Main/server.js` | Angelo | 1.0.0 | Baseline |
| SQLite schema initialization and migrations | Data/Schema | `Main/server.js` | Antonio | 1.0.0 | Baseline |
| Static web interface and client-side JavaScript | Source Code / Public Asset | `Main/index.html` | Augusto | 1.0.0 | Baseline |
| Node project manifest and npm start script | Dependencies/Environment | `Main/package.json` | Manuel | 1.0.0 | Baseline |
| Locked dependency tree | Dependencies/Environment | `Main/package-lock.json` | Benjie | 1.0.0 | Baseline |
| SQLite violations database | Data/Schema | `Main/pnp_checkpoint.db` | Emmanuel John | 1.0.0 | Baseline |
| Built-in Node test suite | Build/Config/Test Scripts | `Main/test/features.test.js` | Genuflect | 1.0.0 | Baseline |
| Application ignore and generated-file rules | Build/Config/Test Scripts | `Main/.gitignore` | Ranier | 1.0.0 | Baseline |
| Root project overview and team record | Documentation | `README.md` | Casey Freud | 1.0.0 | Baseline |
| Application setup and usage guide | Documentation | `Main/README.md` | Angelo | 1.0.0 | Baseline |
| Data dictionary | Documentation | `Documentations/Data_Dictionary/datadictionary.md` | Antonio | 1.0.0 | Baseline |
| Entity-relationship diagram documentation | Documentation | `Documentations/ERD/erd_diagram.md` | Augusto | 1.0.0 | Baseline |
| Stage 0 DFD documentation | Documentation | `Documentations/DFD/stage0/dfdstage0.md` | Manuel | 1.0.0 | Baseline |
| Stage 0 process description | Documentation | `Documentations/DFD/stage0/stage0.md` | Benjie | 1.0.0 | Baseline |
| Stage 1 DFD documentation | Documentation | `Documentations/DFD/stage1/dfdstage1.md` | Emmanuel John | 1.0.0 | Baseline |
| Stage 2 DFD documentation | Documentation | `Documentations/DFD/stage2/dfdstage2.md` | Genuflect | 1.0.0 | Baseline |
| HIPO diagrams documentation | Documentation | `Documentations/HIPO Diagram/hipodiagrams.md` | Ranier | 1.0.0 | Baseline |
| Pseudo-code for violation processing | Documentation | `Documentations/Pseudo_Code/pseudocode_process_violation.md` | Casey Freud | 1.0.0 | Baseline |
| Structured chart documentation | Documentation | `Documentations/Structured_Chart/structuredchart.md` | Angelo | 1.0.0 | Baseline |
| Structured English documentation | Documentation | `Documentations/Structured_English/structuredenglish.md` | Antonio | 1.0.0 | Baseline |
| SCM governance plan | Documentation | `SCM_PLAN.md` | Augusto | 1.0.0 | Baseline |
| Dependencies directory placeholder | Dependencies/Environment | `Dependencies/.gitkeep` | Manuel | 1.0.0 | Baseline |
| Schema directory placeholder | Data/Schema | `Schema/.gitkeep` | Benjie | 1.0.0 | Baseline |
| Source Code directory placeholder | Source Code | `Source Code/.gitkeep` | Emmanuel John | 1.0.0 | Baseline |
| Configuration Scripts directory placeholder | Build/Config/Test Scripts | `Config Scripts/.gitkeep` | Genuflect | 1.0.0 | Baseline |

The inventory is reviewed whenever files are added, removed, renamed, generated, or reclassified. A new or changed item must be added to this table or to its successor baseline inventory before the related release is approved.
