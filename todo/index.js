const express = require('express') 
const cors = require('cors')
const app = express()
const port = 3000

// cors - allow connection from different domains and ports
app.use(cors())

// convert json string to json object (from request)
app.use(express.json())

// mongo here...
const mongoose = require('mongoose')
//const mongoDB = "mongodb://127.0.0.1:27017/todo-api";
const mongoDB = 'mongodb+srv://ultimatow1:gfcpWgu58yeCdDSm@cluster0.lmhoplt.mongodb.net/'
mongoose.connect(mongoDB)

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  console.log("Database test connected")
})

// Mongoose Scheema and Model here...
// scheema
const todoSchema = new mongoose.Schema({
  text: { type: String, required: true } 
})

// model
const Todo = mongoose.model('Todo', todoSchema, 'todos')

// Routes here...
// todos-route
app.post('/todos', async (request, response) => {
  const { text } = request.body
  const todo = new Todo({
    text: text
  })
  const savedTodo = await todo.save()
  response.json(savedTodo)  
})

app.get('/todos', async (request, response) => {
  const todos = await Todo.find({})
  response.json(todos)
})

app.get('/todos/:id', async (request, response) => {
  const todo = await Todo.findById(request.params.id)
  if (todo) response.json(todo)
  else response.status(404).end()
})

// Put-reitti lisätty, osa 2
app.put('/todos/:id', async (request, response) => {
    // Haetaan päivityspyynnön runko (request.body), jossa on uusi tehtäväteksti
    const { text } = request.body;

    // Luodaan päivitettävä tehtäväobjekti
    const todo = {
        text: text
    };

    // Etsitään tehtävä tietokannasta ID:n perusteella ja päivitetään sen tiedot
    const filter = { _id: request.params.id }; // Hae tehtävä ID:llä
    const updatedTodo = await Todo.findOneAndUpdate(filter, todo, {
        new: true // Palautetaan päivitetty tehtävä
    });

    // Palautetaan päivitetty tehtävä vastauksena
    response.json(updatedTodo);
});

app.delete('/todos/:id', async (request, response) => {
  const doc = await Todo.findById(request.params.id);
  if (doc) {
      await doc.deleteOne()
      response.json(doc)
    }
    else response.status(404).end()
})

// app listen port 3000
app.listen(port, () => {
  console.log('Example app listening on port 3000')
})
