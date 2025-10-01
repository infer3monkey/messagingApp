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
- **heroku**: streamlines website deployment with support for PostgreSQL at resonable prices
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

#### Database
- **Users Table**: stores id, username, public_key, and a encrypted password. Groups together all database user data 
- **Messages Table**: stores id, channel_id(channels), user_id(users), text, edited, timestamp, and encrypted_symmetric_key. This structure allows for fast crud operations on messages
- **Friends Table**: stores id, user_id(users), friend_user_id(users), channel_id(channels), accepted. user_id is always the user who sent the request. A channel must also be made for every friend request, even if it stays pending.
- **Channels Table**: stores id. A very simple table as there is no extra information needed from a channel.

## How To Run Yourself
I have created a docker compose file for easy setup and teardown with no downloads needed  

`docker compose build`  
`docker compose up -d`  
Typically you need to run this command twice to get the database properly running  
`docker compose up -d`  

In order to stop running the container use  
`docker compose down`  
If you want to remove all of the data entirely use the -v flag to get rid of the volumes  

## Creation Process
It all started while following a backend tutorial for a simple todo app. I wanted to test my knowledge and changed the api endpoints and sqlite db to support a basic messaging app. I tested my endpoints and began working on the user authentication that the tutorial also covered. After that was a lot of time spent on the barebones front end to accompany this "beautiful" back end supporting user register/login and message sending/editing/deleting with a sqlite db.  

I wanted the application to have real time communication so I learned about web sockets and implemented socket.io in order to realize real time communication into my app. Another small front end revamp and I was learning about docker in class so I wanted to implement it into my project. Using a sqlite to PostgreSQL migration as my main reason I changed databases and containerized my application with the docker image and compose file.  

I wanted the messaging to feel more realistic to a real chatting app. I added an unchangeable profile picture and using moment.js I added timestamps to my messages. Also when editing a message an edited tag would now show up next to an edited message which all felt good to look at.  

The next expansion had to be friends. I got to work on being able to add friends and then be able to chat with them. Using the already existing global chat this process was streamlined. After this the app started feeling relatively complete and there was one last main thing I wanted to add.  

Message encryption for security. I added a simple known by all users assymetric key to the global chat and when that went smoothly I got to work on the more complicated friend dm encryption. Originally trying to implement libsignal protocol I ended up settling for using assymetric keys to encrypt and decrypt a symmetric key for every chat as needed.  

Finally I was satisfied with the application and was ready to deploy it. I researched AWS and heroku and decided to use heroku. After some trial and error it was hosted by heroku and my site was now live and ready for traffic from the internet. Success!

## Struggles
Given I was not very familiar with html/css/javascript there was a big learning process for all of these things throughout the project, especially at the beggining. At first I didn't even know how to make proper requests from the client to the server and then handle those requests when a response is given. The html wasn't too complicated but the css took me more time to tweak than I would like to admit.  

I spent quite a few hours looking at the libsignal protocol to try to implement a true industry standard E2E encryption protocol. However things were not clicking and I ended up deciding on my simpler approach that provides solid security for an app of this scale. One issue with my solution is multiple devices or different browsers are not accounted for so the user won't be able to read those messages. I also spent another plethora of hours trying to deploy my website and luckily ended up finding a video that got me about 80% of the way there and had to push through the last bit. Sadly the online environment and the localhost environment are slightly different so I had to fix some of these things (mainly how I handle user registration)