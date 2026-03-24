# Requirements Document

## Introduction

This document outlines the requirements for implementing a doctor verification and approval system in the fyp-admin application. The system allows administrators to review doctor applications, view verification documents, and approve or reject doctor registrations.

## Glossary

- **Admin**: An authenticated administrator user with access to the admin panel
- **Doctor_Application**: A pending doctor registration awaiting admin review
- **Verification_Document**: An uploaded file (license, certificate) submitted by a doctor for verification
- **Verification_Status**: The current state of a doctor application (PENDING, APPROVED, REJECTED)
- **Admin_Panel**: The administrative dashboard interface

## Requirements

### Requirement 1: View Pending Doctor Applications

**User Story:** As an admin, I want to view all pending doctor applications, so that I can review and process new registrations.

#### Acceptance Criteria

1. WHEN an admin navigates to the doctors page, THE Admin_Panel SHALL display all doctors with their verification status
2. THE Admin_Panel SHALL show doctor details including name, email, specialty, license number, and clinic location
3. THE Admin_Panel SHALL display verification status badges (PENDING in yellow, APPROVED in green, REJECTED in red)
4. THE Admin_Panel SHALL allow filtering doctors by verification status
5. THE Admin_Panel SHALL display the submission date for each application

### Requirement 2: Review Doctor Application Details

**User Story:** As an admin, I want to view detailed information about a doctor application, so that I can make an informed approval decision.

#### Acceptance Criteria

1. WHEN an admin clicks on a doctor application, THE Admin_Panel SHALL display a detailed view with all submitted information
2. THE Admin_Panel SHALL display personal information (first name, last name, email, phone)
3. THE Admin_Panel SHALL display professional information (specialty, license number, experience, qualifications)
4. THE Admin_Panel SHALL display location information (address, city, clinic location)
5. THE Admin_Panel SHALL provide a link to view or download the verification document

### Requirement 3: View Verification Documents

**User Story:** As an admin, I want to view uploaded verification documents, so that I can verify the authenticity of doctor credentials.

#### Acceptance Criteria

1. WHEN an admin clicks on a verification document link, THE Admin_Panel SHALL display the document in a modal or new tab
2. THE Admin_Panel SHALL support viewing PDF, JPG, and PNG file formats
3. THE Admin_Panel SHALL provide a download option for the verification document
4. IF the document fails to load, THEN THE Admin_Panel SHALL display an error message

### Requirement 4: Approve Doctor Applications

**User Story:** As an admin, I want to approve doctor applications, so that verified doctors can access the platform.

#### Acceptance Criteria

1. WHEN an admin clicks the approve button, THE Admin_Panel SHALL display a confirmation dialog
2. WHEN the admin confirms approval, THE System SHALL update the verification status to APPROVED
3. THE System SHALL set isActive to true for the approved doctor
4. THE System SHALL record the admin ID who approved the application
5. THE System SHALL record the approval timestamp
6. THE Admin_Panel SHALL display a success message after approval
7. THE Admin_Panel SHALL update the doctor list to reflect the new status

### Requirement 5: Reject Doctor Applications

**User Story:** As an admin, I want to reject doctor applications with a reason, so that applicants understand why their application was denied.

#### Acceptance Criteria

1. WHEN an admin clicks the reject button, THE Admin_Panel SHALL display a dialog requesting rejection notes
2. THE Admin_Panel SHALL require rejection notes before allowing rejection
3. WHEN the admin confirms rejection, THE System SHALL update the verification status to REJECTED
4. THE System SHALL store the rejection notes in verificationNotes field
5. THE System SHALL record the admin ID who rejected the application
6. THE System SHALL record the rejection timestamp
7. THE Admin_Panel SHALL display a success message after rejection
8. THE Admin_Panel SHALL update the doctor list to reflect the new status

### Requirement 6: Backend API for Doctor Verification

**User Story:** As a system, I want to provide API endpoints for doctor verification operations, so that the admin frontend can manage doctor applications.

#### Acceptance Criteria

1. THE API SHALL provide an endpoint to list all doctors with filtering by verification status
2. THE API SHALL provide an endpoint to get detailed doctor information by ID
3. THE API SHALL provide an endpoint to approve a doctor application
4. THE API SHALL provide an endpoint to reject a doctor application with notes
5. THE API SHALL require admin authentication for all verification endpoints
6. THE API SHALL validate that only admins can perform verification actions
7. THE API SHALL return appropriate error messages for invalid operations

### Requirement 7: Dashboard Statistics

**User Story:** As an admin, I want to see statistics about doctor applications on the dashboard, so that I can monitor the verification workload.

#### Acceptance Criteria

1. THE Dashboard SHALL display the total number of doctors
2. THE Dashboard SHALL display the number of active (approved) doctors
3. THE Dashboard SHALL display the number of pending applications
4. THE Dashboard SHALL display the number of rejected applications
5. THE Dashboard SHALL update statistics in real-time when verification actions are performed

### Requirement 8: Verification Document Storage

**User Story:** As a system, I want to securely store and serve verification documents, so that admins can review them during the approval process.

#### Acceptance Criteria

1. THE System SHALL store verification documents in the uploads/verification-documents directory
2. THE System SHALL provide a secure endpoint to serve verification documents
3. THE System SHALL require admin authentication to access verification documents
4. THE System SHALL validate file paths to prevent directory traversal attacks
5. THE System SHALL return appropriate error messages if documents are not found
