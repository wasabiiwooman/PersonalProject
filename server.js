const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config()

mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/*-----------Schema Declarations------------*/
let exerciseSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
});

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSchema]
})

let Exercise = mongoose.model('Exercise', exerciseSchema);
let User = mongoose.model('User', userSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// App Methods
app.post('/api/users', bodyParser.urlencoded({extended: false}), (req, res) => {
  let newUser = new User({username: req.body.username})

  newUser.save((err, data) => {
    if(err) {
      console.errror(err)
    } else {
      let resObject = {}
      resObject['username'] = data.username
      resObject['_id'] = data._id
      res.json(resObject)
    }
  })
})

app.get('/api/users', (req, res) => {
  User.find({}, (err, userArray) => {
    if (err) {
      console.error(err)
    } else {
      res.json(userArray)
    }
  })
})

app.post('/api/users/:_id/exercises', bodyParser.urlencoded({extended: false}),(req, res) => {
  let newExercise = new Exercise({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
  })

  if (newExercise.date === '') {
    newExercise.date = new Date().toISOString().substring(0, 10)
  }

  let inputId = req.params._id

  User.findByIdAndUpdate(
    inputId, 
    {$push: {log: newExercise}}, 
    {new: true},
    (err, userData) => {
    if (err) {
      console.error(err)
    } else {
      let resObject = {}
      resObject['_id'] = inputId
      resObject['username'] = userData.username
      resObject['description'] = newExercise.description
      resObject['duration'] = newExercise.duration
      resObject['date'] = new Date(newExercise.date).toDateString()
      res.json(resObject)
    }
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  let inputId = req.params._id

  User.findOne()
  User.findById(inputId, (err, userData) => {
    if (err) {
      console.error(err)
    } else {
      let resObject = userData
      resObject['count'] = userData.log.length
      res.json(resObject)
    }
  })
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
