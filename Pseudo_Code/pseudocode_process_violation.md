## 📌 Pseudocode

**Description:**

The Pseudocode describes the step-by-step algorithms used by the system without following any specific programming language syntax. It explains the logical sequence of operations involved in checkpoint screening, driver verification, violation processing, citation generation, and records updating.




ALGORITHM ProcessCheckpointViolation(officer_badge_no, checkpoint_id)

    // Step 1: Input Driver and Vehicle Details
    license_no  = READ_DRIVER_LICENSE()
    plate_no    = READ_VEHICLE_PLATE()

    // Step 2: Verification against Records Database
    driver_info  = SEARCH_DATABASE(table="Drivers", key=license_no)
    vehicle_info = SEARCH_DATABASE(table="Vehicles", key=plate_no)

    IF vehicle_info.is_stolen == TRUE OR driver_info.has_warrant == TRUE THEN
        RAISE_CHECKPOINT_ALERT("FLAGGED VEHICLE OR WANTED PERSON DETECTED")
    END IF

    // Step 3: Record Committed Violations & Calculate Fine
    committed_violations = SELECT_CHECKPOINT_VIOLATIONS() 
    // e.g., Expired License, Unregistered Vehicle, No Helmet, Modified Exhaust
    
    total_fine = 0
    FOR EACH violation IN committed_violations
        total_fine = total_fine + violation.standard_fine_amount
    END FOR EACH

    // Step 4: Create Citation Ticket Record
    ticket_id = GENERATE_TICKET_NUMBER()
    datetime  = GET_CURRENT_TIMESTAMP()

    citation_record = BUILD_RECORD(
        ticket_number = ticket_id,
        officer_id    = officer_badge_no,
        checkpoint    = checkpoint_id,
        driver_id     = license_no,
        plate_number  = plate_no,
        violations    = committed_violations,
        total_amount  = total_fine,
        payment_status= "UNPAID",
        date_issued   = datetime
    )

    // Step 5: Save Record & Issue Citation Notice
    SAVE_TO_DATABASE(table="Violations_Log", record=citation_record)
    PRINT_OFFICIAL_CITATION_NOTICE(citation_record)

    RETURN ticket_id

END ALGORITHM
