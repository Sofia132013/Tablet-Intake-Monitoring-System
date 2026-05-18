# Tablet Intake Monitoring System

---

A web tablet monitoring system to track medication intake and schedules \
in the form of a Node.js Express server with a PostgreSQL database.\
Containerized with Docker.\
Ran with an NGINX that accepts SSL and does load balancing between 
multiple server instances.

A CI/CD pipeline for build, test, and deployment automation is included.

### Requirements
1. [Node.js](https://nodejs.org/en) JavaScript runtime 
   >You may be required to install an older version of Node.js (like 22.22.2) as newers may not work with prisma properly, throwing errors such as **Error: (0 , CSe.isError) is not a function**
2. [npm](https://www.npmjs.com/) package manager *(It is usually installed alongside Node.js)*
3. [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(Docker Engine is also an option)*
4. Optionally, [PostgreSQL with pgAdmin](https://www.postgresql.org/) *(or dockerized versions)*
5. Optionally, [NGINX](https://nginx.org/)

### App configuration
The main app configuration is performed by environmental variables declared
in ```.env``` and ```/front/env.js``` files.

More precise configuration may be done by creating different combinations
of containers from ```docker-compose.yaml``` and changing ```/backend/nginx/nginx.template```. The static NGINX config may be obtained
automatically with the helping script ```/scripts/generate_nginx_conf.sh```

### Development setup
1. Initialize the project from the root with ```npm install``` (or ```npm ci``` to install exact dependencies from the locked ```package-lock.json```)
2. Create a PostgreSQL database that will be synced with the Prisma schema (you can use different means, for example, using a ```create-db``` package or with pgAdmin as usual)
3. At the root, nearby ```.example.env```, add a ```.env``` file with the same fields
   1. **DATABASE_URL** should be at the form *postgres://* &lt;Client User&gt; *:* &lt;PostgreSQL Server password&gt; *@* &lt;Server Host IP address&gt; *:* &lt;Server port&gt; */* &lt;Database name&gt; *?* &lt;Optional connection settings as query parameters&gt;
   2. **JWT_SECRET** should store a HS256 secret JWT key, one may use online JWT secrets generators
   3. **SERVER_IP** is used by NGINX template, use *172.17.0.1* to address the localhost when NGINX is inside a container (a default Docker Network link)
4. Change the fields of ```/front/env.js``` to proper values also
   1. **API_URL** is used by a browser, use *http* and a concrete port *OPEN_SERVER_PORT* when you execute an only app instance
5. Change directory to ```/backend``` and apply the Prisma schema to your local database with ```npx prisma db push```
6. Generate a Prisma Client with ```npx prisma generate``` from the same directory
7. Run the server with ```node ./backend/server.js```

### Local NGINX setup
1. Set **SERVER_IP** to be *127.0.0.1* and do other environmental variables changes if needed
2. Execute the script ```/scripts/generate_nginx_conf.sh```
3. Copy the ```/scripts/results/nginx.conf``` to your NGINX configuration file
4. Run NGINX
5. Run instances of the app bound to ports specified in ```.env```
6. Address the app via *127.0.0.1/login*
7. Generate your own SSL certificates by replacing the provided shared certificates in ```/backend/nginx/nginx_certificates``` with tools such as 'OpenSSL'

### Prisma Migrations
* Use ```npx prisma migrate dev --name <Migration name>``` to create the database schema change history 
* Use ```npx prisma migrate deploy``` to apply the schema changes to a production database
