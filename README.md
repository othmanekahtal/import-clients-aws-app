### Feature: Import Clients' Data via CSV

**Objective:**  
To automate the process of importing clients' data into the system. A CSV file containing client information is uploaded to an S3 bucket, which triggers a Lambda function to parse and store the data in an AWS RDS database. A scheduled cron job manages the cleanup of processed files, and a notification is sent to a specific user to confirm the import status.

---

### Workflow:

1. **CSV File Upload to S3:**
   - **User Action:** A CSV file containing clients' data (e.g., name, email, company, contact details) is uploaded to a designated S3 bucket.
   - **S3 Configuration:** The bucket is configured with an event trigger to invoke a Lambda function when a new file is uploaded to a specific folder (e.g., `client-data/uploads/`).

2. **Lambda Function - Parse and Process:**
   - **Invocation:** The Lambda function is triggered automatically upon file upload.
   - **CSV Parsing:** The function reads the CSV file from the S3 bucket and parses its content.
   - **Data Validation:** Each record is validated against predefined rules (e.g., valid email format, required fields like company name).
   - **Error Handling:** If errors are detected, they are logged for review. Invalid records are not inserted into the database and are reported to the designated user.

3. **Save Data to AWS RDS:**
   - **Database Connection:** The Lambda function connects to the AWS RDS instance using secure credentials.
   - **Data Storage:** Valid records are inserted into the `clients` table in the RDS database.
   - **Transaction Management:** Transactions ensure data integrity, rolling back in case of insertion errors.

4. **Scheduled File Deletion - Cleanup Job:**
   - **Cron Job Configuration:** A scheduled Lambda function (cron job) is set up to run periodically (e.g., daily or weekly) to delete processed files from the S3 bucket.
   - **Deletion Criteria:** Files older than a specified period (e.g., 24 hours) are deleted to keep the S3 bucket organized and manage storage costs.

5. **Notification to Specific User:**
   - **Email Notification:** After processing, an email is sent to a designated user (e.g., the client admin) with the status of the import, including the number of successful records and any errors encountered.
   - **Configuration:** Use Amazon SES or SNS to send notifications to a specific email address configured in the Lambda environment variables.

---

### Technical Specifications:

1. **CSV File Structure:**
   - Headers: `Name, Email, Company, Phone, Status`
   - Example:
     ```
     John Doe, john.doe@example.com, Acme Corp, +1234567890, Active
     Jane Smith, jane.smith@example.com, Widget Co, +0987654321, Inactive
     ```

2. **AWS S3 Bucket:**
   - **Bucket Name:** `client-data-import-bucket`
   - **Folder Structure:** `client-data/uploads/`
   - **Permissions:** IAM role configured with read and delete permissions for the bucket.

3. **AWS Lambda Functions:**
   - **Client Data Import Processor:**
     - **Function Name:** `ClientDataImportProcessor`
     - **Trigger:** S3 event on `client-data-import-bucket/client-data/uploads/`
     - **Memory & Timeout:** Configured based on expected file size and processing time (e.g., 512 MB RAM, 5 minutes timeout).
     - **Environment Variables:**
       - `RDS_HOST`: RDS instance endpoint
       - `RDS_USER`: Database username
       - `RDS_PASS`: Database password (secured via Secrets Manager)
       - `RDS_DB`: Database name
       - `NOTIFICATION_EMAIL`: Email address of the user to be notified

   - **File Deletion Scheduler:**
     - **Function Name:** `ClientDataFileCleaner`
     - **Trigger:** Scheduled event (e.g., daily at midnight)
     - **Functionality:** Deletes files older than 24 hours from `client-data-import-bucket/client-data/uploads/`

4. **AWS RDS:**
   - **Instance Type:** `db.t3.micro` (or appropriate based on expected load)
   - **Database Engine:** PostgreSQL (or client-specified engine)
   - **Clients Table Structure:**
     ```sql
     CREATE TABLE clients (
       id SERIAL PRIMARY KEY,
       name VARCHAR(100),
       email VARCHAR(100) UNIQUE,
       company VARCHAR(100),
       phone VARCHAR(15),
       status VARCHAR(50)
     );
     ```

5. **Error Handling:**
   - **DLQ (Dead Letter Queue):** Configure an SQS Dead Letter Queue for failed Lambda executions.
   - **Logging:** Use CloudWatch for detailed logging of each step, including data parsing, validation errors, and database operations.
   - **Retry Mechanism:** Automatic retries for transient errors (e.g., database connection issues).

6. **Notification Configuration:**
   - **Service:** Amazon SES or SNS for sending notifications.
   - **Recipient:** Specific email address stored in Lambda environment variables (e.g., admin@clientdomain.com).

