# e2e

Steps to run

1. Create a local psql database called e2e
2. Run the create table commands situated in db/schema.sql for the e2e database
3. npm i in both the client and server folders
4. Fill in the missing server/.env file with your details below
5. To start the server, go to the server folder and run -- npx nodemon src/server.ts (install npx if fail)
6. To start the client, go to the client folder and run -- npm run dev
7. Run -- npm run dev2 -- to start a second client to imitate a second user

**server/.env**

USER={psql_user}

PASSWORD={psql_password}

HOST=localhost

DB_PORT=5432

DB_NAME=e2e

PORT=3001

ROOT_FOLDER=e2e-history
