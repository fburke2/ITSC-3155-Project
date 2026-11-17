# Amazon RDS database setup

This project uses Prisma with MySQL. The committed schema is
[`app/prisma/schema.prisma`](../app/prisma/schema.prisma), and the Prisma commands are
defined in [`app/package.json`](../app/package.json).

## 1. Create the RDS instance

One team member should own the AWS setup. In the Amazon RDS console:

1. Create a **MySQL** DB instance using the required class, storage, and
   region for the team.
2. Set an initial database name, master username, and strong master password.
3. Enable encryption at rest and automatic backups.
4. Prefer a private DB subnet. If members connect directly from their
   computers for development, enable public access only for this development
   instance and restrict its security group as described below.
5. Record the instance endpoint and port (`3306`). Do not record the password
   in this repository.

### Security group

Add an inbound rule to the RDS security group:

| Type | Port | Source |
| --- | ---: | --- |
| MySQL/Aurora | 3306 | Each member's current public IP as `/32` |

Do not use `0.0.0.0/0`. Update the rule when a member's IP changes. For a
production-like setup, keep RDS private and connect through an application
server, VPN, or bastion instead of making RDS publicly accessible. AWS
security groups are stateful virtual firewalls; see the [AWS security group
documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.RDSSecurityGroups.html).

## 2. Create authorized team credentials

Do not distribute the RDS master password. Create one database user per
teammate, or use AWS Secrets Manager/IAM database authentication if the team
has configured it. For a development database, each user needs enough
privilege to apply the committed migration. A database administrator can
create users with SQL similar to this, replacing the placeholders privately:

```sql
CREATE USER 'member_a'@'%' IDENTIFIED BY 'use-a-unique-password';
GRANT ALL PRIVILEGES ON `course_explorer`.* TO 'member_a'@'%';
FLUSH PRIVILEGES;
```

Use the least privilege needed for the project, and remove temporary users
when the project ends. Share passwords only through an approved password
manager or secure channel, never through GitHub, issues, screenshots, or chat
messages that are not approved for secrets.

## 3. Configure each workstation

Each teammate runs these commands from a fresh clone or updated checkout:

```powershell
git pull
Set-Location app
npm ci
Copy-Item .env.example .env
```

Open `app/.env` and replace the placeholder `DATABASE_URL` with that
teammate's authorized URL. The URL format is:

```text
mysql://<user>:<password>@<rds-endpoint>:3306/<database-name>
```

URL-encode special characters in the username or password. Do not commit
`app/.env`; it is covered by the repository's ignore rules.

Then validate and generate the Prisma client:

```powershell
npm run db:validate
npm run db:generate
```

For a **shared RDS database**, one designated migration owner applies the
committed migration:

```powershell
npm run db:deploy
```

Other members should not run `db:migrate` against the shared database. That
command is for developing a new migration and should be reviewed and
committed before the migration owner deploys it. For a separate local MySQL
database, each member may run `npm run db:deploy` after creating the database.

Start the application with:

```powershell
npm run dev
```

## 4. Verify a database operation

The main survey and course selection store state in browser `localStorage`.
Degree Survey submissions are also stored in browser `localStorage`; when the
API and MySQL database are available, they are additionally saved in the
`DegreeSurvey` and `DegreeSurveyClass` tables through `/api/degree-surveys`.
Start the API with `npm run api` from `app`, or use `run-app.cmd` from the
repository root to start the API and Vite together.

The following SQL statements verify the account tables' RDS connection and
read/write operations directly. Do not use a real person's email or password
for this test.

Member A inserts a test record using MySQL Workbench, the MySQL CLI, or
another approved SQL client:

```sql
INSERT INTO `User`
    (`email`, `passwordHash`, `createdAt`, `updatedAt`)
VALUES
    ('db-verification@example.invalid', 'verification-only', NOW(3), NOW(3));
```

Member B retrieves it:

```sql
SELECT `id`, `email`, `createdAt`
FROM `User`
WHERE `email` = 'db-verification@example.invalid';
```

If the team has at least three members, Member C updates it:

```sql
UPDATE `User`
SET `email` = 'db-verification-updated@example.invalid',
    `updatedAt` = NOW(3)
WHERE `email` = 'db-verification@example.invalid';
```

Another member verifies the update:

```sql
SELECT `id`, `email`, `updatedAt`
FROM `User`
WHERE `email` = 'db-verification-updated@example.invalid';
```

After verification, remove the test record:

```sql
DELETE FROM `User`
WHERE `email` = 'db-verification-updated@example.invalid';
```

Do not include connection strings, usernames, passwords, IP addresses, or
query output containing sensitive data in the evidence.

## Team database verification

Replace the placeholders after the team performs the live test. Record only
the operation and result, not credentials.

| Member | Connection test performed | Result |
| --- | --- | --- |
| Member A — replace name | Inserted the verification `User` record | Pending — fill after test |
| Member B — replace name | Retrieved the verification record | Pending — fill after test |
| Member C — replace name (if applicable) | Updated the verification record | Pending — fill after test |
| Another member — replace name | Verified the updated record | Pending — fill after test |

## Troubleshooting

- **Connection timed out:** confirm the RDS instance is available, the
  endpoint/port are correct, and the member's current public IP is in the
  security group.
- **Access denied:** verify the database username, password, database name,
  and grants; do not retry with the master password in shared channels.
- **Prisma cannot read `DATABASE_URL`:** confirm the file is exactly
  `app/.env` and that the command is being run from `app`.
- **Migration already applied:** do not edit or delete the shared migration
  history; coordinate with the migration owner.
