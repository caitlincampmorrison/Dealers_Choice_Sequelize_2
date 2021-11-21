const { Connection } = require('pg');
const Sequelize = require('sequelize');
const { DataTypes: { STRING, UUID, UUIDV4, INTEGER } } = Sequelize
const db = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/dc_db');
const homepage = require("./views/home");
const express = require('express')
const app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', async(reqnp, res, next) => {
    try {
        res.send(homepage())
    }
    catch(ex){
        next(ex)
    }
})

app.get('/orders', async(req, res, next) => {
    try {
        const order = await Order.findAll({
            include: [ { model: Flower, as: 'flower' } ]
        })
        res.send(JSON.stringify(order), null, 2)
    }
    catch(ex){
        next(ex)
    }
})

app.get('/flowers', async(req, res, next) => {
    try {
        res.send(await Flower.findAll({
            include: [ Order ]
        }))
    }
    catch(ex){
        next(ex)
    }
})


const flower_name = ['roses', 'tulips', 'daisies', 'lily']
const colorval = ['red', 'pink', 'yellow', 'white']
const cust_name = ['joe', 'jill', 'mike', 'paul']

const Flower = db.define('flower', {
    name: {
        type: STRING(20)
    },
    color: {
        type: STRING(20)
    }
})
const Order = db.define('order',{
    id: {
        type: UUID,
        primaryKey: true,
        defaultValue: UUIDV4
    },
    name: {
        type: STRING(20)
    }
})

Order.belongsTo(Flower)
Flower.hasOne(Order, { foreignKey: 'flowerId' })

syncAndSeed = async() => {
    await db.sync({ force: true })
    const [roses, tulips, daisies, lily] = await Promise.all(
        flower_name.map((name, idx) => 
           Flower.create({ name, color: colorval[idx] }),
        )
    )
    const [joe, jill, mike, paul] = await Promise.all(
        cust_name.map(name => 
           Order.create({ name, flowerId: roses.id })
        )
    )
}

const init = async() => {
    try{
        await db.authenticate();
        await syncAndSeed();
        const port = process.env.PORT || 8080;
        app.listen(port, () => console.log(`listening on port ${port}`))
    }
    catch(ex){
        console.log(ex)
    }
}

init();