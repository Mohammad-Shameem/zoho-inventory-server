const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
var jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;



//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ warning: "unauthorized access" })
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" })
        }
        req.decoded = decoded
        next();
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.q3ftg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    await client.connect()
    const stockItems = client.db("Camping-Gears").collection("items")
    const stockCategories = client.db("Camping-Gears").collection("categories")

    try {
        app.post('/gettoken', async (req, res) => {
            const user = req.body
            const accessToken = jwt.sign(user, process.env.TOKEN_SECRET, {
                expiresIn: "2d"
            });
            res.send({ accessToken })

        })
        app.get('/items', async (req, res) => {
            const query = {};
            const cursor = stockItems.find(query);
            const items = await cursor.toArray();
            res.send(items)
        });
        app.get('/limiteditems', async (req, res) => {
            const query = {};
            const cursor = stockItems.find(query);
            const items = await cursor.limit(6).toArray();
            res.send(items)
        });
        app.get('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const item = await stockItems.findOne(query);
            res.send(item)
        });
        app.get('/itemcount', async (req, res) => {
            const query = {}
            const cursor = stockItems.find(query)
            const count = await stockItems.estimatedDocumentCount();
            res.send({ count })

        })
        app.get('/myitem', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            const page = parseInt(req.query.page)
            const pageSize = parseInt(req.query.pageSize)
            const query = { email };
            if (email === decodedEmail) {
                const cursor = stockItems.find(query);
                let item;
                if (page || pageSize) {
                    item = await cursor.skip(page * pageSize).limit(pageSize).toArray();
                    res.send(item);
                }
                else {
                    item = await cursor.toArray();
                    res.send(item);
                }
            }
            else {
                res.status(403).send({ message: "Forbidden Access" })
            }

        });
        app.get('/categorie', async (req, res) => {
            const query = {}
            const cursor = stockCategories.find(query)
            const categorie2 = await cursor.toArray()
            res.send(categorie2)
        })
        app.put('/deliveredItem/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const newQuantity = req.body?.newQuantity?.quantity
            const newSold = req.body?.newSold?.sold
            const quantity = req.body.quantity
            console.log("here", quantity)
            // console.log(newQuantity, newSold)
            console.log(req.body)
            if (newQuantity && newSold) {
                const updateDoc = {
                    $set: {
                        quantity: newQuantity,
                        sold: newSold
                    }
                }
                const quantityUpdated = await stockItems.updateOne(filter, updateDoc);
                res.send(quantityUpdated)
            }
            if (quantity) {
                const updateDoc = {
                    $set: {
                        quantity: quantity
                    }
                }
                const quantityUpdated = await stockItems.updateOne(filter, updateDoc);
                res.send(quantityUpdated)
            }
        });
        app.post('/item', async (req, res) => {
            const newItem = req.body
            const addedItem = await stockItems.insertOne(newItem)
            res.send(addedItem)

        });
        app.delete("/item/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const itemDeleted = await stockItems.deleteOne(query)
            res.send(itemDeleted)
        });

    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("server connected")
});


app.listen(port, () => {
    console.log("Listening to port", port)
});


