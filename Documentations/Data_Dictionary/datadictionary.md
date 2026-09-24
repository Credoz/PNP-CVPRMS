## 📌 Data Dictionary

**Description:**

The Data Dictionary provides detailed documentation of every database table and field used in the Philippine National Police — Computerized Violation Processing & Records Management System (PNP-CVPRMS). It defines attribute names, data types, field lengths, constraints, descriptions, and relationships to ensure consistency and accuracy during database development and maintenance.

> [!NOTE]
> The executable SQL schemas are maintained in the [Schema folder](file:///c:/Users/emman/PNP-CVPRMS/Schema/):
> - Enterprise SQL DDL: [`Schema/schema.sql`](file:///c:/Users/emman/PNP-CVPRMS/Schema/schema.sql)
> - SQLite Prototype DDL: [`Schema/sqlite_schema.sql`](file:///c:/Users/emman/PNP-CVPRMS/Schema/sqlite_schema.sql)
> - Architectural Guide: [`Schema/README.md`](file:///c:/Users/emman/PNP-CVPRMS/Schema/README.md)

---

### 1. OFFICERS
Maintains police personnel credentials, badge numbers, ranks, and station assignments.

| Field Name | Data Type | Key | Description |
| :--- | :--- | :---: | :--- |
| `Officer_Id` | Long / BIGINT | **PK** | Unique identification number of the police officer. |
| `BadgeNumber` | Text / VARCHAR(50) | **UK** | Official badge number of the officer. |
| `Rank` | Text / VARCHAR(50) | - | Rank or position of the police officer (e.g., PEMS, PSSg, PCpl). |
| `FirstName` | Text / VARCHAR(100) | - | First name of the officer. |
| `LastName` | Text / VARCHAR(100) | - | Last name of the officer. |
| `Station` | Text / VARCHAR(150) | - | Police station where the officer is assigned (e.g., Agoo Municipal Police Station). |

* **Primary Key:** `Officer_Id`

---

### 2. CHECKPOINTS
Records operational checkpoint locations, shifts, dates, and supervising officers.

| Field Name | Data Type | Key | Description |
| :--- | :--- | :---: | :--- |
| `Checkpoint_Id` | Long / BIGINT | **PK** | Unique identification number of the checkpoint. |
| `Location` | Text / VARCHAR(255) | - | Location or place where the checkpoint is conducted. |
| `DateConducted` | Date | - | Date when the checkpoint was conducted. |
| `TimeStart` | Time | - | Time when the checkpoint started. |
| `TimeEnd` | Time | - | Time when the checkpoint ended. |
| `Officer_Id` | Long / BIGINT | **FK** | Identifies the officer assigned to or conducting the checkpoint. |

* **Primary Key:** `Checkpoint_Id`
* **Foreign Key:** `Officer_Id` references `OFFICERS.Officer_Id`

---

### 3. VIOLATORS
Stores records and credentials of apprehended drivers or vehicle operators.

| Field Name | Data Type | Key | Description |
| :--- | :--- | :---: | :--- |
| `Violator_Id` | Long / BIGINT | **PK** | Unique identification number of the violator. |
| `LicenseNumber` | Text / VARCHAR(50) | - | Driver's license number of the violator, or 'N/A - Unlicensed'. |
| `FirstName` | Text / VARCHAR(100) | - | First name of the violator. |
| `LastName` | Text / VARCHAR(100) | - | Last name of the violator. |
| `Address` | Text / VARCHAR(255) | - | Residential address of the violator. |
| `ContactNumber` | Text / VARCHAR(50) | - | Contact phone number of the violator. |
| `IdType` | Text / VARCHAR(50) | - | Alternative government identification type for unlicensed drivers. |
| `IdNumber` | Text / VARCHAR(100) | - | Identification credential number. |

* **Primary Key:** `Violator_Id`

---

### 4. VEHICLES
Maintains records of motor vehicles involved in checkpoint inspections.

| Field Name | Data Type | Key | Description |
| :--- | :--- | :---: | :--- |
| `Vehicle_Id` | Long / BIGINT | **PK** | Unique identification number of the vehicle. |
| `PlateNumber` | Text / VARCHAR(20) | **UK** | Official plate number or conduction sticker of the vehicle. |
| `VehicleType` | Text / VARCHAR(50) | - | Type or category of the vehicle (Private/Sedan, Motorcycle, Commercial). |
| `Make` | Text / VARCHAR(50) | - | Manufacturer or brand of the vehicle. |
| `Model` | Text / VARCHAR(50) | - | Model name of the vehicle. |
| `Color` | Text / VARCHAR(50) | - | Color of the vehicle. |
| `RegisteredOwner` | Text / VARCHAR(150) | - | Name of the registered owner of the vehicle. |

* **Primary Key:** `Vehicle_Id`

---

### 5. OFFENSES
Catalog of statutory traffic violations, legal schedule, and fines.

| Field Name | Data Type | Key | Description |
| :--- | :--- | :---: | :--- |
| `Offense_Id` | Long / BIGINT | **PK** | Unique identification number of the offense. |
| `OffenseCode` | Text / VARCHAR(50) | **UK** | Official code assigned to the offense (e.g., NL-01, EX-02). |
| `Description` | Text / VARCHAR(255) | - | Description or name of the traffic violation. |
| `FineAmount` | Decimal(10,2) | - | Amount of the fine associated with the offense in Philippine Pesos (₱). |
| `LawViolated` | Text / VARCHAR(255) | - | Law or regulation violated (e.g., RA 4136, JAO 2014-01). |

* **Primary Key:** `Offense_Id`

---

### 6. TICKETS
Citation tickets issued to violators during checkpoint operations.

| Field Name | Data Type | Key | Description |
| :--- | :--- | :---: | :--- |
| `Ticket_Id` | Long / BIGINT | **PK** | Unique identification number of the ticket. |
| `TicketNumber` | Text / VARCHAR(50) | **UK** | Official ticket citation number issued to the violator. |
| `DateIssued` | Date | - | Date when the ticket was issued. |
| `TimeIssued` | Time | - | Time when the ticket was issued. |
| `ConfiscatedItem` | Text / VARCHAR(255) | - | Item confiscated from the violator (e.g., Driver's License, Plates), if applicable. |
| `Status` | Text / VARCHAR(50) | - | Current status of the ticket (Unsettled / Unpaid, Settled / Paid at Treasury). |
| `Officer_Id` | Long / BIGINT | **FK** | Identifies the officer who issued the ticket. |
| `Checkpoint_Id` | Long / BIGINT | **FK** | Identifies the checkpoint where the violation was recorded. |
| `Violator_Id` | Long / BIGINT | **FK** | Identifies the violator who received the ticket. |
| `Vehicle_Id` | Long / BIGINT | **FK** | Identifies the vehicle involved in the violation. |

* **Primary Key:** `Ticket_Id`
* **Foreign Keys:**
  - `Officer_Id` references `OFFICERS.Officer_Id`
  - `Checkpoint_Id` references `CHECKPOINTS.Checkpoint_Id`
  - `Violator_Id` references `VIOLATORS.Violator_Id`
  - `Vehicle_Id` references `VEHICLES.Vehicle_Id`

---

### 7. TICKET_OFFENSES
Associative table connecting citation tickets with one or more statutory offenses.

| Field Name | Data Type | Key | Description |
| :--- | :--- | :---: | :--- |
| `TicketOffense_Id` | Long / BIGINT | **PK** | Unique identification number of the ticket-offense record. |
| `Ticket_Id` | Long / BIGINT | **FK** | Identifies the ticket associated with the offense. |
| `Offense_Id` | Long / BIGINT | **FK** | Identifies the offense recorded on the ticket. |
| `FineAmount` | Decimal(10,2) | - | Specific fine amount applied for this offense. |

* **Primary Key:** `TicketOffense_Id`
* **Foreign Keys:**
  - `Ticket_Id` references `TICKETS.Ticket_Id`
  - `Offense_Id` references `OFFENSES.Offense_Id`

---

### 8. PAYMENTS
Captures settlement transactions processed at the Municipal Treasury.

| Field Name | Data Type | Key | Description |
| :--- | :--- | :---: | :--- |
| `Payment_Id` | Long / BIGINT | **PK** | Unique identification number of the payment. |
| `ORNumber` | Text / VARCHAR(50) | **UK** | Official receipt number assigned to the payment. |
| `Ticket_Id` | Long / BIGINT | **FK, UK** | Identifies the ticket being paid or settled. |
| `DatePaid` | Date | - | Date when the payment was made. |
| `AmountPaid` | Decimal(10,2) | - | Total amount paid by the violator. |
| `HandledBy` | Text / VARCHAR(100) | - | Name or identifier of the cashier who processed the payment. |

* **Primary Key:** `Payment_Id`
* **Foreign Key:** `Ticket_Id` references `TICKETS.Ticket_Id`
