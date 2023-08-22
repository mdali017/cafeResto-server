const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
    app.post('/carts', async(req, res) => {
      const item = req.body;
      // console.log(item)
      const result = await cartCollections.insertOne(item);
      res.send(result)
    })

    app.get('/carts', async(req, res) => {
      const email = req.query.email;

      if(!email){
        res.send([])
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