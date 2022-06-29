<div style="text-align:center;margin:auto;">
    <img style="width:200px;margin:auto;" src="./public/src/images/caroutline.png" />
    <h1>Collisio</h1>
    <h2>A browser based car game where your smartphone is the controller for a vehicle on your pc</h2>
</div>

Go to <a href="https://collisio.club">collisio.club</a> to try the game!

Written for the web.
<ul>
    <li>
Nodejs typescript on the backend.
    </li>
    <li>
    
Typescript + react for the frontend.
    </li>
    <li>

Firebase for database.
    </li>
       </ul> 

<a href="https://threejs.org/">three.js</a> for graphics and <a href="https://enable3d.io/">enable3d</a> for physics.

<a href="https://socket.io/">socket.io</a> for sending information between controller and server.

<hr>

To run locally you will need to install the firebase emulator.

```
 npm install -g firebase-tools
```

Then

```
./run.sh
```


## To run server

Note that in `ts-server/router.ts` you will need to add your computer name 
`os.hostname().includes("your computer name")`

```
npm i
npm run dev
```



## Front end
```
cd public
npm i
```

#### To access vehicle tests
```
npm run testMode
```
and access http://localhost:5000/test
##### To access on phone
On windows go to cmd and write `ipconfig` and find the IPv4 Adderss
Then on your phone go to that address  http:"IPv4 Adderss":5000/test

#### To access normal app
```
npm run start
```
and access http://localhost:5000/


