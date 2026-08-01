# Computerized Violation Processing and Records Management System for PNP Checkpoints (PNP-CVPRMS)

## 📌 Project Overview

The **Computerized Violation Processing and Records Management System for PNP Checkpoints (PNP-CVPRMS)** is a specialized records and citation management solution designed to streamline checkpoint operations for the Philippine National Police (PNP).

The system modernizes traditional paper-based citation procedures by providing digital verification of drivers and vehicles, automated penalty computation, real-time citation generation, and centralized records management for traffic violations committed at police checkpoints.

\---

## 🗂️ Repository Folder Structure

This repository is organized into structural and design documentation required for the system architecture:

```text
.
├── DFD/                          # Data Flow Diagrams
│   ├── stage0/                   # Context Diagram (Overview of system entities)
│   ├── stage1/                   # Level 1 DFD (Major system processes)
│   └── stage2/                   # Level 2 DFD (Detailed sub-processes)
├── Structured\_Chart/             # System Architecture \& Module Hierarchy
├── HIPO Diagram/                 # Hierarchy plus Input-Process-Output Diagrams
├── Structured\_English/           # Natural language business logic and decision rules
├── Pseudo\_Code/                  # Step-by-step system algorithms
│   └── process\_violation.txt    # Main violation screening and citation logic
├── ERD/                          # Entity-Relationship Diagram \& Database Schemas
└── Data\_Dictionary/              # Comprehensive database field definitions
```

\---

## ⚙️ Key Features \& System Capabilities

1. **Driver \& Vehicle Screening:**

   * Real-time lookup of driver's licenses and vehicle plate numbers.
   * Flagging of stolen vehicles, expired registrations, or wanted individuals.
2. **Violation Recording \& Citation Issuance:**

   * Selection of single or multiple traffic/checkpoint violations.
   * Automatic generation of official citation tickets with unique tracking numbers.
3. **Automated Fine \& Penalty Computation:**

   * Instant computation of total fines based on standard PNP offense schedules.
4. **Centralized Records Management:**

   * Secure logging of violations, checkpoint locations, and duty officer details.
   * Status tracking for ticket payments and record clearance.
5. **Reporting \& Analytics:**

   * Generation of summary reports for checkpoint activity and offense trends.

\---

## 👥 Project Team \& Contributions

* ##### System Architecture \& Documentation: 
* Casey Freud - Leader
* Angelo
* Antonio
* Augusto
* Manuel
* Benjie
* Emmanuel John
* Genuflect
* Ranier

# 📑 System Design Documentation

This repository contains the software engineering artifacts used in designing and documenting the **Computerized Violation Processing and Records Management System for PNP Checkpoints (PNP-CVPRMS)**. Each diagram represents a different aspect of the system's architecture, data flow, business logic, and database design.

---

## 📌 Stage 0 – Context Diagram

**Description:**

The Context Diagram presents the overall interaction between the PNP-CVPRMS and its external entities. It defines the system boundary by showing how users such as Police Officers, Drivers, Administrators, and external databases exchange information with the system without revealing the internal processes.

![Context Diagram](DFD/stage0/context-diagram.png)

---

## 📌 Stage 1 – Level 1 Data Flow Diagram (DFD)

**Description:**

The Level 1 Data Flow Diagram decomposes the Context Diagram into the system's major functional processes. It illustrates how data flows between the Driver Verification, Violation Processing, Citation Management, Records Management, Reporting modules, and the database.

![Level 1 DFD](DFD/stage1/level1-dfd.png)

---

## 📌 Stage 2 – Level 2 Data Flow Diagram (DFD)

**Description:**

The Level 2 Data Flow Diagram provides a more detailed view of the individual processes shown in the Level 1 DFD. It explains how each subprocess handles data during driver verification, violation validation, citation generation, payment recording, and database updates.

![Level 2 DFD](DFD/stage2/level2-dfd.png)

---

## 📌 Structured Chart

**Description:**

The Structured Chart illustrates the hierarchical organization of the system modules. It shows the relationship between the main program and its submodules, indicating how each module communicates and transfers control during system execution.

![Structured Chart](Structured_Chart/structured-chart.png)

---

## 📌 HIPO (Hierarchy plus Input-Process-Output) Diagram

**Description:**

The HIPO Diagram provides a structured representation of every major system module by identifying its required inputs, internal processing, and expected outputs. It serves as a guide for understanding the responsibilities of each component of the PNP-CVPRMS.

![HIPO Diagram](HIPO%20Diagram/hipo-diagram.png)

---

## 📌 Structured English

**Description:**

Structured English documents the business rules and operational logic of the system using simple English statements combined with structured programming constructs such as **IF**, **THEN**, **ELSE**, **WHILE**, and **FOR**. It improves readability and simplifies the translation of business requirements into program code.

![Structured English](Structured_English/structured-english.png)

---

## 📌 Pseudocode

**Description:**

The Pseudocode describes the step-by-step algorithms used by the system without following any specific programming language syntax. It explains the logical sequence of operations involved in checkpoint screening, driver verification, violation processing, citation generation, and records updating.

![Pseudocode](Pseudo_Code/process-violation.png)

---

## 📌 Entity Relationship Diagram (ERD)

**Description:**

The Entity Relationship Diagram (ERD) illustrates the logical database structure of the PNP-CVPRMS. It identifies the system entities, their attributes, primary keys, foreign keys, and relationships that support efficient storage and retrieval of checkpoint and violation records.

![Entity Relationship Diagram](ERD/erd.png)

---

## 📌 Data Dictionary

**Description:**

The Data Dictionary provides detailed documentation of every database table and field used in the system. It defines attribute names, data types, field lengths, constraints, descriptions, and relationships to ensure consistency and accuracy during database development and maintenance.

![Data Dictionary](Data_Dictionary/data-dictionary.png)

---
