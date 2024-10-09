**Import Clients' Data via CSV**

**Objective:**
To automate the process of importing clients' data into the system. A CSV file containing client information is uploaded to an S3 bucket, which triggers a Lambda function to parse and store the data in an AWS DynamoDB table.

**Workflow:**

**1. CSV File Upload to S3:**

- **User Action:** A CSV file containing clients' data (e.g., name, email, company, contact details) is uploaded to a designated S3 bucket.
- **S3 Configuration:** The bucket is configured with an event trigger to invoke a Lambda function when a new file is uploaded.

**2. Lambda Function - Parse and Process:**

- **Invocation:** The Lambda function is triggered automatically upon file upload.
- **CSV Parsing:** The function reads the CSV file from the S3 bucket and parses its content.
- **Data Validation:** Each record is validated against predefined rules (e.g., valid email format, required fields like company name).
- **Error Handling:** If errors are detected, they are logged for review. Invalid records are not inserted into the database and are reported to the designated user.

**3. Save Data to AWS DynamoDB:**

- **Database Connection:** The Lambda function connects to the DynamoDB table using secure credentials.
- **Data Storage:** Valid records are inserted into the table in DynamoDB.
- **Batch Write Operations:** DynamoDB's batch write mechanism is used for efficient data storage.
