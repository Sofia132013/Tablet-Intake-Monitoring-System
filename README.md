# Tablet Intake Monitoring System

---

A web tablet monitoring system to track medication intake and schedules.\
Implementation of a backend service to manage application logic and API endpoints.\
PostgreSQL database to store user data, medication schedules, and intake status.\
Containerized with Docker.\
Ran with an NGINX to accept only Secure Socket Layer packets and do load balancing between multiple servers.

A CI/CD pipeline for build, test, and deployment automation is included.

### Requirements
1. [Node.js](https://nodejs.org/en) JavaScript runtime 
   >You may be required to install an older version of Node.js (like 22.22.2) as newers may not work with prisma properly, throwing errors such as **Error: (0 , CSe.isError) is not a function**
2. [npm](https://www.npmjs.com/) package manager *(It is usually installed alongside Node.js)*
3. [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(Docker Engine is also an option)*
4. Optionally, [PostgreSQL with pgAdmin](https://www.postgresql.org/) *(or dockerized versions)*

### Local execution
1. Initialize the project from the root with ```npm install``` (or ```npm ci``` to install exact dependencies from the locked ```package-lock.json```)
2. Create a PostgreSQL database that will be synced with the Prisma schema (you can use different means, for example, using a ```create-db``` package or with pgAdmin as usual)
3. At the root, nearby ```.example.env```, add a ```.env``` file with the same fields
   1. **DATABASE_URL** *(postgres://* &lt;Client User&gt; *:* &lt;PostgreSQL Server password&gt; *@* &lt;Server Host IP address&gt; *:* &lt;Server port&gt; */* &lt;Database name&gt; *?* &lt;Optional connection settings as query parameters&gt; *)*
   2. **JWT_SECRET**
   3. **PORT** *(of the Express server)*
   4. **NODE_ENV** *(e.g. "production")* 
4. Change directory to ```/backend``` and apply the Prisma schema to your local database with ```npx prisma db push```
5. Generate a Prisma Client with ```npx prisma generate``` from the same directory
6. Run the server with ```node ./backend/server.js```

### Prisma Migrations
* Use ```npx prisma migrate dev --name <Migration name>``` to create the database schema change history 
* Use ```npx prisma migrate deploy``` to apply the schema changes to a production database
