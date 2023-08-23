const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: "unauthorized access"})
  }

  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
     if(err){
      return res.status(401).send({error: true, message: "unauthorized access"})
     }

     req.decoded = decoded
     next()

  })

}

app.get('/', (req, res) => {
    res.send('Awesome Restuarant is running')
})
 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5julrfk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollections = client.db("cafe-Resto-DB").collection("menu")
    const reviewsCollections = client.db("cafe-Resto-DB").collection("reviews")
    const cartCollections = client.db("cafe-Resto-DB").collection("carts")
    const userCollections = client.db("cafe-Resto-DB").collection("users")

    // json web token related api
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({token})
    })

    // menu related api
    app.get('/menu', async(req, res) => {
      const result = await menuCollections.find().toArray();
      res.send(result)
    })

    // reviews related api
    app.get('/reviews', async(req, res) => {
      const result = await reviewsCollections.find().toArray();
      res.send(result);
    })

    // cart Related api
    app.post('/carts',  async(req, res) => {
      const item = req.body;
      // console.log(item)
      const result = await cartCollections.insertOne(item);
      res.send(result)
    })

    app.get('/carts', verifyJWT,  async(req, res) => {
      const email = req.query.email;

      if(!email){
        res.send([])
      }
      
      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(403).send({error: true, message: "forbidden access"})
      }

      const query = {email: email}
      const result = await cartCollections.find(query).toArray();
      res.send(result)
    })

    app.delete('/carts/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await cartCollections.deleteOne(query);
      res.send(result)

    })

    // User Related Api
    app.post('/users', async(req, res) => {
      const user = req.body;
      console.log(user)
      const query = {email: user.email}
      const existingUser = await userCollections.findOne(query);
      if(existingUser){
        return res.send({message: 'user already exists'})
      }
      
      const result = await userCollections.insertOne(user)
      res.send(result)
    })

    app.get('/users', async(req, res) => {
      const result = await userCollections.find().toArray();
      res.send(result);
    })

    app.delete('/users/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await userCollections.deleteOne(query);
      res.send(result);
    })

    // admin
    app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollections.updateOne(filter, updateDoc);
      res.send(result);
    })

    // security layer
    // 1. verifyJWT
    // 2. check email
    app.get('/users/admin/:email', verifyJWT,  async(req, res) => {
      const email = req.params.email;

      if(req.decoded.email !== email){
        res.send({admin: false})
      }

      const query = {email: email}
      const user = await userCollections.findOne(query);
      const result = {admin: user?.role === "admin"};
      res.send(result)
    })
    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Awesome Restuarant is running on port: ${port}`)
})