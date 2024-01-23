const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000
const bcrypt = require('bcrypt');
const saltRounds = 10;

// middlewire
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_password}@cluster0.exrbbd1.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const generateHashedPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
};

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        //database collection
        const database = client.db('House_hunter')
        const usercollection = database.collection('users')
        const housecollection = database.collection('houses')

        app.post('/users', async (req, res) => {
            const { name, email, category, password } = req.body
            console.log(password)
            const query = { email: email }
            const exituser = await usercollection.findOne(query)
            if (exituser) {
                return res.send({ message: 'user already exist', insertedId: null })
            }
            const hashedPassword = await generateHashedPassword(password);
            const user = { name, email, category, password: hashedPassword }
            const result = await usercollection.insertOne(user)
            res.send(result)
        })

        app.post('/loginuser', async (req, res) => {
            const { email, password } = req.body
            console.log(email, password)
            let existingUser;
            try {
                existingUser = await usercollection.findOne({ email })
            }
            catch (error) {
                return new Error(error)
            }
            try {
                console.log(existingUser)
                if (!existingUser) {
                    return res.status(404).send({ message: 'User Not Found' })
                }
                const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password)
                if (!isPasswordCorrect) {
                    return res.status(401).send({ message: 'Invalid Email and Password' })
                }
                const token = jwt.sign(existingUser, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
                console.log('token', token)
                res.send({ email : existingUser.email, token })
            }
            catch (err) {
                console.log(err)
            }

        })

        app.get('/users', async (req,res)=>{
            let query ={}
            // const email = req.query.email
            // console.log(email)
            // if(email){
            //     query.email = email
            // }
            const result =  await usercollection.find(query).toArray()
            res.send(result)
        })

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email };
            console.log(query)
            const result = await usercollection.findOne(query)
            console.log(result)
            res.send(result)
        })

        // add house
        app.post('/houses', async (req,res)=>{
            const house = req.body
            //console.log(house)
            const result = await housecollection.insertOne(house)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    // finally {
    //     // Ensures that the client will close when you finish/error
    //     // await client.close();
    // }
    catch (err) {
        console.log(err)
    }

}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Home hunter runing')
})
app.listen(port, () => {
    console.log(`app is running on port ${port}`)
})