# What is Fireplace?  
A Fullstack Messaging App Inspired by Discord

## Main Features
- User Register/Login Using 1 Way Password Encryption and Web Tokens for Identification
<img src="/readmeImgs/userloginImage.png" width="400" height="800">
- Global Chat with Message Timestamps, an Unchangeable Profile Picture, and the Ability to Send/Edit/Delete Messages Using Api Endpoints
<img src="/readmeImgs/globalchatImage.png" width="400" height="800">
- Sending Friend Requests, Accepting/Declining Pending Friend Requests, Removing Already Established Friends
<img src="/readmeImgs/addfriendImage.png" width="400" height="800">
- Sending Messages to All Friends With End to End Encryption, Same Features as the Global Chat
<img src="/readmeImgs/friendchatImage.png" width="400" height="800">
- Messages are all sent in real time using web sockets, no need to refresh the page

## Tech Stack + Reasoning
- **html/css/javascript**: to learn the fundamentals of front end development
- **node.js**: enables fast javascript development for front and backend with a massive ecosystem and community
- **express.js**: allows for fast Api endpoint setup that handles things like routing, serving static files, middleware, and more
- **PostGreSQL**: a highly efficient relational db that follows acid and provides advanced sql features for performance
- **socket.io**: easily implemented web socket for real time communication between users
- **docker**: containerizes the app removing download requirements and handling the db and server creation on runtime
- **AWS EC2**: common cloud service providing me a way to host my application on the internet. Easy to use with docker
- **Caddy**: allows me to have an easy to use reverse proxy for my web app to route traffic from port 80 to my internal app's port
- **bcryptJS**: used for 1 way encryption with the users passwords
- **cryptoJS**: provides symmetric key for fast encryption and decryption for global chat and is part of the friend chat E2E encryption
- **JSencrypt**: provides assymetric key encryption, used to encrypt/decrupt a symmetric key for E2E friend chat encryption
- **moment**: makes timestamps easy to obtain, place in the database, and convert to the clients time when needed
- **bad-words**: used to filter words in messages to keep the chat with some level of decency

## System Design
<img src="/readmeImgs/fireplaceSystemDesign.png" width="700" height="1400">

#### Client
- **Socket Connection**: used to implement real time communication within the global and friend chat. This establishes a socket connection when loading friend chat or global chat and stays connected until they leave the page. There is only one event which is called when the messages table has been updated and tells other connected clients to refresh their chat
- **Login Page**: this page connects to the Auth Routes where it can send a http request to register or login. It also handles storing the token on server response and creating the public and private key on registration
- **Global Chat**: this page connects to Message Routes and is able to create/edit/delete/read messages through the http requests it sends out to the server. It uses a symmetric key stored in plain js to encrypt/decrypt messages so the database doesn't store plaintext
- **Friend Chat**: similar to the global chat however it also accesses the friend routes to see who the user is friends with and add their chat to the list. It also has the added responsibility of creating a symmetric key the first time they dm someone new and sending that encrypted with an asymmetric key to the server so the recipient can decode the messages
- **Add Friends**: this page connects to friend routes. Where it allows the user through http requests to send friend requests, accept/decline pending friend requests, and remove already existing friends  
**Note**: every page past the login page uses the JWT token for every endpoint to ensure validity

#### Server
- **Socket Connection**: used to implement real time communication within the global and friend chat. After establishing a connection when the server receive an event for messages being updated, it tells all clients to reload their chats.
- **Auth Middleware**: used to validate the token passed in every http request header once past the login page. friend and message routes are first taken to this middleware. Also adds userId to the request then passes it on to the proper endpoint.
- **Friend Routes**: communicates with the client and database in order to add/edit/delete/read friend requests as needed by the users. Uses the friends table and creates a new channel for the dm when creating a new friend entry
- **Message Routes**: communicates with the client and database in order to add/edit/delete/read messages as needed by the users. uses the message table primarily which makes reference to the users and channels table. 
- **Auth Routes**: communicates with the client and database in order to register or login a user as needed. Interacts with the users table and makes everything else possible. Also handles the creation and distribution of the JWT keys  
**Note**: every route checks if the user has access to that information. For example a user trying to send a message in a dm he is not part of, in addition to the middleware token check.

#### Database
- **Users Table**: stores id, username, public_key, and a encrypted password. Groups together all database user data 
- **Messages Table**: stores id, channel_id(channels), user_id(users), text, edited, timestamp, and encrypted_symmetric_key. This structure allows for fast crud operations on messages
- **Friends Table**: stores id, user_id(users), friend_user_id(users), channel_id(channels), accepted. user_id is always the user who sent the request. A channel must also be made for every friend request, even if it stays pending.
- **Channels Table**: stores id. A very simple table as there is no extra information needed from a channel.

## Project Timeline

### Frontend
The project's frontend "started" with plain html, css, and javascript and finished with that as well. However there were many iterations of how the frontend looked. Originally there was no front end, as the app only had a backend. This progressed into what it is today. The front end handles the UI but it also handles sending http requests, client storing of important data like tokens, public/private keys, and symmetric keys used for security. In addition it also handles the message timestamps with moment.js.

### Backend
The project started with a todo app baseplate from a youtube tutorial. It used sqlite and had very little dependencies. However from the beggining it had user registering/login with password encryption and token authentication. The middleware that checks token validity currently used was also available from the start. I wanted to move to a more professional environment and so changed my database to PostgreSQL where I now had a separate server and database which is more standard in a production environment. I added tables and added entries to my tables as I needed while I added more features to the messaging app. All of these new features needed new endpoints as well so those also increased.

### Security
The project only had jwt authentication and 1 way password encryption at the start. In addition endpoints would also check if a user had access to do the task they were trying to do, such as deleting someone elses message wouldn't go through. It stayed this way for most of the production period but eventually JSencrypt and cryptoJS would increase security. First on global chat with a basic symmetric key generated by cryptoJS that was known by all users. All this really did was make it so plaintext wasn't stored in the database. The interesting security part comes with the friend chat. When you first start chatting to a new friend you create a randomly generated string of length 12 and save it. When decrypting messages in that chat you decrypt your own messages using the key you stored, and the friends messages through decrypting a symmetric key stored in that message. This symmetric key was encrypted using your own public key by the friend so your private key will be able to decrypt it. The biggest issue with this approach is that it does not work for multiple devices/browsers and if your key is compromised that entire chat is compromised. However compared to the complicated signal protocol industry standard it was much easier to implement and fit the project scope better.

### Deployment
At first a simple npm run dev command sufficed for the simple messaging app with a sqlite database. However once I migrated to PostgreSQL I found the need for easier deployment. This is where I researched docker and created my docker image and docker compose files. This streamlined the running process for an app with a separate db and server. The docker building continued and is still used for testing and deployment now. The only thing that changed was now I run it on my AWS EC2 Instance and use caddy as a reverse proxy to route my traffic through port 80 for HTTP. Setting up the EC2 Instance was a bit of a mental barrier to start with but the process ended up going smoother than I ever thought. Using caddy as the reverse proxy was also much easier to use than I imagined. I would like to move my database to AWS RDS and maybe purchase a domain name in the future. Inbetween these two steps I did use heroku to host my website temporarily but felt learning AWS skills was worth the time investment.

## How To Run Yourself
I have created a docker compose file for easy setup and teardown with no downloads needed  

`docker compose build`  
`docker compose up -d`  
Typically you need to run this command twice to get the database properly running  
`docker compose up -d`  

In order to stop running the container use  
`docker compose down`  
If you want to remove all of the data entirely use the -v flag to get rid of the volumes  